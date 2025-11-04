'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Transaction } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import PaymentIcon from '@/components/PaymentIcons';
import { format, parseISO } from 'date-fns';
import { ReactNode } from 'react';

// Make all fields from Transaction available, plus the Firestore document ID
type TransactionWithId = Transaction & { id: string };

interface TransactionDetailsDialogProps {
  transaction: TransactionWithId;
  children: ReactNode; // The trigger element
}

export function TransactionDetailsDialog({ transaction: tx, children }: TransactionDetailsDialogProps) {
  const getStatusVariant = (status: Transaction['status']) => {
    switch (status) {
      case 'Completed':
        return 'bg-accent/20 text-accent-foreground hover:bg-accent/30';
      case 'Processing':
        return 'default';
      case 'Paid':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const DetailRow = ({ label, value }: { label: string; value: ReactNode }) => (
    <div className="flex justify-between items-start">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-mono text-sm text-foreground break-all">{value}</dd>
    </div>
  );

  return (
    <Dialog>
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
      </DialogContent>
    </Dialog>
  );
}
