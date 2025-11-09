
"use client";

import { useState, useEffect, useMemo } from "react";
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
import { ArrowRight, Loader2, Info } from "lucide-react";
import {
  paymentMethods,
} from "@/lib/data";
import PaymentIcon from "@/components/PaymentIcons";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { ExchangeRate } from "@/lib/data";
import Link from 'next/link';


type LastEdited = "send" | "receive";

export default function HomepageExchangeForm() {
  const [sendAmount, setSendAmount] = useState<string>("100");
  const [receiveAmount, setReceiveAmount] = useState<string>("");
  const [sendMethodId, setSendMethodId] = useState<string>("paypal");
  const [receiveMethodId, setReceiveMethodId] = useState<string>("bkash");
  const [isCalculating, setIsCalculating] = useState(false);
  const [rateText, setRateText] = useState<string>("");
  const [lastEdited, setLastEdited] = useState<LastEdited>("send");

  const firestore = useFirestore();

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

      const feePercentages: { [key: string]: number } = {
        bkash: 0.0185,
        nagad: 0.014,
        wise: 0.029,
        payoneer: 0.01,
        paypal: 0.05,
        wallet: 0.0,
      };
      const feePercentage = feePercentages[sendMethod.id] || 0;

      let rateString = "";
      if (sendMethod.currency === "USD" && receiveMethod.currency === "BDT") {
        rateString = `1 USD = ${exchangeRates.USD_TO_BDT} BDT`;
      } else if (sendMethod.currency === "BDT" && receiveMethod.currency === "USD") {
        rateString = `1 USD = ${exchangeRates.BDT_TO_USD_RATE} BDT`;
      } else { // USD to USD
        rateString = `1 USD = 1 USD`;
      }

      if (lastEdited === 'send') {
        const amount = parseFloat(sendAmount);
        if (isNaN(amount) || amount <= 0) {
          setReceiveAmount("");
        } else {
          const fee = amount * feePercentage;
          const amountAfterFee = amount - fee;

          let result = 0;
          if (sendMethod.currency === "USD" && receiveMethod.currency === "BDT") {
            result = amountAfterFee * exchangeRates.USD_TO_BDT;
          } else if (sendMethod.currency === "BDT" && receiveMethod.currency === "USD") {
            result = amountAfterFee / exchangeRates.BDT_TO_USD_RATE;
          } else { // USD to USD
            result = amountAfterFee;
          }
          setReceiveAmount(result > 0 ? result.toFixed(2) : "");
        }
      } else { // lastEdited === 'receive'
        const amount = parseFloat(receiveAmount);
        if (isNaN(amount) || amount <= 0) {
          setSendAmount("");
        } else {
          let amountBeforeFee = 0;
          if (sendMethod.currency === "USD" && receiveMethod.currency === "BDT") {
            amountBeforeFee = amount / exchangeRates.USD_TO_BDT;
          } else if (sendMethod.currency === "BDT" && receiveMethod.currency === "USD") {
            amountBeforeFee = amount * exchangeRates.BDT_TO_USD_RATE;
          } else { // USD to USD
            amountBeforeFee = amount;
          }
          
          const originalAmount = amountBeforeFee / (1 - feePercentage);
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

  return (
    <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
            <Label htmlFor="send-method">You Send</Label>
            <Select
                value={sendMethodId}
                onValueChange={handleSendMethodChange}
            >
                <SelectTrigger id="send-method" className="h-11">
                <SelectValue>
                    <div className="flex items-center gap-2">
                    <PaymentIcon id={sendMethodId} className="w-5 h-5" />
                    <span className="truncate">{sendMethod.name}</span>
                    </div>
                </SelectValue>
                </SelectTrigger>
                <SelectContent>
                {paymentMethods.filter(m => m.type !== 'virtual-card').map((method) => (
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
                className="h-11 text-lg pr-14"
                placeholder="0.00"
                step="0.01"
            />
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground font-semibold">
                {sendMethod.currency}
            </span>
            </div>
        </div>

        <div className="flex justify-center items-center text-xs font-medium text-muted-foreground">
        {isCalculating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
            <>
            {rateText && (
                <div className="flex items-center gap-2 p-1.5 bg-muted/50 rounded-md">
                    <Info className="h-3 w-3" />
                    <span>{rateText}</span>
                </div>
            )}
            </>
        )}
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
            <Label htmlFor="receive-method">You Get</Label>
            <Select
                value={receiveMethodId}
                onValueChange={handleReceiveMethodChange}
            >
                <SelectTrigger id="receive-method" className="h-11">
                <SelectValue>
                    <div className="flex items-center gap-2">
                    <PaymentIcon id={receiveMethodId} className="w-5 h-5" />
                    <span className="truncate">{receiveMethod.name}</span>
                    </div>
                </SelectValue>
                </SelectTrigger>
                <SelectContent>
                {paymentMethods.filter(m => m.type !== 'virtual-card').map((method) => (
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
                className="h-11 text-lg pr-14"
                placeholder="0.00"
                step="0.01"
            />
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground font-semibold">
                {receiveMethod.currency}
            </span>
            </div>
        </div>
        <Button asChild className="w-full mt-4" size="lg">
            <Link href="/dashboard/exchange">
                Exchange Now <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
        </Button>
    </div>
  );
}
