"use client";

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
import { useAuth, useUser, initiateEmailSignIn, initiateGoogleSignIn } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import AuthRedirect from "@/components/auth/AuthRedirect";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.317-11.297-7.92l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C44.577,34.238,48,28.638,48,24C48,22.659,47.862,21.35,47.611,20.083z"/>
    </svg>
);


export default function LoginPage() {
  const auth = useAuth();
  const { toast } = useToast();
  const { user } = useUser();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    initiateEmailSignIn(auth, values.email, values.password);
    toast({
        title: "Signing in...",
        description: "You will be redirected shortly.",
      });
  };

  const onGoogleSignIn = () => {
    initiateGoogleSignIn(auth);
     toast({
        title: "Signing in with Google...",
        description: "Please follow the instructions in the pop-up window.",
      });
  }

  return (
    <AuthRedirect to="/dashboard" condition={(user) => !!user}>
      <div className="container mx-auto flex min-h-[80vh] items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Access your Wallet Exchange account.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Button variant="outline" className="w-full" onClick={onGoogleSignIn}>
                <GoogleIcon className="mr-2 h-5 w-5"/>
                Sign in with Google
            </Button>

             <div className="relative my-4">
                <Separator />
                <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-card px-2 text-sm text-muted-foreground">OR</span>
            </div>

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
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="flex items-center justify-end">
                    <Link
                        href="/forgot-password"
                        className="text-sm font-medium text-primary hover:underline"
                    >
                        Forgot password?
                    </Link>
                </div>
                <Button type="submit" className="w-full">
                  Sign In
                </Button>
              </form>
            </Form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/signup" className="font-semibold text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </AuthRedirect>
  );
}
