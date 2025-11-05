
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import type { Transaction } from "@/lib/data";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";
import PaymentIcon from "@/components/PaymentIcons";
import { TransactionDetailsDialog } from "@/components/TransactionDetailsDialog";

const getStatusVariant = (status: Transaction["status"]) => {
  switch (status) {
    case "Completed":
      return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200";
    case "Pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200";
    case "Cancelled":
      return "bg-red-100 text-red-800 border-red-200 hover:bg-red-200";
    default:
      return "outline";
  }
};

const CardTopUpHistoryPage = () => {
  const firestore = useFirestore();
  const { user } = useUser();

  const topUpsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, `users/${user.uid}/transactions`),
      where("transactionType", "==", "CARD_TOP_UP"),
      orderBy("transactionDate", "desc")
    );
  }, [firestore, user]);

  const { data: topUps, isLoading } = useCollection<Transaction>(topUpsQuery);

  return (
    <div className="space-y-6">
       <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl">
          Top-Up History
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          View all your previous card top-up transactions.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your Top-Up Requests</CardTitle>
          <CardDescription>
            A list of all your card funding transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount Sent</TableHead>
                <TableHead>Top Up (USD)</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    <div className="flex justify-center items-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading history...</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && (!topUps || topUps.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    You have not made any top-up requests yet.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                topUps?.map((topUp) => (
                  <TransactionDetailsDialog key={topUp.id} transaction={topUp}>
                    <TableRow key={topUp.id} className="cursor-pointer">
                      <TableCell>
                        {format(parseISO(topUp.transactionDate), "PPp")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PaymentIcon id={topUp.paymentMethod.toLowerCase()} className="h-5 w-5"/>
                          <span>{topUp.amount.toFixed(2)} {topUp.currency}</span>
                        </div>
                      </TableCell>
                       <TableCell className="font-semibold text-green-600">
                        ${topUp.receivedAmount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={getStatusVariant(topUp.status)}>
                          {topUp.status}
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
  );
};

export default CardTopUpHistoryPage;
