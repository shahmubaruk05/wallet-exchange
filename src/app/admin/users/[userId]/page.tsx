
"use client";

import { useMemo } from "react";
import { notFound, useParams } from "next/navigation";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PaymentIcon from "@/components/PaymentIcons";
import { format, parseISO } from "date-fns";
import { useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, orderBy } from "firebase/firestore";
import type { User, Transaction, TransactionStatus } from "@/lib/data";
import { Loader2, DollarSign } from "lucide-react";
import { TransactionDetailsDialog } from "@/components/TransactionDetailsDialog";
import { UserDetailsForm } from "@/components/UserDetailsForm";

const getStatusVariant = (status: TransactionStatus) => {
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

const AdminUserDetailsPage = () => {
  const firestore = useFirestore();
  const params = useParams();
  const userId = params.userId as string;

  const userDocRef = useMemoFirebase(
    () => (firestore && userId ? doc(firestore, `users/${userId}`) : null),
    [firestore, userId]
  );
  const { data: userData, isLoading: isUserLoading } = useDoc<User>(userDocRef);

  const transactionsQuery = useMemoFirebase(
    () =>
      firestore && userId
        ? query(
            collection(firestore, `users/${userId}/transactions`),
            orderBy("transactionDate", "desc")
          )
        : null,
    [firestore, userId]
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

  if (!userData && !isUserLoading) {
    notFound();
  }

  const userDisplayName =
    userData?.firstName || userData?.lastName
      ? `${userData.firstName || ""} ${userData.lastName || ""}`.trim()
      : userData?.email;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">User Details: {userDisplayName}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">User ID</dt>
                  <dd className="font-mono">{userData?.id}</dd>
                </div>
                 <div className="flex justify-between">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="font-medium">{userData?.email}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Wallet Balance</dt>
                  <dd className="font-semibold text-green-600">
                    ${(userData?.walletBalance ?? 0).toFixed(2)}
                  </dd>
                </div>
              </dl>
              {userData && <UserDetailsForm userData={userData} userId={userId} />}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                A list of the user's recent transactions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {areTransactionsLoading && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  )}
                  {!areTransactionsLoading &&
                    (!transactions || transactions.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          No transactions found for this user.
                        </TableCell>
                      </TableRow>
                    )}
                  {!areTransactionsLoading &&
                    transactions?.map((tx) => (
                      <TransactionDetailsDialog key={tx.id} transaction={tx}>
                        <TableRow className="cursor-pointer">
                          <TableCell>
                            {format(parseISO(tx.transactionDate), "PPp")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <PaymentIcon
                                id={tx.paymentMethod.toLowerCase()}
                                className="h-5 w-5"
                              />
                              <span>&rarr;</span>
                               {tx.transactionType === 'CARD_TOP_UP' ? (
                                <DollarSign className="h-5 w-5 text-primary" />
                              ) : (
                                <PaymentIcon
                                  id={tx.withdrawalMethod.toLowerCase()}
                                  className="h-5 w-5"
                                />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">
                            {tx.amount.toFixed(2)} {tx.currency}
                          </TableCell>
                          <TableCell>
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

export default AdminUserDetailsPage;
