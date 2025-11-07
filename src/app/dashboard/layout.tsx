
'use client';

import Link from "next/link";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { ArrowLeftRight, History, User, LogOut, CreditCard, Landmark, Wallet, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, useUser, useDoc, useMemoFirebase, useFirestore } from "@/firebase";
import { useRouter } from "next/navigation";
import AuthRedirect from "@/components/auth/AuthRedirect";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { doc } from "firebase/firestore";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [firestore, user]);

  const { data: userData } = useDoc(userDocRef);

  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
    }
    router.push('/login');
  };
  
  const getInitials = (email?: string | null) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  }

  const walletBalance = (userData as any)?.walletBalance ?? 0;

  return (
    <SidebarProvider>
      <AuthRedirect to="/login" condition={user => !user}>
        <Sidebar>
            <SidebarHeader>
              <div className="flex items-center gap-2 p-2">
                  <User className="h-6 w-6 text-primary" />
                  <span className="font-bold text-lg">Dashboard</span>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                  <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Add Funds">
                      <Link href="/dashboard/add-funds">
                      <Landmark />
                      <span>Add Funds</span>
                      </Link>
                  </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Exchange">
                      <Link href="/dashboard/exchange">
                      <ArrowLeftRight />
                      <span>Exchange</span>
                      </Link>
                  </SidebarMenuButton>
                  </SidebarMenuItem>
                   <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Transfer Funds">
                      <Link href="/dashboard/transfer">
                      <Share2 />
                      <span>Transfer Funds</span>
                      </Link>
                  </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Recent Transactions">
                      <Link href="/dashboard/transactions">
                      <History />
                      <span>All Transactions</span>
                      </Link>
                  </SidebarMenuButton>
                  </SidebarMenuItem>
                   <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Transfer History">
                      <Link href="/dashboard/transfer-history">
                      <History />
                      <span>Transfer History</span>
                      </Link>
                  </SidebarMenuButton>
                  </SidebarMenuItem>
                   <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="My Card">
                      <Link href="/dashboard/cards">
                      <CreditCard />
                      <span>My Card</span>
                      </Link>
                  </SidebarMenuButton>
                  </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
             <SidebarFooter>
                <div className="p-2 space-y-2">
                    <div className="p-2 rounded-lg bg-sidebar-accent">
                        <div className="text-xs text-sidebar-accent-foreground/80">Wallet Balance</div>
                        <div className="text-lg font-bold text-sidebar-accent-foreground">
                            {walletBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col text-sm overflow-hidden">
                            <span className="font-medium truncate">{user?.displayName || 'User'}</span>
                            <span className="text-muted-foreground truncate text-xs">{user?.email}</span>
                        </div>
                        <Button onClick={handleSignOut} variant="ghost" size="icon" className="ml-auto" aria-label="Sign Out">
                            <LogOut className="h-5 w-5"/>
                        </Button>
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
        <SidebarInset>
            <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </SidebarInset>
       </AuthRedirect>
    </SidebarProvider>
  );
}
