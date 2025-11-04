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
import { ArrowRight, ArrowLeft, CheckCircle, RefreshCw, Loader2 } from "lucide-react";
import {
  paymentMethods,
  type PaymentMethod,
} from "@/lib/data";
import PaymentIcon from "@/components/PaymentIcons";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import type { ExchangeRate } from "@/lib/data";

type Step = "form" | "confirm" | "status";

const TRANSACTION_FEE_PERCENTAGE = 0.05; // 5%

export default function ExchangeForm() {
  const [step, setStep] = useState<Step>("form");
  const [sendAmount, setSendAmount] = useState<string>("100");
  const [receiveAmount, setReceiveAmount] = useState<string>("");
  const [sendMethodId, setSendMethodId] = useState<string>("paypal");
  const [receiveMethodId, setReceiveMethodId] = useState<string>("bkash");
  const [isCalculating, setIsCalculating] = useState(false);
  const [transactionFee, setTransactionFee] = useState<number>(0);

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const exchangeRatesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'exchange_rates');
  }, [firestore]);

  const { data: exchangeRatesData } = useCollection<ExchangeRate>(exchangeRatesQuery);

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

  useEffect(() => {
    const calculateExchange = () => {
      setIsCalculating(true);
      const amount = parseFloat(sendAmount);
      if (isNaN(amount) || amount <= 0) {
        setReceiveAmount("");
        setTransactionFee(0);
        setIsCalculating(false);
        return;
      }

      let fee = 0;
      if (['paypal', 'payoneer', 'wise'].includes(sendMethod.id)) {
        fee = amount * TRANSACTION_FEE_PERCENTAGE;
      }
      setTransactionFee(fee);
      
      const amountAfterFee = amount - fee;

      let result = 0;
      if (sendMethod.currency === "USD" && receiveMethod.currency === "BDT") {
        result = amountAfterFee * exchangeRates.USD_TO_BDT;
      } else if (
        sendMethod.currency === "BDT" &&
        receiveMethod.currency === "USD"
      ) {
        result = amountAfterFee / exchangeRates.BDT_TO_USD_RATE;
      } else {
        result = amountAfterFee; // Same currency
      }

      // Simulate calculation delay
      setTimeout(() => {
        setReceiveAmount(result.toFixed(2));
        setIsCalculating(false);
      }, 300);
    };

    calculateExchange();
  }, [sendAmount, sendMethod, receiveMethod, exchangeRates]);

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
            description: "Please log in to create an exchange.",
            variant: "destructive",
        });
        return;
    }
    setStep("confirm");
  };

  const handleConfirm = () => {
    if (!user || !firestore) return;

    const transactionData = {
        userId: user.uid,
        paymentMethod: sendMethod.name,
        withdrawalMethod: receiveMethod.name,
        amount: parseFloat(sendAmount),
        currency: sendMethod.currency,
        exchangeRateId: "dummy-rate-id", // Replace with actual rate ID from Firestore
        receivedAmount: parseFloat(receiveAmount),
        status: "Processing",
        transactionDate: new Date().toISOString(),
    };
    
    const transactionsColRef = collection(firestore, `users/${user.uid}/transactions`);
    addDocumentNonBlocking(transactionsColRef, transactionData);

    setStep("status");
  };
  
  const startNewTransaction = () => {
    setStep('form');
    setSendAmount('100');
    setSendMethodId('paypal');
    setReceiveMethodId('bkash');
  }

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
                  {paymentMethods.map((method) => (
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

          <div className="flex justify-center my-4">
             <RefreshCw className="h-6 w-6 text-muted-foreground" />
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
                  {paymentMethods.map((method) => (
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
                type="text"
                value={receiveAmount}
                readOnly
                className="h-12 text-lg bg-muted pr-16"
                placeholder="0.00"
              />
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground font-semibold">
                {receiveMethod.currency}
              </span>
              {isCalculating && <Loader2 className="absolute top-1/2 -translate-y-1/2 right-20 h-5 w-5 animate-spin text-primary" />}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" size="lg">
            Exchange <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </form>
    </Card>
  );

  const renderConfirm = () => {
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
      <CardContent className="space-y-6">
        <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">You Send</span>
            <span className="font-semibold flex items-center gap-2">
              <PaymentIcon id={sendMethod.id} className="w-5 h-5"/>
              {amountNum.toFixed(2)} {sendMethod.currency}
            </span>
          </div>
          {transactionFee > 0 && (
             <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Transaction Fee ({sendMethod.name})</span>
              <span className="font-semibold text-destructive">
                - {transactionFee.toFixed(2)} {sendMethod.currency}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center text-base">
            <span className="text-muted-foreground">You Receive</span>
            <span className="font-bold text-lg text-accent-foreground flex items-center gap-2">
              <PaymentIcon id={receiveMethod.id} className="w-5 h-5"/>
              {receiveAmount} {receiveMethod.currency}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-lg border space-y-4">
            <div>
                <h3 className="font-semibold mb-1">Step 1: Send Money</h3>
                <p className="text-sm text-muted-foreground">
                    Please send exactly <strong className="text-primary">{amountNum.toFixed(2)} {sendMethod.currency}</strong> to the following address/number:
                </p>
                <div className="mt-2 p-3 bg-primary/10 rounded-md text-center font-mono text-primary-foreground tracking-wider">
                    {instruction}
                </div>
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col sm:flex-row gap-2">
        <Button variant="outline" onClick={() => setStep('form')} className="w-full sm:w-auto">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={handleConfirm} className="w-full sm:w-auto flex-grow">
          I Have Paid
        </Button>
      </CardFooter>
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
        <div className="w-full pt-4">
           <Button onClick={startNewTransaction} className="w-full">
            Start New Transaction
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
