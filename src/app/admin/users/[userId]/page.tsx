
"use client";

import { useMemo, useState } from "react";
import { useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, orderBy } from "firebase/firestore";
import { Loader2, Search, DollarSign, ArrowLeft, Landmark } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Transaction, User } from "@/lib/data";
import { format, parseISO } from "date-fns";
import PaymentIcon from "@/components/PaymentIcons";
import { TransactionDetailsDialog } from "@/components/TransactionDetailsDialog";
import { UserDetailsForm } from "@/components/UserDetailsForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const getStatusVariant = (status: Transaction["status"]) => {
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

const UserDetailsPage = ({ params }: { params: { userId: string } }) => {
  const { userId } = params;
  const firestore = useFirestore();

  const userRef = useMemoFirebase(
    () => (firestore ? doc(firestore, "users", userId) : null),
    [firestore, userId]
  );
  const { data: userData, isLoading: isUserLoading } = useDoc<User>(userRef);

  const transactionsRef = useMemoFirebase(
    () =>
      firestore ? collection(firestore, `users/${userId}/transactions`) : null,
    [firestore, userId]
  );
  const transactionsQuery = useMemoFirebase(
    () =>
      transactionsRef ? query(transactionsRef, orderBy("transactionDate", "desc")) : null,
    [transactionsRef]
  );
  const { data: transactions, isLoading: areTransactionsLoading } =
    useCollection<Transaction>(transactionsQuery);

  if (isUserLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-semibold">User not found</h2>
        <p className="text-muted-foreground">
          Could not find a user with ID: {userId}
        </p>
      </div>
    );
  }
  
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  }
  
  const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(' ');
  
  const getWithdrawalCurrency = (tx: Transaction) => {
    if (tx.transactionType === 'CARD_TOP_UP' || tx.withdrawalMethod === 'Wallet Balance') return 'USD';
    return 'BDT';
  }


  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">User Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
           <Card>
            <CardHeader className="items-center text-center">
               <Avatar className="w-24 h-24 text-4xl mb-2">
                 <AvatarFallback>{getInitials(fullName || userData.email)}</AvatarFallback>
               </Avatar>
              <CardTitle>{fullName || userData.username}</CardTitle>
              <CardDescription>{userData.email}</CardDescription>
              <Badge variant={userData.role === 'admin' ? 'destructive' : 'secondary'}>{userData.role || 'user'}</Badge>
            </CardHeader>
             <CardContent>
                <div className="p-4 rounded-lg bg-muted">
                    <div className="text-sm text-muted-foreground">Wallet Balance</div>
                    <div className="text-2xl font-bold">{(userData.walletBalance ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</div>
                </div>
                <UserDetailsForm userData={userData} userId={userId} />
             </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                All transactions associated with this user.
              </CardDescription>
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
                  {areTransactionsLoading && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        <div className="flex justify-center items-center p-4">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {!areTransactionsLoading &&
                    (!transactions || transactions.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          No transactions found for this user.
                        </TableCell>
                      </TableRow>
                    )}
                  {!areTransactionsLoading &&
                    transactions?.map((tx) => (
                      <TransactionDetailsDialog key={tx.id} transaction={tx}>
                        <TableRow className="cursor-pointer">
                          <TableCell className="font-medium">
                            {format(parseISO(tx.transactionDate), "PPp")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <PaymentIcon
                                id={tx.paymentMethod.toLowerCase()}
                                className="h-5 w-5"
                              />
                              <span>{tx.paymentMethod}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {tx.transactionType === "CARD_TOP_UP" || tx.withdrawalMethod === "Wallet Balance" ? (
                                <DollarSign className="h-5 w-5 text-primary" />
                              ) : (
                                <PaymentIcon
                                  id={tx.withdrawalMethod.toLowerCase()}
                                  className="h-5 w-5"
                                />
                              )}
                              <span>{tx.withdrawalMethod}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-mono">
                              {tx.amount.toFixed(2)} {tx.currency} &rarr;{" "}
                              {tx.receivedAmount.toFixed(2)}{" "}
                              {getWithdrawalCurrency(tx)}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={getStatusVariant(tx.status)}>
                              {tx.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      </TransactionDetailsDialog>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsPage;
