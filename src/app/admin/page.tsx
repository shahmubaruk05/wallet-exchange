"use client";

import { useMemo } from "react";
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
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, collectionGroup } from "firebase/firestore";
import type { Transaction, TransactionStatus } from "@/lib/data";

const getStatusVariant = (status: TransactionStatus) => {
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

const AdminPage = () => {
  const firestore = useFirestore();

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Query the 'transactions' collection group to get all transactions across all users
    return query(collectionGroup(firestore, 'transactions'), orderBy('transactionDate', 'desc'));
  }, [firestore]);

  const { data: allTransactions, isLoading } = useCollection<Omit<Transaction, 'id'>>(transactionsQuery);

  const sortedTransactions = useMemo(() => {
    if (!allTransactions) return [];
    return [...allTransactions].sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
  }, [allTransactions]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Transaction History</h1>
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Send</TableHead>
                <TableHead>Receive</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Loading transactions...</TableCell>
                </TableRow>
              )}
              {!isLoading && sortedTransactions.length === 0 && (
                 <TableRow>
                  <TableCell colSpan={6} className="text-center">No transactions found.</TableCell>
                </TableRow>
              )}
              {!isLoading && sortedTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">{format(parseISO(tx.transactionDate), 'PPp')}</TableCell>
                  <TableCell className="font-mono text-xs">{tx.userId}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <PaymentIcon id={tx.paymentMethod.toLowerCase()} className="h-5 w-5"/>
                       <span>{tx.paymentMethod}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                     <div className="flex items-center gap-2">
                       <PaymentIcon id={tx.withdrawalMethod.toLowerCase()} className="h-5 w-5"/>
                       <span>{tx.withdrawalMethod}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-mono">
                      {tx.amount.toFixed(2)} {tx.currency} &rarr; {tx.receivedAmount.toFixed(2)} BDT
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={getStatusVariant(tx.status)}>{tx.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPage;
