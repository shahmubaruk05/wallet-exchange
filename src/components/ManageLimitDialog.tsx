
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
import { useFirestore, setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import type { ExchangeLimit } from "@/lib/data";
import { paymentMethods } from "@/lib/data";
import { Loader2 } from "lucide-react";

interface ManageLimitDialogProps {
  limit?: ExchangeLimit;
  children: React.ReactNode;
}

const formSchema = z.object({
  fromMethod: z.string().min(1, "Required"),
  toMethod: z.string().min(1, "Required"),
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: limit ? {
      fromMethod: limit.fromMethod,
      toMethod: limit.toMethod,
      minAmount: limit.minAmount,
      maxAmount: limit.maxAmount,
    } : {
      fromMethod: "",
      toMethod: "",
      minAmount: 0,
      maxAmount: 1000,
    },
  });
  
  const fromMethodId = form.watch("fromMethod");
  const toMethodId = form.watch("toMethod");

  const availableToMethods = paymentMethods.filter(p => p.id !== fromMethodId);
  const availableFromMethods = paymentMethods.filter(p => p.id !== toMethodId);


  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!firestore) return;
    
    const dataToSave = {
        ...values,
        fromCurrency: paymentMethods.find(p => p.id === values.fromMethod)?.currency,
        toCurrency: paymentMethods.find(p => p.id === values.toMethod)?.currency,
    }

    if (limit?.id) {
        // Update existing limit
        const limitRef = doc(firestore, `exchange_limits/${limit.id}`);
        updateDocumentNonBlocking(limitRef, dataToSave);
         toast({
            title: "Limit Updated",
            description: "The limit has been successfully updated.",
            className: "bg-accent text-accent-foreground",
        });
    } else {
        // Create new limit
        const limitsCol = collection(firestore, 'exchange_limits');
        addDocumentNonBlocking(limitsCol, dataToSave);
         toast({
            title: "Limit Created",
            description: "A new limit has been created.",
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
          <DialogTitle>{isEditing ? 'Manage' : 'Create'} Limit</DialogTitle>
          <DialogDescription>
            Set the min/max amounts for an exchange or top-up method pair.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form id="limit-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                 <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="fromMethod"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>From Method</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEditing}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select method" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {availableFromMethods.filter(p => p.id !== 'virtual_card_top_up').map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="toMethod"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>To Method</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEditing}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select method" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {availableToMethods.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
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
