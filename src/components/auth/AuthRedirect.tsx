'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import type { User } from 'firebase/auth';

interface AuthRedirectProps {
  children: ReactNode;
  to: string;
  condition: (user: User | null) => boolean;
}

export default function AuthRedirect({ children, to, condition }: AuthRedirectProps) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading) {
      if (condition(user)) {
        router.push(to);
      }
    }
  }, [user, isUserLoading, router, to, condition]);

  // While loading, or if the condition is not met, render the children.
  // This prevents content flashing.
  if (isUserLoading || !condition(user)) {
    return <>{children}</>;
  }

  // If the condition is met and we are about to redirect,
  // render null or a loading spinner to avoid showing the page content briefly.
  return null;
}
