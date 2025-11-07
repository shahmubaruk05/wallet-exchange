
"use client";

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
import type { ExchangeLimit } from "@/lib/data";
import { paymentMethods } from "@/lib/data";
import { Loader2, PlusCircle } from "lucide-react";
import { ManageLimitDialog } from "@/components/ManageLimitDialog";

const AdminLimitsPage = () => {
  const firestore = useFirestore();

  const limitsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "exchange_limits"), orderBy("fromMethod"));
  }, [firestore]);

  const { data: limits, isLoading } = useCollection<ExchangeLimit>(limitsQuery);

  const getMethodName = (id: string) => {
    return paymentMethods.find(p => p.id === id)?.name || id;
  }
  const getMethodCurrency = (id: string) => {
    const method = paymentMethods.find(p => p.id === id);
    // For card top-ups, the 'from' currency is what matters for the limit.
    if (id === 'virtual_card_top_up' && limits?.length) {
        const relevantLimit = limits.find(l => l.toMethod === 'virtual_card_top_up');
        if (relevantLimit) {
            return paymentMethods.find(p => p.id === relevantLimit.fromMethod)?.currency || '';
        }
    }
    return method?.currency || '';
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
            <h1 className="text-3xl font-bold">Exchange & Top-up Limits</h1>
            <p className="text-muted-foreground">Manage minimum and maximum transaction amounts.</p>
        </div>
         <ManageLimitDialog>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Limit
            </Button>
        </ManageLimitDialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Current Limits</CardTitle>
          <CardDescription>
            These rules define the allowed transaction amounts for users for both exchanges and card top-ups.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From Method</TableHead>
                <TableHead>To Method</TableHead>
                <TableHead>Min Amount</TableHead>
                <TableHead>Max Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    <div className="flex justify-center items-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading limits...</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && (!limits || limits.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No exchange or top-up limits have been set up.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                limits?.map((limit) => (
                  <TableRow key={limit.id}>
                    <TableCell className="font-semibold">{getMethodName(limit.fromMethod)}</TableCell>
                    <TableCell className="font-semibold">{getMethodName(limit.toMethod)}</TableCell>
                    <TableCell className="font-mono">{limit.minAmount.toLocaleString()} {getMethodCurrency(limit.fromMethod)}</TableCell>
                    <TableCell className="font-mono">{limit.maxAmount.toLocaleString()} {getMethodCurrency(limit.fromMethod)}</TableCell>
                    <TableCell className="text-right">
                       <ManageLimitDialog limit={limit}>
                          <Button variant="outline" size="sm">
                            Manage
                          </Button>
                      </ManageLimitDialog>
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

export default AdminLimitsPage;
