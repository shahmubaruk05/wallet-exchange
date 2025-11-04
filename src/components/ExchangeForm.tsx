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
  exchangeRates,
  type PaymentMethod,
} from "@/lib/data";
import PaymentIcon from "@/components/PaymentIcons";
import { useToast } from "@/hooks/use-toast";

type Step = "form" | "confirm" | "status";

export default function ExchangeForm() {
  const [step, setStep] = useState<Step>("form");
  const [sendAmount, setSendAmount] = useState<string>("100");
  const [receiveAmount, setReceiveAmount] = useState<string>("");
  const [sendMethodId, setSendMethodId] = useState<string>("paypal");
  const [receiveMethodId, setReceiveMethodId] = useState<string>("bkash");
  const [isCalculating, setIsCalculating] = useState(false);

  const { toast } = useToast();

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
        setIsCalculating(false);
        return;
      }

      let result = 0;
      if (sendMethod.currency === "USD" && receiveMethod.currency === "BDT") {
        result = amount * exchangeRates.USD_TO_BDT;
      } else if (
        sendMethod.currency === "BDT" &&
        receiveMethod.currency === "USD"
      ) {
        result = amount / exchangeRates.BDT_TO_USD_RATE;
      } else {
        result = amount; // Same currency
      }

      // Simulate calculation delay
      setTimeout(() => {
        setReceiveAmount(result.toFixed(2));
        setIsCalculating(false);
      }, 300);
    };

    calculateExchange();
  }, [sendAmount, sendMethod, receiveMethod]);

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
    setStep("confirm");
  };

  const handleConfirm = () => {
    setStep("status");
    // In a real app, you would submit to a server action here.
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

  const renderConfirm = () => (
     <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle>Confirm Transaction</CardTitle>
        <CardDescription>Review the details and proceed with payment.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-muted/50 space-y-4 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">You Send</span>
            <span className="font-semibold text-lg flex items-center gap-2">
              <PaymentIcon id={sendMethod.id} className="w-5 h-5"/>
              {parseFloat(sendAmount).toFixed(2)} {sendMethod.currency}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">You Receive</span>
            <span className="font-semibold text-lg flex items-center gap-2">
              <PaymentIcon id={receiveMethod.id} className="w-5 h-5"/>
              {receiveAmount} {receiveMethod.currency}
            </span>
          </div>
        </div>
        <div className="p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">Payment Instructions</h3>
          <p className="text-sm text-muted-foreground">
            Please send exactly <strong className="text-primary">{parseFloat(sendAmount).toFixed(2)} {sendMethod.currency}</strong> to the following address/number:
          </p>
          <div className="mt-2 p-3 bg-primary/10 rounded-md text-center font-mono text-primary-foreground tracking-wider">
            {sendMethod.type === 'mobile' ? '01234567890' : 'user@example.com'}
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
