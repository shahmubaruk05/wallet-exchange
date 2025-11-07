
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function TransferForm() {

  return (
    <Card className="w-full shadow-lg">
        <CardHeader>
            <CardTitle>Feature Not Available</CardTitle>
            <CardDescription>
                This feature is currently under development.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <p>Please check back later.</p>
        </CardContent>
    </Card>
  );
}
