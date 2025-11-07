
'use client';

import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import AuthRedirect from '@/components/auth/AuthRedirect';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Wallet, PlusCircle, Send } from 'lucide-react';
import Link from 'next/link';
import { doc } from 'firebase/firestore';

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

  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
    }
    router.push('/login');
  };

  const walletBalance = (userData as any)?.walletBalance ?? 0;

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
        
        <Card className="w-full max-w-2xl mx-auto shadow-lg bg-gradient-to-br from-primary/80 to-blue-500 text-primary-foreground">
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
      </div>
    </AuthRedirect>
  );
}

export default DashboardPage;
