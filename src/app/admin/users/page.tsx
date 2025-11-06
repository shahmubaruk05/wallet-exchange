
"use client";

import { useState, useMemo, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { useFirestore } from "@/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import type { User } from "@/lib/data";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";

type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  walletUsd: number;
  createdAt?: string | null;
};

const AdminUsersPage = () => {
  const firestore = useFirestore();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    if (!firestore) return;

    async function loadUsers() {
      try {
        setLoading(true);
        setError(null);

        const snap = await getDocs(collection(firestore, "users"));

        const result: AdminUserRow[] = [];
        snap.forEach((doc) => {
          const data = doc.data() || {};

          result.push({
            id: doc.id,
            name: (data.displayName || data.name || data.firstName || "(No name)") as string,
            email: (data.email || "") as string,
            walletUsd:
              (data.walletBalance ??
                data.walletBalanceUsd ??
                data.walletUSD ??
                data.balanceUSD ??
                0) as number,
            createdAt: data.createdAt
              ? data.createdAt.toDate
                ? data.createdAt.toDate().toISOString()
                : String(data.createdAt)
              : null,
          });
        });
        
        setUsers(result);
      } catch (e: any) {
        console.error("Error loading admin users:", e);
        setError("Failed to load users from Firestore.");
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, [firestore]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((user) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        user.email.toLowerCase().includes(term) ||
        (user.name && user.name.toLowerCase().includes(term)) ||
        user.id.toLowerCase().includes(term)
      );
    });
  }, [users, searchTerm]);


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">User Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            View and manage all registered users on the platform.
          </CardDescription>
           <div className="relative flex-1 mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search by name, email, or user ID" 
                    className="pl-10 max-w-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Wallet Balance (USD)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    <div className="flex justify-center items-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading users...</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!loading && error && (
                 <TableRow>
                  <TableCell colSpan={4} className="text-center text-destructive">
                    {error}
                  </TableCell>
                </TableRow>
              )}
              {!loading && !error && filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
              {!loading && !error &&
                filteredUsers?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                        <div>{user.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{user.id}</div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="font-mono">
                      ${user.walletUsd.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/users/${user.id}`}>
                            Manage
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsersPage;
