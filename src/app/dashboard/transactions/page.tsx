
"use client";

import { useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PaymentIcon from "@/components/PaymentIcons";
import { format, parseISO } from 'date-fns';
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { Transaction } from "@/lib/data";
import { TransactionDetailsDialog } from "@/components/TransactionDetailsDialog";
import { DollarSign, Landmark } from 'lucide-react';

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

const UserTransactionsPage = () => {
  const firestore = useFirestore();
  const { user } = useUser();

  const userTransactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, `users/${user.uid}/transactions`),
      orderBy('transactionDate', 'desc')
    );
  }, [firestore, user]);

  const { data: userTransactions, isLoading } = useCollection<Transaction>(userTransactionsQuery);
  
  const getWithdrawalCurrency = (tx: Transaction) => {
    if (tx.transactionType === 'CARD_TOP_UP' || tx.withdrawalMethod === 'Wallet Balance') {
      return 'USD';
    }
    return 'BDT';
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Your Transactions</h1>
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Send</TableHead>
                <TableHead>Receive</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Loading your transactions...</TableCell>
                </TableRow>
              )}
               {!isLoading && (!userTransactions || userTransactions.length === 0) && (
                 <TableRow>
                  <TableCell colSpan={5} className="text-center">You have no transactions yet.</TableCell>
                </TableRow>
              )}
              {!isLoading && userTransactions && userTransactions.map((tx) => (
                <TransactionDetailsDialog key={tx.id} transaction={tx}>
                  <TableRow className="cursor-pointer">
                    <TableCell className="font-medium">{format(parseISO(tx.transactionDate), 'PPp')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                         <PaymentIcon id={tx.paymentMethod.toLowerCase()} className="h-5 w-5"/>
                         <span>{tx.paymentMethod}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2">
                        {tx.transactionType === 'CARD_TOP_UP' ? (
                          <DollarSign className="h-5 w-5 text-primary" />
                        ) : tx.transactionType === 'ADD_FUNDS' ? (
                          <Landmark className="h-5 w-5 text-primary" />
                        ) : (
                          <PaymentIcon id={tx.withdrawalMethod.toLowerCase()} className="h-5 w-5"/>
                        )}
                         <span>{tx.withdrawalMethod}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-mono">
                        {tx.amount.toFixed(2)} {tx.currency} &rarr;{' '}
                        {tx.receivedAmount.toFixed(2)}{' '}
                        {getWithdrawalCurrency(tx)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getStatusVariant(tx.status)}>{tx.status}</Badge>
                    </TableCell>
                  </TableRow>
                </TransactionDetailsDialog>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserTransactionsPage;
