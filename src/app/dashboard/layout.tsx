
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { ArrowLeftRight, History, User, LogOut, CreditCard, Landmark, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, useUser, useDoc, useMemoFirebase, useFirestore } from "@/firebase";
import { useRouter } from "next/navigation";
import AuthRedirect from "@/components/auth/AuthRedirect";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { doc } from "firebase/firestore";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const pathname = usePathname();

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

  const navItems = [
    { href: "/dashboard/add-funds", icon: Landmark, label: "Add Funds" },
    { href: "/dashboard/exchange", icon: ArrowLeftRight, label: "Exchange" },
    { href: "/dashboard/transactions", icon: History, label: "History" },
    { href: "/dashboard/cards", icon: CreditCard, label: "My Card" },
  ];

  return (
    <SidebarProvider>
      <AuthRedirect to="/login" condition={user => !user}>
        <Sidebar>
            <SidebarHeader>
              <div className="flex items-center gap-2 p-4">
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
                  <SidebarMenuButton asChild tooltip="Recent Transactions">
                      <Link href="/dashboard/transactions">
                      <History />
                      <span>All Transactions</span>
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
            <div className="p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">{children}</div>
        </SidebarInset>

         {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t z-10 flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-full h-full text-xs transition-colors",
                  isActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
       </AuthRedirect>
    </SidebarProvider>
  );
}
