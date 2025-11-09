
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wallet, ArrowLeftRight, CreditCard, List } from "lucide-react";

export function MobileDashboardNav() {
  return (
    <nav className="mt-4 grid grid-cols-2 gap-3 md:hidden">
      <Link href="/dashboard/add-funds">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
        >
          <Wallet className="h-4 w-4" />
          <span>Add Funds</span>
        </Button>
      </Link>

      <Link href="/dashboard/exchange">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
        >
          <ArrowLeftRight className="h-4 w-4" />
          <span>Exchange</span>
        </Button>
      </Link>

      <Link href="/dashboard/transactions">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
        >
          <List className="h-4 w-4" />
          <span>All Transactions</span>
        </Button>
      </Link>

      <Link href="/dashboard/cards">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
        >
          <CreditCard className="h-4 w-4" />
          <span>My Card</span>
        </Button>
      </Link>
    </nav>
  );
}
