"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import PaymentIcon from "@/components/PaymentIcons";
import { format, parseISO } from "date-fns";
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
  useUser,
  useAuth,
} from "@/firebase";
import {
  collection,
  query,
  orderBy,
  collectionGroup,
  doc,
} from "firebase/firestore";
import type { Transaction } from "@/lib/data";
import { TransactionDetailsDialog } from "@/components/TransactionDetailsDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initiateEmailSignIn } from "@/firebase/non-blocking-login";
import { useDoc } from "@/firebase/firestore/use-doc";
import { Loader2 } from "lucide-react";

const getStatusVariant = (status: Transaction["status"]) => {
  switch (status) {
    case "Completed":
      return "bg-accent/20 text-accent-foreground hover:bg-accent/30";
    case "Processing":
      return "default";
    case "Paid":
      return "secondary";
    default:
      return "outline";
  }
};

const loginFormSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

const AdminLoginPage = () => {
  const auth = useAuth();
  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof loginFormSchema>) => {
    if (auth) {
      initiateEmailSignIn(auth, values.email, values.password);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>
            Please login to access the admin panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Login as Admin
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};


const AdminDashboard = () => {
  const firestore = useFirestore();

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collectionGroup(firestore, "transactions"),
      orderBy("transactionDate", "desc")
    );
  }, [firestore]);

  const { data: allTransactions, isLoading } =
    useCollection<Transaction>(transactionsQuery);

  const sortedTransactions = useMemo(() => {
    if (!allTransactions) return [];
    return allTransactions;
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
                  <TableCell colSpan={6} className="text-center">
                    Loading transactions...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && sortedTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No transactions found.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                sortedTransactions.map((tx) => (
                  <TransactionDetailsDialog key={tx.id} transaction={tx}>
                    <TableRow className="cursor-pointer">
                      <TableCell className="font-medium">
                        {format(parseISO(tx.transactionDate), "PPp")}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {tx.userId}
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
                          <PaymentIcon
                            id={tx.withdrawalMethod.toLowerCase()}
                            className="h-5 w-5"
                          />
                          <span>{tx.withdrawalMethod}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-mono">
                          {tx.amount.toFixed(2)} {tx.currency} &rarr;{" "}
                          {tx.receivedAmount.toFixed(2)} BDT
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
  );
};

const NotAuthorized = () => {
    const auth = useAuth();
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <Card className="p-8">
                <CardHeader>
                    <CardTitle className="text-destructive">Access Denied</CardTitle>
                    <CardDescription>You are not authorized to view this page.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Button onClick={() => auth?.signOut()}>Logout</Button>
                </CardContent>
            </Card>
        </div>
    );
};

const AdminPage = () => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDocLoading } = useDoc(userDocRef);

  if (isUserLoading || (user && isUserDocLoading)) {
    return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!user) {
    return <AdminLoginPage />;
  }
  
  const isAdmin = (userData as any)?.role === 'admin';

  if (!isAdmin) {
    return <NotAuthorized />;
  }

  return <AdminDashboard />;
};

export default AdminPage;
