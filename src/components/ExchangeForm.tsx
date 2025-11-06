
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
import { ArrowRight, ArrowLeft, CheckCircle, RefreshCw, Loader2, Info, Copy, Check } from "lucide-react";
import {
  paymentMethods,
  type PaymentMethod,
  type ExchangeLimit,
  type User,
} from "@/lib/data";
import PaymentIcon from "@/components/PaymentIcons";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, useCollection, useMemoFirebase, addDocumentNonBlocking, runTransactionNonBlocking, useDoc } from "@/firebase";
import { collection, doc, increment } from "firebase/firestore";
import type { ExchangeRate } from "@/lib/data";
import Link from 'next/link';


type Step = "form" | "confirm" | "status";
type LastEdited = "send" | "receive";

export default function ExchangeForm() {
  const [step, setStep] = useState<Step>("form");
  const [sendAmount, setSendAmount] = useState<string>("100");
  const [receiveAmount, setReceiveAmount] = useState<string>("");
  const [sendMethodId, setSendMethodId] = useState<string>("paypal");
  const [receiveMethodId, setReceiveMethodId] = useState<string>("bkash");
  const [isCalculating, setIsCalculating] = useState(false);
  const [transactionFee, setTransactionFee] = useState<number>(0);
  const [rateText, setRateText] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [lastEdited, setLastEdited] = useState<LastEdited>("send");

  // New state for confirmation form
  const [sendingAccountId, setSendingAccountId] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [receivingAccountId, setReceivingAccountId] = useState('');


  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

   const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userData } = useDoc<User>(userDocRef);
  const walletBalance = userData?.walletBalance ?? 0;

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
    if (!exchangeRatesData) return { USD_TO_BDT: 122, BDT_TO_USD_RATE: 127.0 }; // Default values
    
    const usdToBdtRate = exchangeRatesData.find(rate => rate.fromCurrency === 'USD' && rate.toCurrency === 'BDT')?.rate;
    const bdtToUsdRate = exchangeRatesData.find(rate => rate.fromCurrency === 'BDT' && rate.toCurrency === 'USD')?.rate;

    return {
      USD_TO_BDT: usdToBdtRate || 122,
      BDT_TO_USD_RATE: bdtToUsdRate || 127.0,
    };
  }, [exchangeRatesData]);

  const sendMethod = useMemo(
    () => paymentMethods.find((p) => p.id === sendMethodId)!,
    [sendMethodId]
  );
  const receiveMethod = useMemo(
    () => paymentMethods.find((p) => p.id === receiveMethodId)!,
    [receiveMethodId]
  );

  const currentLimit = useMemo(() => {
    if (!limitsData) return null;
    return limitsData.find(
      (limit) =>
        limit.fromMethod === sendMethod.id && limit.toMethod === receiveMethod.id
    );
  }, [limitsData, sendMethod, receiveMethod]);

  useEffect(() => {
    const calculateExchange = () => {
      setIsCalculating(true);
      
      if (sendMethod.id === 'wallet') {
          const amount = parseFloat(sendAmount);
          const amountAfterFee = amount; // No fee for wallet to other
          const result = amountAfterFee * exchangeRates.USD_TO_BDT;
          setReceiveAmount(result > 0 ? result.toFixed(2) : "");
          setTransactionFee(0);
          setRateText(`1 USD = ${exchangeRates.USD_TO_BDT} BDT`);
          setIsCalculating(false);
          return;
      }


      const feePercentages: { [key: string]: number } = {
        bkash: 0.0185,
        nagad: 0.014,
        wise: 0.029,
        payoneer: 0.01,
        paypal: 0.05,
      };
      const feePercentage = feePercentages[sendMethod.id] || 0;

      let rateString = "";
      if (sendMethod.currency === "USD" && receiveMethod.currency === "BDT") {
        rateString = `1 USD = ${exchangeRates.USD_TO_BDT} BDT`;
      } else if (sendMethod.currency === "BDT" && receiveMethod.currency === "USD") {
        rateString = `1 USD = ${exchangeRates.BDT_TO_USD_RATE} BDT`;
      } else {
        rateString = `1 ${sendMethod.currency} = 1 ${receiveMethod.currency}`;
      }

      if (lastEdited === 'send') {
        const amount = parseFloat(sendAmount);
        if (isNaN(amount) || amount <= 0) {
          setReceiveAmount("");
          setTransactionFee(0);
        } else {
          const fee = amount * feePercentage;
          setTransactionFee(fee);
          const amountAfterFee = amount - fee;

          let result = 0;
          if (sendMethod.currency === "USD" && receiveMethod.currency === "BDT") {
            result = amountAfterFee * exchangeRates.USD_TO_BDT;
          } else if (sendMethod.currency === "BDT" && receiveMethod.currency === "USD") {
            result = amountAfterFee / exchangeRates.BDT_TO_USD_RATE;
          } else {
            result = amountAfterFee;
          }
          setReceiveAmount(result > 0 ? result.toFixed(2) : "");
        }
      } else { // lastEdited === 'receive'
        const amount = parseFloat(receiveAmount);
        if (isNaN(amount) || amount <= 0) {
          setSendAmount("");
          setTransactionFee(0);
        } else {
          let amountBeforeFee = 0;
          if (sendMethod.currency === "USD" && receiveMethod.currency === "BDT") {
            amountBeforeFee = amount / exchangeRates.USD_TO_BDT;
          } else if (sendMethod.currency === "BDT" && receiveMethod.currency === "USD") {
            amountBeforeFee = amount * exchangeRates.BDT_TO_USD_RATE;
          } else {
            amountBeforeFee = amount;
          }
          
          const originalAmount = amountBeforeFee / (1 - feePercentage);
          const fee = originalAmount * feePercentage;
          setTransactionFee(fee);
          setSendAmount(originalAmount > 0 ? originalAmount.toFixed(2) : "");
        }
      }

      setRateText(rateString);
      setIsCalculating(false);
    };

    const debounce = setTimeout(calculateExchange, 300);
    return () => clearTimeout(debounce);
  }, [sendAmount, receiveAmount, sendMethod, receiveMethod, exchangeRates, lastEdited]);
  
  const handleSendAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSendAmount(e.target.value);
    setLastEdited('send');
  };

  const handleReceiveAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReceiveAmount(e.target.value);
    setLastEdited('receive');
  };


  const handleSendMethodChange = (value: string) => {
    if (value === receiveMethodId) {
      const newReceiveMethod = paymentMethods.find((p) => p.id !== value);
      if (newReceiveMethod) setReceiveMethodId(newReceiveMethod.id);
    }
    setSendMethodId(value);
  };

  const handleReceiveMethodChange = (value: string) => {
    if (value === sendMethodId) {
      const newSendMethod = paymentMethods.find((p) => p.id !== value);
      if (newSendMethod) setSendMethodId(newSendMethod.id);
    }
    setReceiveMethodId(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(sendAmount);

    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to send.",
        variant: "destructive",
      });
      return;
    }
    
    if (sendMethod.id === 'wallet') {
      if (amount > walletBalance) {
        toast({
          title: "Insufficient Wallet Balance",
          description: `You only have ${walletBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} available.`,
          variant: "destructive",
        });
        return;
      }
    }


    if (currentLimit) {
      if (amount < currentLimit.minAmount) {
        toast({
          title: "Amount Too Low",
          description: `Minimum exchange amount is ${currentLimit.minAmount} ${sendMethod.currency}.`,
          variant: "destructive",
        });
        return;
      }
      if (amount > currentLimit.maxAmount) {
        toast({
          title: "Amount Too High",
          description: `Maximum exchange amount is ${currentLimit.maxAmount} ${sendMethod.currency}.`,
          variant: "destructive",
        });
        return;
      }
    }

    if (!user) {
        toast({
            title: "Authentication Required",
            description: "Please log in to create an exchange.",
            variant: "destructive",
        });
        return;
    }
    setStep("confirm");
  };

  const handleWalletConfirm = async (e: React.FormEvent) => {
     e.preventDefault();
    if (!user || !firestore || !userDocRef) return;

    const amountToDeduct = parseFloat(sendAmount);
    if (amountToDeduct > walletBalance) {
       toast({ title: "Insufficient Balance", description: "Your wallet balance is too low for this transaction.", variant: "destructive" });
       setStep('form');
       return;
    }
    
    if (!receivingAccountId) {
         toast({ title: "Missing Information", description: "Please provide your receiving account number.", variant: "destructive" });
         return;
    }

    await runTransactionNonBlocking(firestore, async (transaction) => {
      const userSnapshot = await transaction.get(userDocRef);
      const currentBalance = userSnapshot.data()?.walletBalance ?? 0;
      
      if (currentBalance < amountToDeduct) {
        throw new Error("Insufficient balance.");
      }

      // Deduct from wallet
      transaction.update(userDocRef, { walletBalance: increment(-amountToDeduct) });

      // Create a pending transaction log
      const newTxRef = doc(collection(firestore, `users/${user.uid}/transactions`));
      transaction.set(newTxRef, {
        userId: user.uid,
        paymentMethod: sendMethod.name,
        withdrawalMethod: receiveMethod.name,
        amount: amountToDeduct,
        currency: sendMethod.currency,
        receivedAmount: parseFloat(receiveAmount),
        status: "Pending" as const,
        transactionDate: new Date().toISOString(),
        sendingAccountId: "Wallet",
        transactionId: `WALLET_EXCHANGE_${Date.now()}`,
        receivingAccountId,
        transactionFee: 0,
        adminNote: "Awaiting admin approval.",
        transactionType: 'EXCHANGE' as const,
        exchangeRateId: "N/A",
      });
    });

    toast({
      title: "Exchange Request Submitted!",
      description: "Your request has been submitted and is awaiting admin approval.",
      className: "bg-accent text-accent-foreground",
    });
    setStep("status");
  }

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (sendMethod.id === 'wallet') {
      handleWalletConfirm(e);
      return;
    }

    if (!user || !firestore) return;
     if (!sendingAccountId || !transactionId || !receivingAccountId) {
      toast({
        title: "Missing Information",
        description: "Please fill out all fields in Step 2.",
        variant: "destructive",
      });
      return;
    }


    const transactionData = {
        userId: user.uid,
        paymentMethod: sendMethod.name,
        withdrawalMethod: receiveMethod.name,
        amount: parseFloat(sendAmount),
        currency: sendMethod.currency,
        exchangeRateId: "dummy-rate-id", // Replace with actual rate ID from Firestore
        receivedAmount: parseFloat(receiveAmount),
        status: "Processing" as const,
        transactionDate: new Date().toISOString(),
        sendingAccountId,
        transactionId,
        receivingAccountId,
        transactionFee,
        transactionType: 'EXCHANGE' as const,
    };
    
    const transactionsColRef = collection(firestore, `users/${user.uid}/transactions`);
    addDocumentNonBlocking(transactionsColRef, transactionData);

    setStep("status");
  };
  
  const startNewTransaction = () => {
    setStep('form');
    setSendAmount('100');
    setReceiveAmount('');
    setLastEdited('send');
    setSendMethodId('paypal');
    setReceiveMethodId('bkash');
    setSendingAccountId('');
    setTransactionId('');
    setReceivingAccountId('');
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
        <CardTitle>Create Exchange</CardTitle>
        <CardDescription>
          Select your payment and withdrawal methods.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="send-method">You Send</Label>
              <Select
                value={sendMethodId}
                onValueChange={handleSendMethodChange}
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
                  {paymentMethods.filter(m => m.id !== 'virtual_card_top_up').map((method) => (
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
                {currentLimit && (
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                        <Info className="h-4 w-4" />
                        <span>Limit: {currentLimit.minAmount} - {currentLimit.maxAmount} {sendMethod.currency}</span>
                    </div>
                )}
                </>
            )}
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="receive-method">You Get</Label>
              <Select
                value={receiveMethodId}
                onValueChange={handleReceiveMethodChange}
              >
                <SelectTrigger id="receive-method" className="h-12">
                  <SelectValue>
                    <div className="flex items-center gap-3">
                      <PaymentIcon id={receiveMethodId} />
                      <span>{receiveMethod.name}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.filter(m => m.id !== 'virtual_card_top_up').map((method) => (
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
                id="receive-amount"
                type="number"
                value={receiveAmount}
                onChange={handleReceiveAmountChange}
                className="h-12 text-lg pr-16"
                placeholder="0.00"
                step="0.01"
              />
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground font-semibold">
                {receiveMethod.currency}
              </span>
              {isCalculating && lastEdited === 'send' && <Loader2 className="absolute top-1/2 -translate-y-1/2 right-20 h-5 w-5 animate-spin text-primary" />}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" size="lg" disabled={isCalculating}>
             {isCalculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Exchange"}
             {!isCalculating && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );

  const renderConfirm = () => {
    if (sendMethod.id === 'wallet') {
      return (
        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle>Confirm Exchange from Wallet</CardTitle>
            <CardDescription>Review the details of your exchange.</CardDescription>
          </CardHeader>
          <form onSubmit={handleConfirm}>
            <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm mt-4">
                    <div className="flex justify-between items-center text-base">
                        <span className="text-muted-foreground">Your Current Wallet Balance</span>
                        <span className="font-bold text-lg text-accent-foreground">
                            {walletBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">You are sending</span>
                        <span className="font-semibold flex items-center gap-2">
                        <PaymentIcon id={sendMethod.id} className="w-5 h-5"/>
                        {parseFloat(sendAmount).toFixed(2)} {sendMethod.currency}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-base">
                        <span className="text-muted-foreground">You will receive</span>
                        <span className="font-bold text-lg text-accent-foreground flex items-center gap-2">
                          <PaymentIcon id={receiveMethod.id} className="w-5 h-5"/>
                          {receiveAmount} {receiveMethod.currency}
                        </span>
                    </div>
                </div>

                 <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="receiving-account">Your {receiveMethod.name} Account</Label>
                    <Input id="receiving-account" value={receivingAccountId} onChange={(e) => setReceivingAccountId(e.target.value)} placeholder={`Your ${receiveMethod.name} number`} required />
                </div>

            </CardContent>
            <CardFooter className="flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" onClick={() => setStep('form')} className="w-full sm:w-auto">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button type="submit" className="w-full sm:w-auto flex-grow">
                    Confirm Order
                </Button>
            </CardFooter>
          </form>
        </Card>
      );
    }
    
    const paymentInstructions: { [key: string]: string } = {
      paypal: 'pay@tabseerinc.com',
      payoneer: 'tabseerenterprise@gmail.com',
      wise: 'zahidfact@gmail.com',
      bkash: '01903068730',
      nagad: '01707170717',
    };
    const instruction = paymentInstructions[sendMethod.id];
    const amountNum = parseFloat(sendAmount);

    return (
     <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle>Confirm Transaction</CardTitle>
        <CardDescription>Review the details and proceed with payment.</CardDescription>
      </CardHeader>
      <form onSubmit={handleConfirm}>
        <CardContent className="space-y-6">
          {/* Step 1 */}
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

          {/* Step 2 */}
          <div className="p-4 rounded-lg border space-y-4">
            <h3 className="font-semibold mb-4 text-lg">Step 2: Submit Your Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="sending-account">Your {sendMethod.name} Account</Label>
              <Input id="sending-account" value={sendingAccountId} onChange={(e) => setSendingAccountId(e.target.value)} placeholder={`Your ${sendMethod.name} email / number`} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction-id">Your Transaction ID</Label>
              <Input id="transaction-id" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Enter the transaction ID" required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="receiving-account">Your {receiveMethod.name} Account</Label>
              <Input id="receiving-account" value={receivingAccountId} onChange={(e) => setReceivingAccountId(e.target.value)} placeholder={`Your ${receiveMethod.name} number`} required />
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
                  <span className="text-muted-foreground">Transaction Fee</span>
                  <span className="font-semibold text-destructive">
                    - {transactionFee.toFixed(2)} {sendMethod.currency}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-base">
                <span className="text-muted-foreground">You will receive</span>
                <span className="font-bold text-lg text-accent-foreground flex items-center gap-2">
                  <PaymentIcon id={receiveMethod.id} className="w-5 h-5"/>
                  {receiveAmount} {receiveMethod.currency}
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
            Confirm Order
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
        <h2 className="text-2xl font-bold">Payment Received!</h2>
        <p className="text-muted-foreground">
          Your transaction is now <span className="text-primary font-semibold">Processing</span>. You will be notified once it's completed.
        </p>
        <div className="w-full pt-4 flex flex-col gap-2 sm:flex-row">
           <Button onClick={startNewTransaction} className="w-full">
            Start New Transaction
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

    