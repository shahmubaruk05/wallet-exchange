
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, setDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import type { ExchangeLimit } from "@/lib/data";
import { Loader2 } from "lucide-react";

interface ManageLimitDialogProps {
  limit?: ExchangeLimit;
  children: React.ReactNode;
}

const formSchema = z.object({
  fromCurrency: z.string().min(1, "Required"),
  toCurrency: z.string().min(1, "Required"),
  minAmount: z.coerce.number().min(0, "Must be non-negative"),
  maxAmount: z.coerce.number().min(0, "Must be non-negative"),
}).refine(data => data.maxAmount >= data.minAmount, {
    message: "Max amount must be greater than or equal to min amount.",
    path: ["maxAmount"],
});


export function ManageLimitDialog({
  limit,
  children,
}: ManageLimitDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const currencies = ["USD", "BDT"];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fromCurrency: limit?.fromCurrency || "",
      toCurrency: limit?.toCurrency || "",
      minAmount: limit?.minAmount || 0,
      maxAmount: limit?.maxAmount || 1000,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!firestore) return;
    
    if (limit?.id) {
        // Update existing limit
        const limitRef = doc(firestore, `exchange_limits/${limit.id}`);
        updateDocumentNonBlocking(limitRef, values);
         toast({
            title: "Limit Updated",
            description: "The exchange limit has been successfully updated.",
            className: "bg-accent text-accent-foreground",
        });
    } else {
        // Create new limit
        const limitsCol = collection(firestore, 'exchange_limits');
        addDocumentNonBlocking(limitsCol, values);
         toast({
            title: "Limit Created",
            description: "A new exchange limit has been created.",
            className: "bg-accent text-accent-foreground",
        });
    }
    setIsOpen(false);
    form.reset();
  }
  
   const isEditing = !!limit;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Manage' : 'Create'} Exchange Limit</DialogTitle>
          <DialogDescription>
            Set the minimum and maximum amounts for a currency pair.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form id="limit-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                 <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="fromCurrency"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>From</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEditing}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="toCurrency"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>To</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEditing}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <FormField
                    control={form.control}
                    name="minAmount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Minimum Amount</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="e.g., 10" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="maxAmount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Maximum Amount</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="e.g., 1000" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
        <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">
                    Cancel
                </Button>
            </DialogClose>
            <Button form="limit-form" type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                {isEditing ? 'Save Changes' : 'Create Limit'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    