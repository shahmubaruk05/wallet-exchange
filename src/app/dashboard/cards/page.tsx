
"use client";

import { useMemo } from "react";
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
import { Loader2, Clock, XCircle, Info, DollarSign, History } from "lucide-react";
import type { CardApplication } from "@/lib/data";
import VirtualCard from "@/components/VirtualCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(10, "Phone number is too short."),
  billingAddress: z.string().min(10, "Billing address is too short."),
});

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
               <div className="mt-6 flex flex-col sm:flex-row justify-center gap-2">
                 <Button asChild>
                    <Link href="/dashboard/cards/top-up">
                        <DollarSign className="mr-2 h-4 w-4" /> Top Up Card
                    </Link>
                 </Button>
                  <Button asChild variant="outline">
                    <Link href="/dashboard/cards/history">
                        <History className="mr-2 h-4 w-4" /> View Top Up History
                    </Link>
                 </Button>
              </div>
              {application.adminInstruction && (
                <Alert className="mt-6">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Note from Admin</AlertTitle>
                  <AlertDescription>
                    {application.adminInstruction}
                  </AlertDescription>
                </Alert>
              )}
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
               {application.adminInstruction && (
                <Alert className="mt-6 text-left">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Note from Admin</AlertTitle>
                  <AlertDescription>
                    {application.adminInstruction}
                  </AlertDescription>
                </Alert>
              )}
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
               {application.adminInstruction && (
                <Alert className="mt-6 text-left" variant="destructive">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Note from Admin</AlertTitle>
                  <AlertDescription>
                    {application.adminInstruction}
                  </AlertDescription>
                </Alert>
              )}
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
