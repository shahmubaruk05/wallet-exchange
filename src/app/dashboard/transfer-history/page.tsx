
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from 'date-fns';
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, where } from "firebase/firestore";
import type { Transaction, User } from "@/lib/data";
import { TransactionDetailsDialog } from "@/components/TransactionDetailsDialog";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowRight } from 'lucide-react';

const getStatusVariant = (status: Transaction['status']) => {
  switch (status) {
    case 'Completed':
      return 'bg-accent/20 text-accent-foreground hover:bg-accent/30';
    default:
      return 'outline';
  }
};

const UserTransferHistoryPage = () => {
  const firestore = useFirestore();
  const { user } = useUser();

  const userTransactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, `users/${user.uid}/transactions`),
      where("transactionType", "==", "WALLET_TRANSFER"),
      orderBy('transactionDate', 'desc')
    );
  }, [firestore, user]);

  const { data: userTransactions, isLoading } = useCollection<Transaction>(userTransactionsQuery);

  const getInitials = (email: string) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Transfer History</h1>
      <Card>
        <CardHeader>
          <CardTitle>Your Wallet Transfers</CardTitle>
           <CardDescription>A record of all funds sent and received from other users.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">Loading your transfers...</TableCell>
                </TableRow>
              )}
               {!isLoading && (!userTransactions || userTransactions.length === 0) && (
                 <TableRow>
                  <TableCell colSpan={4} className="text-center">You have no wallet transfers yet.</TableCell>
                </TableRow>
              )}
              {!isLoading && userTransactions && userTransactions.map((tx) => {
                const isSender = tx.transferDetails?.senderId === user?.uid;
                const otherPartyEmail = isSender ? tx.transferDetails?.recipientEmail : tx.transferDetails?.senderEmail;
                
                return (
                    <TransactionDetailsDialog key={tx.id} transaction={tx}>
                    <TableRow className="cursor-pointer">
                        <TableCell className="font-medium">{format(parseISO(tx.transactionDate), 'PPp')}</TableCell>
                        <TableCell>
                        <div className="flex items-center gap-3">
                           <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                    {getInitials(user?.email || '')}
                                </AvatarFallback>
                            </Avatar>
                            <ArrowRight className="h-4 w-4 text-muted-foreground"/>
                             <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                    {getInitials(otherPartyEmail || '')}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">{isSender ? 'You sent to' : 'You received from'}</span>
                                <span className="text-xs text-muted-foreground">{otherPartyEmail}</span>
                            </div>
                        </div>
                        </TableCell>
                       
                        <TableCell className="text-right">
                        <div className={`font-mono font-semibold ${isSender ? 'text-destructive' : 'text-green-600'}`}>
                           {isSender ? '-' : '+'} {tx.amount.toFixed(2)} {tx.currency}
                        </div>
                        </TableCell>
                        <TableCell className="text-center">
                        <Badge className={getStatusVariant(tx.status)}>{tx.status}</Badge>
                        </TableCell>
                    </TableRow>
                    </TransactionDetailsDialog>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserTransferHistoryPage;
