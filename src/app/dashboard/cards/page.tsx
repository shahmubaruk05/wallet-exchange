
"use client";

import { useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useFirestore,
  useUser,
  useDoc,
  useMemoFirebase,
  setDocumentNonBlocking,
} from "@/firebase";
import { doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock, XCircle, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import type { CardApplication } from "@/lib/data";
import VirtualCard from "@/components/VirtualCard";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(10, "Phone number is too short."),
  billingAddress: z.string().min(10, "Billing address is too short."),
});


const getStatusVariant = (status?: string) => {
  switch (status?.toLowerCase()) {
    case "posted":
    case "cleared":
      return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200";
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200";
    case "failed":
    case "declined":
    case "reversed":
      return "bg-red-100 text-red-800 border-red-200 hover:bg-red-200";
    default:
      return "outline";
  }
};

function getFallbackTransactions() {
  const now = new Date();
  const day = 24 * 60 * 60 * 1000;
  return [
    {
      id: "demo-1",
      date: new Date(now.getTime() - 1 * day).toISOString(),
      merchant: "Demo Amazon Web Services",
      amount: -12.5,
      currency: "USD",
      status: "posted",
    },
    {
      id: "demo-2",
      date: new Date(now.getTime() - 2 * day).toISOString(),
      merchant: "Demo Stripe Payment",
      amount: 250,
      currency: "USD",
      status: "posted",
    },
    {
      id: "demo-3",
      date: new Date(now.getTime() - 3 * day).toISOString(),
      merchant: "Demo Figma Subscription",
      amount: -15,
      currency: "USD",
      status: "posted",
    },
  ];
}


const CardTransactionList = ({ application }: { application: CardApplication }) => {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [source, setSource] = useState<"mercury" | "fallback" | null>(null);

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!application.mercuryCardLast4) {
                setTransactions([]);
                setSource("mercury"); // No card, so no transactions to fetch
                setLoading(false);
                return;
            };
            
            setLoading(true);
            
            try {
                const apiUrl = new URL('/api/mercury/transactions', window.location.origin);
                apiUrl.searchParams.append('cardLast4', application.mercuryCardLast4);

                const response = await fetch(apiUrl.toString(), { cache: "no-store" });
                const data = await response.json();
                
                if (data && data.ok === true && Array.isArray(data.transactions)) {
                    setTransactions(data.transactions);
                    setSource(data.from === "mercury" ? "mercury" : "fallback");
                } else {
                    console.error("API did not return ok=true, falling back to demo data.", data?.error);
                    setTransactions(getFallbackTransactions());
                    setSource("fallback");
                }
            } catch (e: any) {
                console.error("Error fetching mercury transactions, falling back to demo data:", e);
                setTransactions(getFallbackTransactions());
                setSource("fallback");
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [application.mercuryCardLast4]);

  const renderTransactionContent = () => {
      if (loading) {
        return (
            <div className="mt-8 flex justify-center items-center h-20">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading transactions...</span>
            </div>
        )
      }

      if (transactions.length === 0 && source !== 'fallback') {
        return <p className="mt-8 text-center text-muted-foreground">No transactions found for this card.</p>;
      }

      return (
        <>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                    <TableCell className="text-muted-foreground text-xs">{tx.date ? format(parseISO(tx.date), "PP") : 'N/A'}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-3">
                        {tx.amount < 0 ? 
                            <ArrowUpRight className="h-4 w-4 text-destructive" /> : 
                            <ArrowDownLeft className="h-4 w-4 text-green-500" />
                        }
                        <span className="font-medium">{tx.merchant ?? tx.description}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge className={getStatusVariant(tx.status)}>{tx.status}</Badge>
                    </TableCell>
                    <TableCell className={cn("text-right font-mono", tx.amount < 0 ? 'text-destructive' : 'text-green-500')}>
                        {tx.amount < 0 ? '' : '+'}
                        {tx.amount.toFixed(2)} {tx.currency}
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            {source === "fallback" && (
                <p className="mt-2 text-xs text-slate-400 text-center">
                    Showing demo data because Mercury is not accessible from this environment.
                </p>
            )}
        </>
      )
  }

  return (
     <Card className="mt-8">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your recent Mercury card transactions.</CardDescription>
      </CardHeader>
      <CardContent>
          {renderTransactionContent()}
      </CardContent>
    </Card>
  )
}

const UserCardPage = () => {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const applicationRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, `card_applications/${user.uid}`);
  }, [firestore, user]);

  const { data: application, isLoading } =
    useDoc<CardApplication>(applicationRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.displayName || "",
      email: user?.email || "",
      phone: "",
      billingAddress: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!user || !applicationRef) return;

    const newApplicationData = {
      ...values,
      userId: user.uid,
      status: "Pending" as const,
      appliedAt: new Date().toISOString(),
    };

    setDocumentNonBlocking(applicationRef, newApplicationData, { merge: false });

    toast({
      title: "Application Submitted",
      description: "Your card application is pending approval.",
      className: "bg-accent text-accent-foreground",
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    if (application) {
      switch (application.status) {
        case "Approved":
          return (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-center">Your Virtual Card</h2>
              <VirtualCard application={application} />
              {user && <CardTransactionList application={application} />}
            </div>
          );
        case "Pending":
          return (
            <div className="text-center p-8 border-dashed border-2 rounded-lg">
              <Clock className="mx-auto h-12 w-12 text-yellow-500" />
              <h2 className="mt-4 text-xl font-semibold">Application Pending</h2>
              <p className="mt-2 text-muted-foreground">
                Your application is currently under review. You will be notified once a decision is made.
              </p>
            </div>
          );
        case "Rejected":
          return (
             <div className="text-center p-8 border-dashed border-2 rounded-lg border-destructive/50">
              <XCircle className="mx-auto h-12 w-12 text-destructive" />
              <h2 className="mt-4 text-xl font-semibold">Application Rejected</h2>
              <p className="mt-2 text-muted-foreground">
                We're sorry, but your card application could not be approved at this time.
              </p>
            </div>
          );
      }
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Apply for a Virtual Card</CardTitle>
          <CardDescription>
            Fill out the form below to apply for your Mercury virtual card.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="billingAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Address</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="123 Main St, Anytown, USA"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit Application
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl">
          My Card
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Manage your virtual card application and view your card details.
        </p>
      </div>
      {renderContent()}
    </div>
  );
};

export default UserCardPage;
