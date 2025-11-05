
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, CheckCircle, Loader2, Info, Copy, Check } from "lucide-react";
import { paymentMethods } from "@/lib/data";
import PaymentIcon from "@/components/PaymentIcons";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection } from "firebase/firestore";
import type { ExchangeRate } from "@/lib/data";
import Link from "next/link";

type Step = "form" | "confirm" | "status";

export default function CardTopUpPage() {
  const [step, setStep] = useState<Step>("form");
  const [sendAmount, setSendAmount] = useState<string>("1000");
  const [receiveAmount, setReceiveAmount] = useState<string>("");
  const [sendMethodId, setSendMethodId] = useState<string>("bkash");
  const [isCalculating, setIsCalculating] = useState(false);
  const [rateText, setRateText] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Confirmation step state
  const [sendingAccountId, setSendingAccountId] = useState('');
  const [transactionId, setTransactionId] = useState('');

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const exchangeRatesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'exchange_rates');
  }, [firestore]);

  const { data: exchangeRatesData } = useCollection<ExchangeRate>(exchangeRatesQuery);

  const exchangeRates = useMemo(() => {
    if (!exchangeRatesData) return { BDT_TO_USD_RATE: 127.0 };
    const bdtToUsdRate = exchangeRatesData.find(rate => rate.fromCurrency === 'BDT' && rate.toCurrency === 'USD')?.rate;
    return {
      BDT_TO_USD_RATE: bdtToUsdRate || 127.0,
    };
  }, [exchangeRatesData]);

  const sendMethod = useMemo(
    () => paymentMethods.find((p) => p.id === sendMethodId)!,
    [sendMethodId]
  );
  
  const bdtPaymentMethods = useMemo(() => paymentMethods.filter(p => p.currency === 'BDT'), []);

  useEffect(() => {
    const calculateExchange = () => {
      setIsCalculating(true);
      const amount = parseFloat(sendAmount);
      if (isNaN(amount) || amount <= 0) {
        setReceiveAmount("");
        setRateText("");
        setIsCalculating(false);
        return;
      }
      
      let result = 0;
      let rateString = "";
      if (sendMethod.currency === "BDT") {
        result = amount / exchangeRates.BDT_TO_USD_RATE;
        rateString = `1 USD = ${exchangeRates.BDT_TO_USD_RATE} BDT`;
      } else {
        result = amount; // Should not happen with current logic, but as a fallback
        rateString = `1 ${sendMethod.currency} = 1 ${sendMethod.currency}`;
      }

      setTimeout(() => {
        setReceiveAmount(result.toFixed(2));
        setRateText(rateString);
        setIsCalculating(false);
      }, 300);
    };

    calculateExchange();
  }, [sendAmount, sendMethod, exchangeRates]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseFloat(sendAmount) <= 0 || isNaN(parseFloat(sendAmount))) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to send.",
        variant: "destructive",
      });
      return;
    }
    if (!user) {
        toast({
            title: "Authentication Required",
            description: "Please log in to top up your card.",
            variant: "destructive",
        });
        return;
    }
    setStep("confirm");
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) return;
     if (!sendingAccountId || !transactionId) {
      toast({
        title: "Missing Information",
        description: "Please fill out all fields.",
        variant: "destructive",
      });
      return;
    }

    const topUpData = {
        userId: user.uid,
        paymentMethod: sendMethod.name,
        sentAmount: parseFloat(sendAmount),
        sentCurrency: sendMethod.currency,
        topUpAmountUSD: parseFloat(receiveAmount),
        status: "Pending",
        createdAt: new Date().toISOString(),
        sendingAccountId,
        transactionId,
    };
    
    const topUpsColRef = collection(firestore, `card_top_ups`);
    addDocumentNonBlocking(topUpsColRef, topUpData);

    setStep("status");
  };
  
  const startNewTransaction = () => {
    setStep('form');
    setSendAmount('1000');
    setSendMethodId('bkash');
    setSendingAccountId('');
    setTransactionId('');
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: 'Copied to clipboard!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const renderForm = () => (
     <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl">
          Card Top Up
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Add funds to your virtual card.
        </p>
      </div>
        <Card className="w-full shadow-lg">
        <CardHeader>
            <CardTitle>Enter Top Up Amount</CardTitle>
            <CardDescription>
            Select your payment method and enter the amount you want to send.
            </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                <Label htmlFor="send-method">You Send</Label>
                <Select
                    value={sendMethodId}
                    onValueChange={(value) => setSendMethodId(value)}
                >
                    <SelectTrigger id="send-method" className="h-12">
                    <SelectValue>
                        <div className="flex items-center gap-3">
                        <PaymentIcon id={sendMethodId} />
                        <span>{sendMethod.name}</span>
                        </div>
                    </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                    {bdtPaymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                        <div className="flex items-center gap-3">
                            <PaymentIcon id={method.id} />
                            <span>{method.name}</span>
                        </div>
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                </div>
                <div className="relative">
                <Input
                    id="send-amount"
                    type="number"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    className="h-12 text-lg pr-16"
                    placeholder="0.00"
                    step="0.01"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground font-semibold">
                    {sendMethod.currency}
                </span>
                </div>
            </div>

            <div className="flex justify-center my-2 items-center text-sm font-medium text-muted-foreground">
                {isCalculating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
                ) : rateText ? (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                    <Info className="h-4 w-4" />
                    <span>Rate: {rateText}</span>
                </div>
                ) : null}
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                    <Label>You Get (on Card)</Label>
                     <div className="h-12 flex items-center gap-3">
                         <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted">
                            <DollarSign className="h-6 w-6 text-primary"/>
                         </div>
                        <span className="font-bold text-lg">Card Balance</span>
                    </div>
                </div>

                <div className="relative">
                <Input
                    id="receive-amount"
                    type="text"
                    value={receiveAmount}
                    readOnly
                    className="h-12 text-lg bg-muted pr-16"
                    placeholder="0.00"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground font-semibold">
                    USD
                </span>
                {isCalculating && <Loader2 className="absolute top-1/2 -translate-y-1/2 right-20 h-5 w-5 animate-spin text-primary" />}
                </div>
            </div>
            </CardContent>
            <CardFooter>
            <Button type="submit" className="w-full" size="lg">
                Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            </CardFooter>
        </form>
        </Card>
    </div>
  );

  const renderConfirm = () => {
    const paymentInstructions: { [key: string]: string } = {
      bkash: '01903068730',
      nagad: '01707170717',
    };
    const instruction = paymentInstructions[sendMethod.id];
    const amountNum = parseFloat(sendAmount);

    return (
     <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl">
            Confirm Top Up
            </h1>
        </div>
        <Card className="w-full shadow-lg">
        <CardHeader>
            <CardTitle>Confirm Transaction</CardTitle>
            <CardDescription>Review the details and proceed with payment.</CardDescription>
        </CardHeader>
        <form onSubmit={handleConfirm}>
            <CardContent className="space-y-6">
            <div className="p-4 rounded-lg border space-y-4">
                <div>
                    <h3 className="font-semibold mb-2 text-lg">Step 1: Send Money</h3>
                    <div className="text-sm space-y-1 text-muted-foreground">
                        <p>Amount: <strong className="text-primary">{amountNum.toFixed(2)} {sendMethod.currency}</strong></p>
                        <p>Method: <strong className="text-primary">{sendMethod.name}</strong></p>
                        <p>Instruction: Please send to the following address/number:</p>
                    </div>
                    <div className="mt-2 p-3 bg-primary/10 rounded-md flex items-center justify-between">
                        <span className="font-mono text-primary-foreground tracking-wider">{instruction}</span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopy(instruction)}
                            className="h-8 w-8"
                        >
                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="p-4 rounded-lg border space-y-4">
                <h3 className="font-semibold mb-4 text-lg">Step 2: Submit Your Information</h3>
                
                <div className="space-y-2">
                <Label htmlFor="sending-account">Your {sendMethod.name} Account</Label>
                <Input id="sending-account" value={sendingAccountId} onChange={(e) => setSendingAccountId(e.target.value)} placeholder={`Your ${sendMethod.name} number`} required />
                </div>

                <div className="space-y-2">
                <Label htmlFor="transaction-id">Your Transaction ID</Label>
                <Input id="transaction-id" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Enter the transaction ID" required />
                </div>
                
                <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm mt-4">
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">You are sending</span>
                    <span className="font-semibold flex items-center gap-2">
                    <PaymentIcon id={sendMethod.id} className="w-5 h-5"/>
                    {amountNum.toFixed(2)} {sendMethod.currency}
                    </span>
                </div>
                <div className="flex justify-between items-center text-base">
                    <span className="text-muted-foreground">You will receive</span>
                    <span className="font-bold text-lg text-accent-foreground flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary"/>
                    {receiveAmount} USD
                    </span>
                </div>
                </div>
            </div>
            </CardContent>
            <CardFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setStep('form')} className="w-full sm:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button type="submit" className="w-full sm:w-auto flex-grow">
                Confirm Top Up
            </Button>
            </CardFooter>
        </form>
        </Card>
     </div>
    );
  };

  const renderStatus = () => (
     <div className="container mx-auto max-w-2xl px-4 py-8">
        <Card className="w-full shadow-lg">
            <CardContent className="pt-6 text-center flex flex-col items-center justify-center space-y-4 min-h-80">
                <CheckCircle className="w-16 h-16 text-accent animate-pulse" />
                <h2 className="text-2xl font-bold">Top Up Request Received!</h2>
                <p className="text-muted-foreground">
                Your request is now <span className="text-primary font-semibold">Pending</span>. You will be notified once it's completed.
                </p>
                <div className="w-full pt-4 flex flex-col sm:flex-row gap-2">
                <Button onClick={startNewTransaction} className="w-full">
                    Start New Top Up
                </Button>
                <Button asChild variant="outline" className="w-full">
                    <Link href="/dashboard/cards">
                        Back to My Card
                    </Link>
                </Button>
                </div>
            </CardContent>
        </Card>
     </div>
  );

  switch (step) {
    case "form":
      return renderForm();
    case "confirm":
      return renderConfirm();
    case "status":
      return renderStatus();
    default:
      return renderForm();
  }
}

    