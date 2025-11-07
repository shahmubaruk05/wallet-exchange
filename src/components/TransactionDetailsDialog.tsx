
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
import { Info, DollarSign, Landmark, Copy, Check } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';


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
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});
  const [transactionUser, setTransactionUser] = useState<User | null>(null);
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
      setCopiedStates({});

      const fetchTransactionUser = async () => {
          if (!firestore) return;
          const userRef = doc(firestore, 'users', tx.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
              setTransactionUser({ id: userSnap.id, ...userSnap.data() } as User);
          }
      };

      fetchTransactionUser();
    }
  }, [isOpen, tx.adminNote, tx.userId, firestore]);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [key]: true }));
    toast({ title: 'Copied to clipboard!' });
    setTimeout(() => setCopiedStates(prev => ({...prev, [key]: false})), 2000);
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
        // First, check if the transaction is already completed to avoid double-crediting
        const userTxDoc = await firestoreTransaction.get(userTxRef);
        
        // This is a simple note update
        if (userTxDoc.exists() && userTxDoc.data().status === 'Completed' && newStatus === 'Completed') {
          const updateData = { adminNote, updatedAt: serverTimestamp() };
          firestoreTransaction.update(userTxRef, updateData);
          firestoreTransaction.update(rootTxRef, updateData);
          return;
        }
  
        const updateData = { status: newStatus, adminNote, updatedAt: serverTimestamp() };
        firestoreTransaction.update(userTxRef, updateData);
        firestoreTransaction.update(rootTx2Ref, updateData);
  
        // If the transaction type is ADD_FUNDS and is being marked as Completed
        if (tx.transactionType === 'ADD_FUNDS' && newStatus === 'Completed') {
          // Prevent re-crediting if already completed
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


  const DetailRow = ({ label, value, copyValue, copyKey }: { label: string; value: ReactNode; copyValue?: string; copyKey?: string }) => (
    <div className="flex justify-between items-start py-2 border-b">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-right font-mono text-sm text-foreground break-all flex items-center gap-2">
        <span>{value}</span>
        {copyValue && copyKey && (
           <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleCopy(copyKey, copyValue)}
                className="h-6 w-6"
                aria-label={`Copy ${label}`}
            >
                {copiedStates[copyKey] ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
        )}
      </dd>
    </div>
  );

  const getReceivedCurrency = () => {
    if (tx.transactionType === 'CARD_TOP_UP' || tx.withdrawalMethod === 'Wallet Balance') {
      return 'USD';
    }
    return 'BDT';
  }
  
  const getToAccountDisplay = () => {
    if (tx.transactionType === 'CARD_TOP_UP' && cardApplicationData?.mercuryCardLast4) {
      return `Card Top Up (•••• ${cardApplicationData.mercuryCardLast4})`;
    }
    return tx.receivingAccountId;
  }
  
  const getInitials = (email?: string | null, name?: string | null) => {
    if (name) return name.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
           <div className="text-xs text-muted-foreground pt-1">
             <DetailRow label="Order ID" value={tx.id} copyValue={tx.id} copyKey="orderId"/>
           </div>
        </DialogHeader>
        <div className="space-y-2 py-2 max-h-[60vh] overflow-y-auto pr-2">
          <dl>
            {isAdmin && transactionUser && (
                 <div className="mb-4">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">User Details</h3>
                    <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                        <Avatar>
                            <AvatarFallback>
                                {getInitials(transactionUser.email, transactionUser.username)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-semibold">{transactionUser.username || 'N/A'}</span>
                            <span className="text-xs text-muted-foreground">{transactionUser.email}</span>
                        </div>
                    </div>
                </div>
            )}
            <DetailRow label="Date" value={format(parseISO(tx.transactionDate), 'PPp')} />
            <DetailRow 
              label="Status" 
              value={<Badge className={getStatusVariant(tx.status)}>{tx.status}</Badge>} 
            />
            <div className="pt-2 mt-2 space-y-2">
                <DetailRow 
                label="You Sent" 
                value={
                    <div className="flex items-center gap-2 justify-end">
                        <span>{tx.amount.toFixed(2)} {tx.currency}</span>
                        <PaymentIcon id={tx.paymentMethod.toLowerCase()} className="h-5 w-5"/>
                    </div>
                } 
                />
                 {tx.transactionFee > 0 && (
                  <DetailRow
                    label="Transaction Fee"
                    value={
                      <span className="text-destructive">
                        - {tx.transactionFee.toFixed(2)} {tx.currency}
                      </span>
                    }
                  />
                )}
                 <DetailRow 
                    label="You Received" 
                    value={
                        <div className="flex items-center gap-2 justify-end">
                            <span>{tx.receivedAmount.toFixed(2)} {getReceivedCurrency()}</span>
                            {tx.transactionType === 'CARD_TOP_UP' || tx.withdrawalMethod === 'Wallet Balance' ? (
                              <DollarSign className="h-5 w-5 text-primary" />
                            ) : (
                              <PaymentIcon id={tx.withdrawalMethod.toLowerCase()} className="h-5 w-5"/>
                            )}
                        </div>
                    } 
                />
            </div>
            <div className="pt-2 mt-2">
              <DetailRow label="From Account" value={tx.sendingAccountId} />
              <DetailRow label="Gateway Trx ID" value={tx.transactionId} copyValue={tx.transactionId} copyKey="gatewayTrxId"/>
              <DetailRow label="To Account" value={getToAccountDisplay()} />
            </div>
             {tx.adminNote && (
                <div className="pt-2 mt-2">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Note from Admin</AlertTitle>
                        <AlertDescription className="font-mono text-xs whitespace-pre-wrap break-words">
                            {tx.adminNote}
                        </AlertDescription>
                    </Alert>
                </div>
            )}
          </dl>

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
          <DialogFooter className="flex-wrap gap-2">
            {(["Pending", "Processing", "Completed", "Paid", "Cancelled"] as TransactionStatus[]).map(status => (
              <Button key={status} size="sm" variant="outline" onClick={() => handleStatusUpdate(status)} disabled={tx.status === status}>
                Mark as {status}
              </Button>
            ))}
            <DialogClose asChild>
              <Button type="button" variant="secondary">
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
