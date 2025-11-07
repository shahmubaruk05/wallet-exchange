
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import type { Transaction, TransactionStatus, User, CardApplication } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import PaymentIcon from '@/components/PaymentIcons';
import { format, parseISO } from 'date-fns';
import { ReactNode, useState, useEffect, useMemo } from 'react';
import { useFirestore, updateDocumentNonBlocking, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, runTransaction, increment, getDoc, collection, addDoc } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, DollarSign, Landmark, Copy, Check, ArrowRight, User as UserIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from './ui/separator';


type TransactionWithId = Transaction & { id: string };

interface TransactionDetailsDialogProps {
  transaction: TransactionWithId;
  children: ReactNode; // The trigger element
}

export function TransactionDetailsDialog({ transaction: tx, children }: TransactionDetailsDialogProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [adminNote, setAdminNote] = useState(tx.adminNote || '');
  const [copied, setCopied] = useState(false);

  const [transactionUser, setTransactionUser] = useState<User | null>(null);
  const [recipientUser, setRecipientUser] = useState<User | null>(null);

  const pathname = usePathname();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [firestore, user]);

  const { data: userData } = useDoc(userDocRef);

  const cardApplicationRef = useMemoFirebase(() => {
    if (!firestore || tx.transactionType !== 'CARD_TOP_UP') return null;
    return doc(firestore, 'card_applications', tx.userId);
  }, [firestore, tx.userId, tx.transactionType]);

  const { data: cardApplicationData } = useDoc<CardApplication>(cardApplicationRef);
  
  const isAdmin = useMemo(() => {
    const userIsAdmin = (userData as any)?.role === 'admin';
    const onAdminPage = pathname.startsWith('/admin');
    return userIsAdmin && onAdminPage;
  }, [userData, pathname]);


  useEffect(() => {
    if (isOpen) {
      setAdminNote(tx.adminNote || '');
      setCopied(false);

      const fetchUsers = async () => {
          if (!firestore) return;
          // Fetch sender/transaction user
          const userRef = doc(firestore, 'users', tx.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
              setTransactionUser({ id: userSnap.id, ...userSnap.data() } as User);
          }
          // Fetch recipient if it's a transfer
          if (tx.transactionType === 'WALLET_TRANSFER' && tx.transferDetails?.recipientId) {
             const recipientRef = doc(firestore, 'users', tx.transferDetails.recipientId);
             const recipientSnap = await getDoc(recipientRef);
             if (recipientSnap.exists()) {
                setRecipientUser({ id: recipientSnap.id, ...recipientSnap.data() } as User);
             }
          }
      };

      fetchUsers();
    }
  }, [isOpen, tx, firestore]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: 'Copied to clipboard!' });
    setTimeout(() => setCopied(false), 2000);
  };


  const getStatusVariant = (status: Transaction['status']) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200";
      case "Processing":
        return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200";
      case "Paid":
         return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200";
      case "Pending":
         return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200";
      case "Cancelled":
          return "bg-red-100 text-red-800 border-red-200 hover:bg-red-200";
      default:
        return "outline";
    }
  };

  const handleStatusUpdate = async (newStatus: TransactionStatus) => {
    if (!firestore || !user || tx.status === newStatus) return;
  
    const rootTxRef = doc(firestore, 'transactions', tx.id);
    const userTxRef = doc(firestore, `users/${tx.userId}/transactions/${tx.id}`);
    const targetUserRef = doc(firestore, 'users', tx.userId);
  
    try {
      await runTransaction(firestore, async (firestoreTransaction) => {
        const userTxDoc = await firestoreTransaction.get(userTxRef);
        
        if (userTxDoc.exists() && userTxDoc.data().status === 'Completed' && newStatus === 'Completed') {
          const updateData = { adminNote, updatedAt: serverTimestamp() };
          firestoreTransaction.update(userTxRef, updateData);
          if (isAdmin) firestoreTransaction.update(rootTxRef, updateData);
          return;
        }
  
        const updateData = { status: newStatus, adminNote, updatedAt: serverTimestamp() };
        firestoreTransaction.update(userTxRef, updateData);
        if (isAdmin) firestoreTransaction.update(rootTxRef, updateData);
  
        if ((tx.transactionType === 'ADD_FUNDS' || tx.transactionType === 'EXCHANGE' && tx.withdrawalMethod === 'Wallet Balance') && newStatus === 'Completed') {
          if (userTxDoc.exists() && userTxDoc.data().status !== 'Completed') {
            firestoreTransaction.update(targetUserRef, {
              walletBalance: increment(tx.receivedAmount)
            });
          }
        }
      });
  
      toast({
        title: "Update Successful",
        description: `Transaction status changed to ${newStatus}.`,
        className: "bg-accent text-accent-foreground",
      });
  
      setIsOpen(false);
    } catch (error) {
      console.error("Transaction update failed: ", error);
      toast({
        title: "Update Failed",
        description: "Could not update the transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getReceivedCurrency = () => {
    if (tx.transactionType === 'CARD_TOP_UP' || tx.withdrawalMethod === 'Wallet Balance') {
      return 'USD';
    }
    return tx.currency === 'USD' ? 'BDT' : 'USD';
  }
  
  const getInitials = (email?: string | null, name?: string | null) => {
    if (name) return name.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return '?';
  };

  const amountPrefix = (tx.transactionType === 'ADD_FUNDS' || (tx.transactionType === 'WALLET_TRANSFER' && user?.uid === tx.transferDetails?.recipientId)) ? '+' : '-';
  const amountColor = amountPrefix === '+' ? 'text-green-600' : 'text-red-600';


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center">
           <DialogTitle className="text-4xl font-bold">{amountPrefix}{tx.receivedAmount.toLocaleString('en-US', { style: 'currency', currency: getReceivedCurrency() })}</DialogTitle>
          <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Badge className={cn("capitalize", getStatusVariant(tx.status))}>{tx.status}</Badge>
            <span>•</span>
            <span>{format(parseISO(tx.transactionDate), 'PPp')}</span>
          </div>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            
            <div className="grid grid-cols-2 gap-4 text-sm">
                {/* From */}
                <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">From</span>
                     <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback>{getInitials(transactionUser?.email, transactionUser?.username)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-semibold">{transactionUser?.username || 'User'}</span>
                            <span className="text-xs text-muted-foreground">{transactionUser?.email}</span>
                        </div>
                    </div>
                </div>

                {/* To */}
                <div className="flex flex-col gap-1 text-right">
                     <span className="text-muted-foreground">To</span>
                     <div className="flex items-center gap-2 justify-end">
                        <div className="flex flex-col">
                            <span className="font-semibold">
                                {tx.transactionType === 'WALLET_TRANSFER' ? (recipientUser?.username || tx.transferDetails?.recipientEmail) : tx.withdrawalMethod}
                            </span>
                            {tx.transactionType === 'WALLET_TRANSFER' && <span className="text-xs text-muted-foreground">{recipientUser?.email}</span>}
                        </div>
                        <Avatar className="h-8 w-8">
                            <AvatarFallback>
                                {tx.transactionType === 'WALLET_TRANSFER' ? getInitials(recipientUser?.email, recipientUser?.username) : <ArrowRight />}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </div>

            <Separator />
            
            <div className="space-y-2 text-sm">
                <h3 className="font-semibold">Amount Breakdown</h3>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Sent Amount</span>
                    <span>{tx.amount.toLocaleString('en-US', { style: 'currency', currency: tx.currency })}</span>
                </div>
                {tx.transactionFee > 0 && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Fees</span>
                        <span className="text-red-500">- {tx.transactionFee.toLocaleString('en-US', { style: 'currency', currency: tx.currency })}</span>
                    </div>
                )}
                 <div className="flex justify-between font-semibold">
                    <span className="text-muted-foreground">Total Debited</span>
                    <span>{(tx.amount + tx.transactionFee).toLocaleString('en-US', { style: 'currency', currency: tx.currency })}</span>
                </div>
                 <div className="flex justify-between font-bold text-base pt-2 border-t">
                    <span>Receiver Gets</span>
                    <span>{tx.receivedAmount.toLocaleString('en-US', { style: 'currency', currency: getReceivedCurrency() })}</span>
                </div>
            </div>
            
             <Separator />

             <div className="space-y-2 text-sm">
                 <h3 className="font-semibold">Metadata</h3>
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Transaction ID</span>
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{tx.id}</span>
                         <Button
                            type="button" variant="ghost" size="icon" className="h-6 w-6"
                            onClick={() => handleCopy(tx.id)}
                         >
                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Payment Method</span>
                    <span className="font-semibold flex items-center gap-2">
                        <PaymentIcon id={tx.paymentMethod.toLowerCase()} className="h-4 w-4" /> {tx.paymentMethod}
                    </span>
                </div>
                {tx.transactionId && tx.transactionId.length > 5 && (
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Gateway ID</span>
                        <span className="font-mono text-xs">{tx.transactionId}</span>
                    </div>
                )}
             </div>

          {isAdmin && (
            <div className="pt-4 border-t space-y-2">
                 <Label htmlFor="admin-note">Admin Note (visible to user)</Label>
                 <Textarea 
                    id="admin-note"
                    placeholder="Add a note or proof link here..."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                 />
            </div>
          )}
        </div>
        
        {isAdmin ? (
          <DialogFooter className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(["Pending", "Processing", "Completed", "Cancelled"] as TransactionStatus[]).map(status => (
              <Button key={status} size="sm" variant="outline" onClick={() => handleStatusUpdate(status)} disabled={tx.status === status}>
                Mark {status}
              </Button>
            ))}
            <DialogClose asChild>
              <Button type="button" variant="secondary" className="col-span-full">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        ) : (
            <DialogFooter>
                 <DialogClose asChild>
                    <Button type="button" variant="secondary">
                        Close
                    </Button>
                </DialogClose>
            </DialogFooter>
        )}

      </DialogContent>
    </Dialog>
  );
}
