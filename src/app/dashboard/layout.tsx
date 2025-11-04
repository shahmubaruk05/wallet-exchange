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
import { ArrowLeftRight, History, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import AuthRedirect from "@/components/auth/AuthRedirect";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();

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
                      <span>Recent Transactions</span>
                      </Link>
                  </SidebarMenuButton>
                  </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
             <SidebarFooter>
                <div className="flex items-center gap-3 p-2">
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
            </SidebarFooter>
        </Sidebar>
        <SidebarInset>
            <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </SidebarInset>
       </AuthRedirect>
    </SidebarProvider>
  );
}
