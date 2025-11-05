
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, updateDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import type { CardApplication } from "@/lib/data";
import { Loader2 } from "lucide-react";

interface ManageCardApplicationDialogProps {
  application: CardApplication;
  children: React.ReactNode;
}

const formSchema = z.object({
  cardNumber: z.string().refine((val) => !val || /^\d{4} \d{4} \d{4} \d{4}$/.test(val), {
    message: "Card number must be 16 digits.",
  }),
  expiryDate: z.string().refine((val) => !val || /^(0[1-9]|1[0-2])\/\d{2}$/.test(val), {
    message: "Expiry date must be in MM/YY format.",
  }),
  cvc: z.string().refine((val) => !val || (val.length >= 3 && val.length <= 4), {
    message: "CVC must be 3-4 digits.",
  }),
  brand: z.string().optional(),
  adminInstruction: z.string().optional(),
});


export function ManageCardApplicationDialog({
  application,
  children,
}: ManageCardApplicationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cardNumber: application.cardNumber || "",
      expiryDate: application.expiryDate || "",
      cvc: application.cvc || "",
      brand: application.brand || "Mastercard",
      adminInstruction: application.adminInstruction || "",
    },
  });

  const handleStatusChange = (newStatus: "Approved" | "Rejected") => {
    if (!firestore) return;
    const appRef = doc(firestore, `card_applications/${application.id}`);
    updateDocumentNonBlocking(appRef, { status: newStatus });
    toast({ title: `Application ${newStatus}` });
    setIsOpen(false);
  };
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!firestore) return;
    const appRef = doc(firestore, `card_applications/${application.id}`);
    
    // Extract last 4 digits if card number is provided
    const last4 = values.cardNumber ? values.cardNumber.slice(-4) : undefined;

    const dataToUpdate: any = {
      ...values,
      status: 'Approved',
      mercuryCardLast4: last4,
    };

    if (!values.adminInstruction) {
      dataToUpdate.adminInstruction = ""; // Explicitly clear if empty
    }

    updateDocumentNonBlocking(appRef, dataToUpdate);

    toast({
      title: "Card Details Updated",
      description: "The virtual card has been issued/updated successfully.",
      className: "bg-accent text-accent-foreground",
    });
    setIsOpen(false);
  }

  const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between items-start border-b pb-2 mb-2">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-right font-mono text-sm text-foreground break-all">{value}</dd>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Card Application</DialogTitle>
          <DialogDescription>
            Review applicant details and issue card information.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <h3 className="font-semibold">Applicant Information</h3>
            <dl className="space-y-2">
                <DetailRow label="Name" value={application.name} />
                <DetailRow label="Email" value={application.email} />
                <DetailRow label="Phone" value={application.phone} />
                <DetailRow label="Billing Address" value={application.billingAddress} />
            </dl>
            <div className="pt-4 border-t">
                <h3 className="font-semibold">Issue Virtual Card / Instructions</h3>
                <p className="text-xs text-muted-foreground mb-4">Fill card details to approve or add an instruction for the user.</p>
                 <Form {...form}>
                    <form id="card-issue-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="cardNumber"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Card Number</FormLabel>
                                <FormControl>
                                    <Input placeholder="0000 0000 0000 0000" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="expiryDate"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Expiry (MM/YY)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="MM/YY" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="cvc"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>CVC</FormLabel>
                                    <FormControl>
                                        <Input placeholder="123" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="brand"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Card Brand</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Mastercard" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="adminInstruction"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Instruction for User</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="e.g., Your card is ready for use..." {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </form>
                 </Form>
            </div>
        </div>

        <DialogFooter className="flex-wrap gap-2">
            <Button form="card-issue-form" type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                Approve & Save Changes
            </Button>
            {application.status !== 'Rejected' && (
                 <Button variant="destructive" onClick={() => handleStatusChange('Rejected')}>
                    Reject
                </Button>
            )}
            <DialogClose asChild>
                <Button type="button" variant="secondary">
                    Close
                </Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
