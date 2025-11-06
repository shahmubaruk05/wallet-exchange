
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
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { User } from "@/lib/data";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";


const AdminUsersPage = () => {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState<string>("");

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "users"), orderBy("email"));
  }, [firestore]);

  const { data: allUsers, isLoading } = useCollection<User>(usersQuery);

  const filteredUsers = useMemo(() => {
    if (!allUsers) return [];
    return allUsers.filter((user) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        user.email.toLowerCase().includes(term) ||
        (user.firstName && user.firstName.toLowerCase().includes(term)) ||
        (user.lastName && user.lastName.toLowerCase().includes(term)) ||
        user.id.toLowerCase().includes(term)
      );
    });
  }, [allUsers, searchTerm]);


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
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    <div className="flex justify-center items-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading users...</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && (!filteredUsers || filteredUsers.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                filteredUsers?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                        <div>{user.firstName || ''} {user.lastName || ''}</div>
                        <div className="text-xs text-muted-foreground font-mono">{user.id}</div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="font-mono">
                      ${(user.walletBalance ?? 0).toFixed(2)}
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
