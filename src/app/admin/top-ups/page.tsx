
"use client";

import { useState, useMemo } from "react";
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
import { Button } from "@/components/ui/button";
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import type { CardTopUp, CardTopUpStatus } from "@/lib/data";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PaymentIcon from "@/components/PaymentIcons";

const getStatusVariant = (status: CardTopUp["status"]) => {
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

const AdminTopUpPage = () => {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const topUpsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "card_top_ups"),
      orderBy("createdAt", "desc")
    );
  }, [firestore]);

  const { data: topUps, isLoading } = useCollection<CardTopUp>(topUpsQuery);

  const handleStatusUpdate = (topUpId: string, newStatus: CardTopUpStatus) => {
    if (!firestore) return;
    const topUpRef = doc(firestore, 'card_top_ups', topUpId);
    updateDocumentNonBlocking(topUpRef, { status: newStatus });
    toast({
        title: "Status Updated",
        description: `Top up status changed to ${newStatus}.`,
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Card Top Up Requests</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Top Up Requests</CardTitle>
          <CardDescription>
            Review and manage all user card top up requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Amount Sent</TableHead>
                <TableHead>Top Up (USD)</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    <div className="flex justify-center items-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading requests...</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && (!topUps || topUps.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No top up requests found.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                topUps?.map((topUp) => (
                  <TableRow key={topUp.id}>
                    <TableCell>
                      {format(parseISO(topUp.createdAt), "PPp")}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{topUp.userId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <PaymentIcon id={topUp.paymentMethod.toLowerCase()} className="h-5 w-5"/>
                        <span>{topUp.sentAmount.toFixed(2)} {topUp.sentCurrency}</span>
                      </div>
                    </TableCell>
                     <TableCell className="font-semibold text-green-600">
                      ${topUp.topUpAmountUSD.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getStatusVariant(topUp.status)}>
                        {topUp.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                        {topUp.status !== 'Completed' && (
                             <Button variant="outline" size="sm" onClick={() => handleStatusUpdate(topUp.id, 'Completed')}>
                                Complete
                            </Button>
                        )}
                        {topUp.status !== 'Cancelled' && (
                             <Button variant="destructive" size="sm" onClick={() => handleStatusUpdate(topUp.id, 'Cancelled')}>
                                Cancel
                            </Button>
                        )}
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

export default AdminTopUpPage;

    