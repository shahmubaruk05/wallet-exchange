
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useFirestore,
  useMemoFirebase,
} from "@/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import type { CardApplication, User } from "@/lib/data";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";
import { ManageCardApplicationDialog } from "@/components/ManageCardApplicationDialog";

const getStatusVariant = (status: CardApplication["status"]) => {
  switch (status) {
    case "Approved":
      return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200";
    case "Pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200";
    case "Rejected":
      return "bg-red-100 text-red-800 border-red-200 hover:bg-red-200";
    default:
      return "outline";
  }
};

const AdminCardManagementPage = () => {
  const firestore = useFirestore();
  const [applications, setApplications] = useState<CardApplication[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const usersMap = useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {} as Record<string, User>);
  }, [users]);
  
  useEffect(() => {
    const fetchAllData = async () => {
      if (!firestore) return;
      setIsLoading(true);
      try {
        const appsQuery = query(
          collection(firestore, "card_applications"),
          orderBy("appliedAt", "desc")
        );
        const appsSnapshot = await getDocs(appsQuery);
        const appsList = appsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CardApplication));
        setApplications(appsList);

        const usersSnapshot = await getDocs(collection(firestore, "users"));
        const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(usersList);

      } catch (error) {
        console.error("Error fetching card applications or users:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, [firestore]);


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Card Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>Card Applications</CardTitle>
          <CardDescription>
            Review and manage all user card applications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Applicant Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    <div className="flex justify-center items-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading applications...</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && (!applications || applications.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No card applications found.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                applications?.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      {format(parseISO(app.appliedAt), "PPp")}
                    </TableCell>
                    <TableCell>{app.name}</TableCell>
                    <TableCell>{app.email}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={getStatusVariant(app.status)}>
                        {app.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <ManageCardApplicationDialog application={app}>
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                      </ManageCardApplicationDialog>
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

export default AdminCardManagementPage;

    