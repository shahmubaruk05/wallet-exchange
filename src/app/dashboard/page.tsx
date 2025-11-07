
'use client';

import { useUser, useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import AuthRedirect from '@/components/auth/AuthRedirect';

function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
    }
    router.push('/login');
  };

  if (isUserLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthRedirect to="/login" condition={user => !user}>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Welcome, {user?.displayName || 'User'}</h1>
          <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
        </div>
      </div>
    </AuthRedirect>
  );
}

export default DashboardPage;
