"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { exchangeRates as defaultRates } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight } from "lucide-react";

const AdminRatesPage = () => {
  const [usdToBdt, setUsdToBdt] = useState(defaultRates.USD_TO_BDT);
  const [bdtToUsdRate, setBdtToUsdRate] = useState(
    defaultRates.BDT_TO_USD_RATE
  );
  const { toast } = useToast();

  const handleSave = () => {
    // In a real app, this would be a server action to update the database.
    // For now, we'll just show a toast notification.
    defaultRates.USD_TO_BDT = usdToBdt;
    defaultRates.BDT_TO_USD_RATE = bdtToUsdRate;

    toast({
      title: "Rates Updated",
      description: "The new exchange rates have been saved.",
      className: "bg-accent text-accent-foreground",
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manage Exchange Rates</h1>
      <Card>
        <CardHeader>
          <CardTitle>Current Rates</CardTitle>
          <CardDescription>
            Update the values used for currency conversion.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full space-y-2">
              <Label htmlFor="usd-to-bdt">USD <ArrowRight className="inline h-4 w-4"/> BDT</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$1 =</span>
                <Input
                  id="usd-to-bdt"
                  type="number"
                  value={usdToBdt}
                  onChange={(e) => setUsdToBdt(Number(e.target.value))}
                  className="pl-12"
                />
                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">BDT</span>
              </div>
               <p className="text-xs text-muted-foreground">Rate for selling USD to users.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full space-y-2">
               <Label htmlFor="bdt-to-usd">BDT <ArrowRight className="inline h-4 w-4"/> USD</Label>
               <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$1 =</span>
                <Input
                  id="bdt-to-usd"
                  type="number"
                  value={bdtToUsdRate}
                  onChange={(e) => setBdtToUsdRate(Number(e.target.value))}
                  className="pl-12"
                />
                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">BDT</span>
              </div>
              <p className="text-xs text-muted-foreground">Rate for buying USD from users (usually higher).</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave}>Save Changes</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminRatesPage;
