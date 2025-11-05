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
import type { Transaction, TransactionStatus } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import PaymentIcon from '@/components/PaymentIcons';
import { format, parseISO } from 'date-fns';
import { ReactNode, useState } from 'react';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';

type TransactionWithId = Transaction & { id: string };

interface TransactionDetailsDialogProps {
  transaction: TransactionWithId;
  children: ReactNode; // The trigger element
}

export function TransactionDetailsDialog({ transaction: tx, children }: TransactionDetailsDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

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

  const handleStatusUpdate = (newStatus: TransactionStatus) => {
    if (!firestore) return;

    const transactionRef = doc(firestore, `users/${tx.userId}/transactions/${tx.id}`);
    
    updateDocumentNonBlocking(transactionRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });

    toast({
      title: "Status Updated",
      description: `Transaction status changed to ${newStatus}.`,
      className: "bg-accent text-accent-foreground",
    });

    setIsOpen(false);
  };


  const DetailRow = ({ label, value }: { label: string; value: ReactNode }) => (
    <div className="flex justify-between items-start">
      <dt className="text-muted-foreground">{label}</dt>
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
            Order ID: {tx.id}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <dl className="space-y-2">
            <DetailRow label="Date" value={format(parseISO(tx.transactionDate), 'PPp')} />
            <DetailRow 
              label="Status" 
              value={<Badge className={getStatusVariant(tx.status)}>{tx.status}</Badge>} 
            />
             <DetailRow label="User ID" value={tx.userId} />
            <div className="pt-2">
                <DetailRow 
                label="You Sent" 
                value={
                    <div className="flex items-center gap-2 justify-end">
                        <span>{tx.amount.toFixed(2)} {tx.currency}</span>
                        <PaymentIcon id={tx.paymentMethod.toLowerCase()} className="h-5 w-5"/>
                    </div>
                } 
                />
                 <DetailRow 
                label="You Received" 
                value={
                    <div className="flex items-center gap-2 justify-end">
                        <span>{tx.receivedAmount.toFixed(2)} BDT</span>
                         <PaymentIcon id={tx.withdrawalMethod.toLowerCase()} className="h-5 w-5"/>
                    </div>
                } 
                />
            </div>
            <div className="pt-2 border-t mt-2">
              <DetailRow label="From Account" value={tx.sendingAccountId} />
              <DetailRow label="Gateway Trx ID" value={tx.transactionId} />
              <DetailRow label="To Account" value={tx.receivingAccountId} />
            </div>
          </dl>
        </div>
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
      </DialogContent>
    </Dialog>
  );
}
