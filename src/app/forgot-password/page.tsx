"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { sendPasswordResetEmail } from "firebase/auth";
import { Loader2, ArrowLeft } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
});

export default function ForgotPasswordPage() {
  const auth = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!auth) {
        toast({ title: "Error", description: "Could not connect to authentication service.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    try {
        await sendPasswordResetEmail(auth, values.email);
        setIsSuccess(true);
    } catch (error: any) {
        toast({
            title: "Error Sending Email",
            description: "Please check the email address and try again.",
            variant: "destructive",
        });
        console.error("Password reset error:", error);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-[80vh] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        {isSuccess ? (
             <CardContent className="pt-6 text-center">
                <CardTitle className="mb-4">Check Your Email</CardTitle>
                <CardDescription>
                    We have sent a password reset link to <span className="font-bold text-primary">{form.getValues('email')}</span>. Please check your inbox and follow the instructions.
                </CardDescription>
                <Button asChild className="mt-6 w-full">
                    <Link href="/login">
                        <ArrowLeft className="mr-2"/>
                        Back to Login
                    </Link>
                </Button>
            </CardContent>
        ) : (
        <>
            <CardHeader>
                <CardTitle>Forgot Password</CardTitle>
                <CardDescription>
                Enter your email address and we'll send you a link to reset your password.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input placeholder="user@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Send Reset Link
                    </Button>
                </form>
                </Form>
            </CardContent>
            <CardFooter>
                 <Button variant="link" className="w-full" asChild>
                    <Link href="/login">
                        <ArrowLeft className="mr-2"/>
                        Back to Login
                    </Link>
                </Button>
            </CardFooter>
        </>
        )}
      </Card>
    </div>
  );
}
