import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CreditCard, Repeat } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-background">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-primary-foreground">
                  Your All-in-One Digital Wallet Solution
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Seamlessly exchange funds between popular digital wallets and get a secure virtual card for your international payments. Fast, secure, and reliable.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild size="lg">
                  <Link href="/dashboard/exchange">
                    Start Exchanging
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/dashboard/cards">
                    Get a Virtual Card
                  </Link>
                </Button>
              </div>
            </div>
            <div className="hidden lg:block">
               <div className="relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-xl blur-lg opacity-75"></div>
                  <Card className="relative">
                    <CardHeader>
                        <CardTitle>Example Exchange</CardTitle>
                        <CardDescription>From PayPal to Bkash</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-center text-lg">
                            <span className="font-bold text-blue-600">PayPal</span>
                            <ArrowRight className="text-muted-foreground"/>
                            <span className="font-bold text-pink-600">Bkash</span>
                        </div>
                        <div className="mt-4 text-center">
                            <p className="text-2xl font-mono">$100.00 <span className="text-muted-foreground">&rarr;</span> 12,200.00 BDT</p>
                        </div>
                    </CardContent>
                  </Card>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Our Services</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Everything You Need for Digital Finance</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Whether you need to quickly exchange money between wallets or require a virtual card for online purchases, we have you covered.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-2 mt-12">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Repeat className="w-6 h-6 text-primary"/>
                    </div>
                    <CardTitle className="text-2xl">Currency Exchange</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription>
                  Effortlessly transfer funds between Bkash, Nagad, PayPal, Payoneer, and Wise. Our platform ensures swift and secure transactions at competitive rates.
                </CardDescription>
                 <Button asChild variant="outline">
                   <Link href="/dashboard/exchange">
                    Exchange Now <ArrowRight className="ml-2"/>
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
               <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-accent-foreground"/>
                    </div>
                    <CardTitle className="text-2xl">Virtual Cards</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription>
                    Get your own virtual card for secure online and international payments. Top up easily using your local currency and start spending globally in minutes.
                </CardDescription>
                 <Button asChild variant="outline">
                  <Link href="/dashboard/cards">
                    Get Your Card <ArrowRight className="ml-2"/>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}