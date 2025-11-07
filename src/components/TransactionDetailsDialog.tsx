
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
import { doc, serverTimestamp, runTransaction, increment, getDoc, collection } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, DollarSign, Landmark } from 'lucide-react';
import { usePathname } from 'next/navigation';


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
    }
  }, [isOpen, tx]);


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
    const userTxRef = doc(firestore, `users/${tx.userId}/transactions`, tx.id);
  
    try {
      await runTransaction(firestore, async (firestoreTransaction) => {
        // --- READS FIRST ---
        const rootTxDoc = await firestoreTransaction.get(rootTxRef);
        const userTxDoc = await firestoreTransaction.get(userTxRef);
  
        const originalStatus = rootTxDoc.exists() ? rootTxDoc.data().status : (userTxDoc.exists() ? userTxDoc.data().status : null);
        const alreadyCompleted = originalStatus === 'Completed';
  
        // --- WRITES SECOND ---
        const updateData = { 
          status: newStatus, 
          adminNote, 
          updatedAt: serverTimestamp() 
        };
  
        // 1. Update the root transaction document if it exists
        if (rootTxDoc.exists()) {
          firestoreTransaction.update(rootTxRef, updateData);
        }
  
        // 2. Update the user's subcollection document if it exists
        if (userTxDoc.exists()) {
          firestoreTransaction.update(userTxRef, updateData);
        }
  
        // 3. Handle balance updates if moving to "Completed" for the first time
        if (newStatus === 'Completed' && !alreadyCompleted) {
          const isDeposit = tx.transactionType === 'ADD_FUNDS' || (tx.transactionType === 'EXCHANGE' && tx.withdrawalMethod === 'Wallet Balance');
          if (isDeposit) {
            const targetUserRef = doc(firestore, 'users', tx.userId);
            // No need to read the user doc again if we just increment
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

  const DetailRow = ({ label, value }: { label: string; value: ReactNode }) => (
    <div className="flex justify-between items-start border-b pb-2 mb-2">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-right font-mono text-sm text-foreground break-all">{value}</dd>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>
            ID: {tx.id}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          <dl className="space-y-2">
            <DetailRow label="Status" value={<Badge className={getStatusVariant(tx.status)}>{tx.status}</Badge>} />
            <DetailRow label="Date" value={format(parseISO(tx.transactionDate), 'PPp')} />
            <DetailRow label="Sent" value={<div className="flex items-center justify-end gap-2"><PaymentIcon id={tx.paymentMethod.toLowerCase()} className="h-5 w-5" /><span>{tx.amount.toFixed(2)} {tx.currency}</span></div>} />
            <DetailRow label="Received" value={<div className="flex items-center justify-end gap-2">
                {tx.transactionType === 'CARD_TOP_UP' ? <DollarSign className="h-5 w-5 text-primary" /> : tx.transactionType === 'ADD_FUNDS' ? <Landmark className="h-5 w-5 text-primary" /> : <PaymentIcon id={tx.withdrawalMethod.toLowerCase()} className="h-5 w-5" />}
                <span>{tx.receivedAmount.toFixed(2)} {getReceivedCurrency()}</span>
            </div>} />
            <DetailRow label="From Account" value={tx.sendingAccountId} />
            <DetailRow label="To Account" value={tx.receivingAccountId} />
            <DetailRow label="Transaction ID" value={tx.transactionId} />
            <DetailRow label="Fee" value={`${(tx.transactionFee ?? 0).toFixed(2)} ${tx.currency}`} />
          </dl>
          {tx.adminNote && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Note from Admin</AlertTitle>
              <AlertDescription>
                {tx.adminNote}
              </AlertDescription>
            </Alert>
          )}
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
            {(["Pending", "Processing", "Paid", "Completed", "Cancelled"] as TransactionStatus[]).map(status => (
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
