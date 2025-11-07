
"use client";

import { useState, useMemo, useEffect } from "react";
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
import { useFirestore, errorEmitter, FirestorePermissionError } from "@/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import type { Transaction, TransactionStatus, User } from "@/lib/data";
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

const AdminTopUpPage = () => {
  const firestore = useFirestore();
  const [topUps, setTopUps] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const usersMap = useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {} as Record<string, User>);
  }, [users]);


  useEffect(() => {
    const fetchTopUps = async () => {
      if (!firestore) return;
      setIsLoading(true);
      
      try {
        const topUpsQuery = query(
          collection(firestore, "transactions"),
          where("transactionType", "==", "CARD_TOP_UP"),
          orderBy("transactionDate", "desc")
        );
        const querySnapshot = await getDocs(topUpsQuery);
        const fetchedTopUps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
        setTopUps(fetchedTopUps);
        
        const usersSnapshot = await getDocs(collection(firestore, "users"));
        const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(usersList);

      } catch (error: any) {
        const permissionError = new FirestorePermissionError({
          path: `transactions`,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        console.error("Error fetching card top-ups:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopUps();
  }, [firestore]);


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
                <TableHead>User</TableHead>
                <TableHead>Amount Sent</TableHead>
                <TableHead>Top Up (USD)</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    <div className="flex justify-center items-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading requests...</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && (!topUps || topUps.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No top up requests found.
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
                      <TableCell>{usersMap[topUp.userId]?.username || usersMap[topUp.userId]?.email || 'Unknown'}</TableCell>
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

export default AdminTopUpPage;
