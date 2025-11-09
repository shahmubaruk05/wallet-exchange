
'use client';

import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import AuthRedirect from '@/components/auth/AuthRedirect';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Wallet, PlusCircle, Send, ArrowRight, DollarSign, Landmark } from 'lucide-react';
import Link from 'next/link';
import { doc, collection, query, orderBy, limit } from 'firebase/firestore';
import type { Transaction } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import PaymentIcon from '@/components/PaymentIcons';
import { format, parseISO } from 'date-fns';
import { TransactionDetailsDialog } from '@/components/TransactionDetailsDialog';
import { MobileDashboardNav } from "@/components/dashboard/MobileDashboardNav";

function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDocLoading } = useDoc(userDocRef);

  const recentTransactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, `users/${user.uid}/transactions`),
      orderBy('transactionDate', 'desc'),
      limit(5)
    );
  }, [firestore, user]);

  const { data: recentTransactions, isLoading: isTransactionsLoading } = useCollection<Transaction>(recentTransactionsQuery);

  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
    }
    router.push('/login');
  };

  const walletBalance = (userData as any)?.walletBalance ?? 0;

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

  const getWithdrawalCurrency = (tx: Transaction) => {
    if (tx.transactionType === 'CARD_TOP_UP' || tx.withdrawalMethod === 'Wallet Balance') {
      return 'USD';
    }
    return 'BDT';
  };

  if (isUserLoading || isUserDocLoading) {
    return (
       <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <AuthRedirect to="/login" condition={user => !user}>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Welcome, {user?.displayName || 'User'}</h1>
          <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
        </div>
        
        <Card className="w-full max-w-2xl mx-auto shadow-lg bg-gradient-to-br from-primary/80 to-blue-500 text-primary-foreground mb-8">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Wallet className="w-8 h-8"/>
                    <CardTitle className="text-2xl">Your Wallet Balance</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="text-center">
                <p className="text-6xl font-bold tracking-tight">
                    {walletBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </p>
            </CardContent>
            <CardFooter className="flex-col sm:flex-row gap-4">
                <Button asChild className="w-full bg-background/20 hover:bg-background/30 text-primary-foreground">
                    <Link href="/dashboard/add-funds">
                        <PlusCircle className="mr-2"/>
                        Add Funds
                    </Link>
                </Button>
                 <Button asChild className="w-full bg-background/20 hover:bg-background/30 text-primary-foreground">
                    <Link href="/dashboard/transfer">
                        <Send className="mr-2"/>
                        Transfer Funds
                    </Link>
                </Button>
            </CardFooter>
        </Card>

        {/* Mobile quick navigation buttons */}
        <MobileDashboardNav />

        <Card>
            <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Here are your last 5 transactions.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {isTransactionsLoading && (
                        <TableRow>
                        <TableCell colSpan={4} className="text-center">
                            <div className="flex justify-center items-center p-4">
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <span className="ml-2">Loading transactions...</span>
                            </div>
                        </TableCell>
                        </TableRow>
                    )}
                    {!isTransactionsLoading && (!recentTransactions || recentTransactions.length === 0) && (
                        <TableRow>
                        <TableCell colSpan={4} className="text-center">You have no recent transactions.</TableCell>
                        </TableRow>
                    )}
                    {!isTransactionsLoading && recentTransactions && recentTransactions.map((tx) => (
                        <TransactionDetailsDialog key={tx.id} transaction={tx}>
                        <TableRow className="cursor-pointer">
                            <TableCell className="font-medium">{format(parseISO(tx.transactionDate), 'PP')}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <PaymentIcon id={tx.paymentMethod.toLowerCase()} className="h-5 w-5"/>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground"/>
                                    {tx.transactionType === 'CARD_TOP_UP' ? (
                                    <DollarSign className="h-5 w-5 text-primary" />
                                    ) : tx.transactionType === 'ADD_FUNDS' ? (
                                    <Landmark className="h-5 w-5 text-primary" />
                                    ) : (
                                    <PaymentIcon id={tx.withdrawalMethod.toLowerCase()} className="h-5 w-5"/>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                                {tx.amount.toFixed(2)} {tx.currency}
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
            <CardFooter>
                 <Button asChild variant="outline" className="w-full">
                    <Link href="/dashboard/transactions">
                        View All Transactions <ArrowRight className="ml-2"/>
                    </Link>
                </Button>
            </CardFooter>
        </Card>
      </div>
    </AuthRedirect>
  );
}

export default DashboardPage;
