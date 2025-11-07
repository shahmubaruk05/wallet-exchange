
"use client";

import { useMemo, useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import PaymentIcon from "@/components/PaymentIcons";
import { format, parseISO, isToday, subDays, startOfMonth, endOfMonth } from "date-fns";
import { useFirestore, useUser, useAuth, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  collectionGroup,
} from "firebase/firestore";
import type { Transaction, TransactionStatus, User } from "@/lib/data";
import { TransactionDetailsDialog } from "@/components/TransactionDetailsDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initiateEmailSignIn } from "@/firebase/non-blocking-login";
import { useDoc } from "@/firebase/firestore/use-doc";
import { Loader2, Search, DollarSign } from "lucide-react";
import AuthRedirect from "@/components/auth/AuthRedirect";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";


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

const loginFormSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
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
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
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
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | "All">("All");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

   const usersMap = useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {} as Record<string, User>);
  }, [users]);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!firestore) return;
      setIsLoading(true);
      try {
        const transactionsQuery = query(
          collection(firestore, "transactions"),
          orderBy("transactionDate", "desc")
        );
        const transactionsSnapshot = await getDocs(transactionsQuery);
        const transactions = transactionsSnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Transaction)
        );
        setAllTransactions(transactions);

        const usersSnapshot = await getDocs(collection(firestore, "users"));
        const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(usersList);

      } catch (error: any) {
        const permissionError = new FirestorePermissionError({
          path: `transactions`,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        console.error("Error fetching all transactions or users:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, [firestore]);
  
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return allTransactions
      .filter((tx) => { // Search Filter
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const user = usersMap[tx.userId];
        return (
          tx.id.toLowerCase().includes(term) ||
          (user && user.email?.toLowerCase().includes(term)) ||
          (user && user.username?.toLowerCase().includes(term))
        );
      })
      .filter((tx) => { // Status Filter
        if (statusFilter === 'All') return true;
        return tx.status === statusFilter;
      })
      .filter((tx) => { // Date Filter
        const txDate = parseISO(tx.transactionDate);
        switch (dateFilter) {
          case 'today':
            return isToday(txDate);
          case '7days':
            return txDate >= subDays(now, 7);
          case 'this_month':
            return txDate >= startOfMonth(now) && txDate <= endOfMonth(now);
          case 'all':
          default:
            return true;
        }
      });
  }, [allTransactions, statusFilter, dateFilter, searchTerm, usersMap]);
  
  const getInitials = (email?: string | null, name?: string | null) => {
    if (name) return name.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Transaction History</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search by user email, name, or order ID" 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
             <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">All Statuses</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Processing">Processing</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
                <Button variant={dateFilter === 'today' ? 'default' : 'outline'} size="sm" onClick={() => setDateFilter('today')}>Today</Button>
                <Button variant={dateFilter === '7days' ? 'default' : 'outline'} size="sm" onClick={() => setDateFilter('7days')}>Last 7 days</Button>
                <Button variant={dateFilter === 'this_month' ? 'default' : 'outline'} size="sm" onClick={() => setDateFilter('this_month')}>This month</Button>
                <Button variant={dateFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setDateFilter('all')}>All</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
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
                  <TableCell colSpan={6} className="text-center">
                    <div className="flex justify-center items-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading transactions...</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && filteredTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No transactions found for the selected filters.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                filteredTransactions.map((tx) => (
                  <TransactionDetailsDialog key={tx.id} transaction={tx}>
                    <TableRow className="cursor-pointer">
                       <TableCell>
                        <div className="flex items-center gap-3">
                           <Avatar>
                                <AvatarFallback>
                                    {getInitials(usersMap[tx.userId]?.email, usersMap[tx.userId]?.username)}
                                </AvatarFallback>
                            </Avatar>
                           <div className="flex flex-col">
                             <span className="font-semibold">{usersMap[tx.userId]?.username || usersMap[tx.userId]?.email || 'Unknown User'}</span>
                             <span className="text-xs text-muted-foreground">{usersMap[tx.userId]?.email}</span>
                           </div>
                        </div>
                      </TableCell>
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
                          {tx.transactionType === 'CARD_TOP_UP' ? (
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
                          {tx.transactionType === 'CARD_TOP_UP' ? 'USD' : tx.withdrawalMethod === 'Wallet Balance' ? 'USD' : 'BDT'}
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
          <CardDescription>
            You are not authorized to view this page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => auth?.signOut()}>Logout</Button>
        </CardContent>
      </Card>
    </div>
  );
};

const AdminDashboardPage = () => {
  const firestore = useFirestore();
  const { user } = useUser();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDocLoading } = useDoc(userDocRef);

  if (isUserDocLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isAdmin = (userData as any)?.role === "admin";

  if (!isAdmin) {
    return <NotAuthorized />;
  }

  return <AdminDashboard />;
};

const AdminPage = () => {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <AuthRedirect to="/admin" condition={(user) => !user}>
      {user ? <AdminDashboardPage /> : <AdminLoginPage />}
    </AuthRedirect>
  );
};

export default AdminPage;
