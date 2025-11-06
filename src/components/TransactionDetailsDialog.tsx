
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
import type { Transaction, TransactionStatus, User } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import PaymentIcon from '@/components/PaymentIcons';
import { format, parseISO } from 'date-fns';
import { ReactNode, useState, useEffect, useMemo } from 'react';
import { useFirestore, updateDocumentNonBlocking, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, runTransaction, increment } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, DollarSign, Landmark } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

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
  
  // Determine if the user is an admin based on their role AND the current path.
  // The controls should only ever be visible on the /admin path.
  const isAdmin = useMemo(() => {
    const userIsAdmin = (userData as any)?.role === 'admin';
    const onAdminPage = pathname.startsWith('/admin');
    return userIsAdmin && onAdminPage;
  }, [userData, pathname]);


  useEffect(() => {
    if (isOpen) {
      setAdminNote(tx.adminNote || '');
    }
  }, [isOpen, tx.adminNote]);

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
    if (!firestore) return;

    const transactionRef = doc(firestore, `users/${tx.userId}/transactions/${tx.id}`);
    const targetUserRef = doc(firestore, `users/${tx.userId}`);

    try {
        await runTransaction(firestore, async (firestoreTransaction) => {
            // 1. Update the transaction status and admin note
            firestoreTransaction.update(transactionRef, {
                status: newStatus,
                adminNote: adminNote,
                updatedAt: serverTimestamp(),
            });

            // 2. If completing an "ADD_FUNDS" transaction, update the user's wallet balance
            if (tx.transactionType === 'ADD_FUNDS' && newStatus === 'Completed') {
                firestoreTransaction.update(targetUserRef, {
                    walletBalance: increment(tx.receivedAmount)
                });
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


  const DetailRow = ({ label, value, className }: { label: string; value: ReactNode, className?: string }) => (
    <div className={cn("flex justify-between items-start", className)}>
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-right font-mono text-sm text-foreground break-all">{value}</dd>
    </div>
  );

  const getReceivedCurrency = () => {
    if (tx.transactionType === 'CARD_TOP_UP' || tx.withdrawalMethod === 'Wallet Balance') {
      return 'USD';
    }
    return 'BDT';
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>
            Order ID: {tx.id}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <dl className="space-y-2">
            <DetailRow label="Date" value={format(parseISO(tx.transactionDate), 'PPp')} />
            <DetailRow 
              label="Status" 
              value={<Badge className={getStatusVariant(tx.status)}>{tx.status}</Badge>} 
            />
             <DetailRow label="User ID" value={tx.userId} />
            <div className="pt-2 border-t mt-2 space-y-2">
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
            <div className="pt-2 border-t mt-2">
              <DetailRow label="From Account" value={tx.sendingAccountId} />
              <DetailRow label="Gateway Trx ID" value={tx.transactionId} />
              <DetailRow label="To Account" value={tx.receivingAccountId} />
            </div>
             {tx.adminNote && (
                <div className="pt-2 border-t mt-2">
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

    