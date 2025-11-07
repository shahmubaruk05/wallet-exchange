
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc, runTransaction, collection, where, query, getDocs, DocumentData, getDoc } from "firebase/firestore";
import type { User } from "@/lib/data";
import { Loader2, ArrowRight } from "lucide-react";
import Link from 'next/link';

const formSchema = z.object({
  recipientIdentifier: z.string().min(1, { message: "Recipient email or ID is required." }),
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
});

export default function TransferForm() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userData } = useDoc<User>(userDocRef);
  const walletBalance = userData?.walletBalance ?? 0;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipientIdentifier: "",
      amount: 0,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore || !user || !userData) {
      toast({ title: "Error", description: "You must be logged in to transfer funds.", variant: "destructive" });
      return;
    }
    
    const recipientIdentifier = values.recipientIdentifier.trim();

    if (recipientIdentifier === user.email || recipientIdentifier === user.uid) {
      toast({ title: "Invalid Recipient", description: "You cannot transfer funds to yourself.", variant: "destructive" });
      return;
    }

    if (values.amount > walletBalance) {
      toast({ title: "Insufficient Funds", description: `You only have ${walletBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} in your wallet.`, variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      let recipientDoc: DocumentData | null = null;
      let recipientId: string | null = null;

      // 1. Try to get user by ID directly
      const docRef = doc(firestore, "users", recipientIdentifier);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        recipientDoc = docSnap.data();
        recipientId = docSnap.id;
      } else {
        // 2. If not found by ID, try to get user by email
        const q = query(collection(firestore, "users"), where("email", "==", recipientIdentifier));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          recipientDoc = doc.data();
          recipientId = doc.id;
        }
      }

      if (!recipientDoc || !recipientId) {
        toast({ title: "Recipient Not Found", description: "No user found with that email or ID.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
      
      const recipientData = recipientDoc as User;

      // Final self-transfer check with resolved ID/email
      if (recipientId === user.uid) {
        toast({ title: "Invalid Recipient", description: "You cannot transfer funds to yourself.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      await runTransaction(firestore, async (transaction) => {
        const senderRef = doc(firestore, "users", user.uid);
        const recipientRef = doc(firestore, "users", recipientId!);
        
        const senderDoc = await transaction.get(senderRef);
        if (!senderDoc.exists() || (senderDoc.data().walletBalance ?? 0) < values.amount) {
            throw new Error("Insufficient balance.");
        }

        const recipientDocForTransaction = await transaction.get(recipientRef);
        if (!recipientDocForTransaction.exists()) {
            throw new Error("Recipient document does not exist.");
        }
        const recipientDataForTransaction = recipientDocForTransaction.data() as User;


        // Decrement sender's balance
        transaction.update(senderRef, { walletBalance: (senderDoc.data().walletBalance ?? 0) - values.amount });

        // Increment recipient's balance
        const recipientCurrentBalance = (recipientDataForTransaction.walletBalance ?? 0);
        transaction.update(recipientRef, { walletBalance: recipientCurrentBalance + values.amount });

        const now = new Date().toISOString();
        const recipientEmail = recipientDataForTransaction.email;


        // Create sender's transaction log
        const senderTxRef = doc(collection(firestore, `users/${user.uid}/transactions`));
        transaction.set(senderTxRef, {
            userId: user.uid,
            transactionType: 'WALLET_TRANSFER',
            paymentMethod: 'Wallet Balance',
            withdrawalMethod: `Sent to ${recipientEmail}`,
            amount: values.amount,
            currency: 'USD',
            receivedAmount: values.amount,
            status: 'Completed',
            transactionDate: now,
            transferDetails: {
                senderId: user.uid,
                senderEmail: user.email,
                recipientId: recipientId,
                recipientEmail: recipientEmail,
            },
        });
        
        // Create recipient's transaction log
        const recipientTxRef = doc(collection(firestore, `users/${recipientId!}/transactions`));
        transaction.set(recipientTxRef, {
            userId: recipientId,
            transactionType: 'WALLET_TRANSFER',
            paymentMethod: `Received from ${user.email}`,
            withdrawalMethod: 'Wallet Balance',
            amount: values.amount,
            currency: 'USD',
            receivedAmount: values.amount,
            status: 'Completed',
            transactionDate: now,
            transferDetails: {
                senderId: user.uid,
                senderEmail: user.email,
                recipientId: recipientId,
                recipientEmail: recipientEmail,
            },
        });
      });

      toast({ title: "Transfer Successful!", description: `${values.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} sent to ${recipientData.email}.`, className: "bg-accent text-accent-foreground" });
      setIsSuccess(true);
    } catch (error: any) {
        console.error("Transfer failed: ", error);
        toast({ title: "Transfer Failed", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (isSuccess) {
      return (
         <Card className="w-full shadow-lg">
            <CardContent className="pt-6 text-center flex flex-col items-center justify-center space-y-4 min-h-80">
                <h2 className="text-2xl font-bold">Transfer Complete!</h2>
                <p className="text-muted-foreground">
                    Your funds have been successfully transferred.
                </p>
                <div className="w-full pt-4 flex flex-col sm:flex-row gap-2">
                    <Button onClick={() => { form.reset(); setIsSuccess(false); }} className="w-full">
                        Make Another Transfer
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/dashboard">
                            Back to Dashboard
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
      )
  }

  return (
    <Card className="w-full shadow-lg">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Transfer Details</CardTitle>
            <CardDescription>
                Your current balance: <span className="font-bold text-primary">{walletBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="recipientIdentifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient's Email or User ID</FormLabel>
                  <FormControl>
                    <Input placeholder="recipient@example.com or user-id" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (USD)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} step="0.01" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Transfer Funds"}
              {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
