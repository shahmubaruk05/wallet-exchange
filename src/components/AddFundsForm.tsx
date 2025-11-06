
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
import { ArrowRight, ArrowLeft, CheckCircle, Loader2, Info, Copy, Check, DollarSign } from "lucide-react";
import { paymentMethods, type ExchangeLimit } from "@/lib/data";
import PaymentIcon from "@/components/PaymentIcons";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection } from "firebase/firestore";
import type { ExchangeRate } from "@/lib/data";
import Link from "next/link";

type Step = "form" | "confirm" | "status";
type LastEdited = "send" | "receive";

export default function AddFundsForm() {
  const [step, setStep] = useState<Step>("form");
  const [sendAmount, setSendAmount] = useState<string>("1000");
  const [receiveAmount, setReceiveAmount] = useState<string>("");
  const [lastEdited, setLastEdited] = useState<LastEdited>("send");
  const [sendMethodId, setSendMethodId] = useState<string>("bkash");
  const [isCalculating, setIsCalculating] = useState(false);
  const [rateText, setRateText] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [transactionFee, setTransactionFee] = useState<number>(0);

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

  const exchangeLimitsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'exchange_limits');
  }, [firestore]);

  const { data: limitsData } = useCollection<ExchangeLimit>(exchangeLimitsQuery);

  const exchangeRates = useMemo(() => {
    if (!exchangeRatesData) return { BDT_TO_USD_RATE: 127.0 };
    const bdtToUsdRateDoc = exchangeRatesData.find(rate => rate.fromCurrency === 'BDT' && rate.toCurrency === 'USD');
    return {
      BDT_TO_USD_RATE: bdtToUsdRateDoc?.rate || 127.0,
    };
  }, [exchangeRatesData]);

  const sendMethod = useMemo(
    () => paymentMethods.find((p) => p.id === sendMethodId)!,
    [sendMethodId]
  );

  const currentLimit = useMemo(() => {
    if (!limitsData) return null;
    return limitsData.find(
      (limit) =>
        limit.fromMethod === sendMethod.id && limit.toMethod === 'wallet'
    );
  }, [limitsData, sendMethod]);
  
  const handleSendAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSendAmount(e.target.value);
    setLastEdited('send');
  };

  const handleReceiveAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReceiveAmount(e.target.value);
    setLastEdited('receive');
  };

  useEffect(() => {
    const feePercentages: { [key: string]: number } = {
      bkash: 0.0185,
      nagad: 0.014,
      wise: 0.029,
      payoneer: 0.01,
      paypal: 0.05,
    };
    const feePercentage = feePercentages[sendMethod.id] || 0;

    const calculate = () => {
      setIsCalculating(true);
      
      let rateString = "";
      if (sendMethod.currency === "BDT") {
          rateString = `1 USD = ${exchangeRates.BDT_TO_USD_RATE} BDT`;
      } else if (sendMethod.currency === "USD") {
          rateString = `1 USD = 1 USD`;
      }

      if (lastEdited === 'send') {
        const amount = parseFloat(sendAmount);
        if (isNaN(amount) || amount <= 0) {
          setReceiveAmount("");
          setTransactionFee(0);
          setRateText("");
          setIsCalculating(false);
          return;
        }
        
        const fee = amount * feePercentage;
        setTransactionFee(fee);
        const amountAfterFee = amount - fee;

        let result = 0;
        if (sendMethod.currency === "BDT") {
          result = amountAfterFee / exchangeRates.BDT_TO_USD_RATE;
        } else { // USD or other
          result = amountAfterFee;
        }
        setReceiveAmount(result > 0 ? result.toFixed(2) : "");

      } else { // lastEdited === 'receive'
        const amount = parseFloat(receiveAmount);
         if (isNaN(amount) || amount <= 0) {
          setSendAmount("");
          setTransactionFee(0);
          setRateText("");
          setIsCalculating(false);
          return;
        }

        let amountBeforeFee = 0;
        if (sendMethod.currency === "BDT") {
            amountBeforeFee = amount * exchangeRates.BDT_TO_USD_RATE;
        } else { // USD or other
            amountBeforeFee = amount;
        }

        const originalAmount = amountBeforeFee / (1 - feePercentage);
        const fee = originalAmount * feePercentage;
        setTransactionFee(fee);
        setSendAmount(originalAmount > 0 ? originalAmount.toFixed(2) : "");
      }
      
      setRateText(rateString);
      setIsCalculating(false);
    };

    const debounce = setTimeout(calculate, 300);
    return () => clearTimeout(debounce);
  }, [sendAmount, receiveAmount, lastEdited, sendMethod, exchangeRates]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sendAmountNum = parseFloat(sendAmount);

    if (isNaN(sendAmountNum) || sendAmountNum <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to send.",
        variant: "destructive",
      });
      return;
    }

    if (currentLimit) {
      if (sendAmountNum < currentLimit.minAmount) {
        toast({
          title: "Amount Too Low",
          description: `Minimum deposit amount is ${currentLimit.minAmount} ${sendMethod.currency}.`,
          variant: "destructive",
        });
        return;
      }
      if (sendAmountNum > currentLimit.maxAmount) {
        toast({
          title: "Amount Too High",
          description: `Maximum deposit amount is ${currentLimit.maxAmount} ${sendMethod.currency}.`,
          variant: "destructive",
        });
        return;
      }
    } 

    if (!user) {
        toast({
            title: "Authentication Required",
            description: "Please log in to add funds to your wallet.",
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

    const transactionData = {
        userId: user.uid,
        paymentMethod: sendMethod.name,
        withdrawalMethod: "Wallet Balance",
        amount: parseFloat(sendAmount),
        currency: sendMethod.currency,
        receivedAmount: parseFloat(receiveAmount),
        status: "Pending" as const,
        transactionDate: new Date().toISOString(),
        sendingAccountId,
        transactionId,
        receivingAccountId: "Wallet Deposit",
        transactionFee,
        adminNote: "",
        transactionType: 'ADD_FUNDS' as const,
        exchangeRateId: "dummy-rate-id",
    };
    
    const transactionsColRef = collection(firestore, `users/${user.uid}/transactions`);
    addDocumentNonBlocking(transactionsColRef, transactionData);

    setStep("status");
  };
  
  const startNewTransaction = () => {
    setStep('form');
    setSendAmount('1000');
    setReceiveAmount('');
    setLastEdited('send');
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
    <Card className="w-full shadow-lg">
    <CardHeader>
        <CardTitle>Enter Deposit Amount</CardTitle>
        <CardDescription>
        Select your payment method and enter the amount you want to deposit.
        </CardDescription>
    </CardHeader>
    <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
            <Label htmlFor="send-method">You Send</Label>
            <Select
                value={sendMethodId}
                onValueChange={(value) => {
                    setSendMethodId(value);
                    setLastEdited('receive'); // Recalculate based on receive amount
                }}
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
                {paymentMethods.filter(m => m.type !== 'virtual-card' && m.type !== 'wallet').map((method) => (
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
                onChange={handleSendAmountChange}
                className="h-12 text-lg pr-16"
                placeholder="0.00"
                step="0.01"
            />
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground font-semibold">
                {sendMethod.currency}
            </span>
             {isCalculating && lastEdited === 'receive' && <Loader2 className="absolute top-1/2 -translate-y-1/2 right-20 h-5 w-5 animate-spin text-primary" />}
            </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center text-sm font-medium text-muted-foreground gap-4">
            {isCalculating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <>
                {rateText && (
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                        <Info className="h-4 w-4" />
                        <span>Rate: {rateText}</span>
                    </div>
                )}
                {transactionFee > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                        <Info className="h-4 w-4" />
                        <span>Fee: {transactionFee.toFixed(2)} {sendMethod.currency}</span>
                    </div>
                )}
                 {currentLimit && (
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                        <Info className="h-4 w-4" />
                        <span>Limit: {currentLimit.minAmount.toLocaleString()} - {currentLimit.maxAmount.toLocaleString()} {sendMethod.currency}</span>
                    </div>
                )}
                </>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
                <Label>You Get (in Wallet)</Label>
                 <div className="h-12 flex items-center gap-3">
                     <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted">
                        <DollarSign className="h-6 w-6 text-primary"/>
                     </div>
                    <span className="font-bold text-lg">Wallet Balance</span>
                </div>
            </div>

            <div className="relative">
            <Input
                id="receive-amount"
                type="number"
                value={receiveAmount}
                onChange={handleReceiveAmountChange}
                className="h-12 text-lg pr-16"
                placeholder="0.00"
                step="0.01"
            />
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground font-semibold">
                USD
            </span>
            {isCalculating && lastEdited === 'send' && <Loader2 className="absolute top-1/2 -translate-y-1/2 right-20 h-5 w-5 animate-spin text-primary" />}
            </div>
        </div>
        </CardContent>
        <CardFooter>
        <Button type="submit" className="w-full" size="lg" disabled={isCalculating}>
            {isCalculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Deposit Funds"}
            {!isCalculating && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
        </CardFooter>
    </form>
    </Card>
  );

  const renderConfirm = () => {
    const paymentInstructions: { [key: string]: string } = {
      bkash: '01903068730',
      nagad: '01707170717',
      paypal: 'pay@tabseerinc.com',
      payoneer: 'tabseerenterprise@gmail.com',
      wise: 'zahidfact@gmail.com',
    };
    const instruction = paymentInstructions[sendMethod.id];
    const amountNum = parseFloat(sendAmount);

    return (
     <Card className="w-full shadow-lg">
        <CardHeader>
            <CardTitle>Confirm Deposit</CardTitle>
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
                    {transactionFee > 0 && (
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Fee</span>
                            <span className="font-semibold text-destructive">
                               - {transactionFee.toFixed(2)} {sendMethod.currency}
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between items-center text-base">
                        <span className="text-muted-foreground">You will receive in wallet</span>
                        <span className="font-bold text-lg text-accent-foreground flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-primary"/>
                        {receiveAmount} USD
                        </span>
                    </div>
                </div>
            </div>
            </CardContent>
            <CardFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => setStep('form')} className="w-full sm:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button type="submit" className="w-full sm:w-auto flex-grow">
                Confirm Deposit
            </Button>
            </CardFooter>
        </form>
     </Card>
    );
  };

  const renderStatus = () => (
    <Card className="w-full shadow-lg">
        <CardContent className="pt-6 text-center flex flex-col items-center justify-center space-y-4 min-h-80">
            <CheckCircle className="w-16 h-16 text-accent animate-pulse" />
            <h2 className="text-2xl font-bold">Deposit Request Received!</h2>
            <p className="text-muted-foreground">
            Your request is now <span className="text-primary font-semibold">Pending</span>. Your wallet will be credited once the transaction is completed.
            </p>
            <div className="w-full pt-4 flex flex-col sm:flex-row gap-2">
            <Button onClick={startNewTransaction} className="w-full">
                Add More Funds
            </Button>
            <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard">
                    Back to Dashboard
                </Link>
            </Button>
            </div>
        </CardContent>
    </Card>
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
