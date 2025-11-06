
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, UserCog, LogIn, UserPlus, LayoutDashboard } from "lucide-react";
import { useUser } from "@/firebase";

const Header = () => {
  const { user, isUserLoading } = useUser();

  const isAdmin = (user?.stsTokenManager as any)?.claims?.isAdmin;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <ArrowLeftRight className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block">
            Wallet Exchange
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-end">
          <nav className="flex items-center gap-2">
            {isUserLoading ? null : user ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-5 w-5" />
                    <span className="hidden sm:inline-block sm:ml-2">Dashboard</span>
                  </Link>
                </Button>
                {isAdmin && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin">
                      <UserCog className="h-5 w-5" />
                      <span className="hidden sm:inline-block sm:ml-2">Admin</span>
                    </Link>
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">
                    <LogIn className="h-5 w-5" />
                    <span className="hidden sm:inline-block sm:ml-2">Login</span>
                  </Link>
                </Button>
                <Button size="sm" asChild>
                   <Link href="/signup">
                    <UserPlus className="h-5 w-5" />
                    <span className="hidden sm:inline-block sm:ml-2">Sign Up</span>
                  </Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
