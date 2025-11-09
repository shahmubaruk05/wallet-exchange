
"use client";

import { useRef } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import {
  ArrowRight,
  CreditCard,
  Repeat,
  Wallet,
  Send,
  CheckCircle,
  ShieldCheck,
  Zap,
  Users,
  MessageSquare,
  DollarSign,
  Landmark,
} from "lucide-react";
import Link from "next/link";
import PaymentIcon from "@/components/PaymentIcons";
import Image from "next/image";

export default function Home() {
  const plugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  const wallets = [
    { id: "paypal", name: "PayPal" },
    { id: "payoneer", name: "Payoneer" },
    { id: "wise", name: "Wise" },
    { id: "bkash", name: "bKash" },
    { id: "nagad", name: "Nagad" },
  ];
  return (
    <>
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-b from-blue-50 via-white to-white dark:from-slate-900/50 dark:via-background">
        <Carousel 
          plugins={[plugin.current]}
          className="w-full"
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
          opts={{
            loop: true,
          }}
        >
          <CarouselContent>
            <CarouselItem>
                <div className="w-full py-20 md:py-28 lg:py-32">
                    <div className="container px-4 md:px-6">
                      <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
                        <div className="flex flex-col justify-center space-y-6">
                          <div className="space-y-4">
                            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-slate-900 dark:text-slate-50">
                              Best Price Dollar ⇄ Taka Exchange
                            </h1>
                            <p className="max-w-[600px] text-slate-600 md:text-xl dark:text-slate-400">
                              Seamlessly exchange funds between PayPal, Payoneer, Wise, bKash, Nagad, and more. Get the most competitive rates, fast.
                            </p>
                          </div>
                          <div className="flex flex-col gap-4 min-[400px]:flex-row">
                            <Button asChild size="lg" className="px-8 py-6 text-base">
                              <Link href="/dashboard/exchange">
                                Exchange Now
                                <ArrowRight className="ml-2 h-5 w-5" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                        <div className="hidden lg:flex items-center justify-center">
                          <Image 
                            src="https://placehold.co/600x400/e0f2fe/0c4a6e/png?text=PayPal+%E2%86%92+bKash%0A%24100+%3D+12,200+BDT&font=sans"
                            alt="Currency Exchange Banner"
                            width={600}
                            height={400}
                            className="rounded-xl shadow-2xl"
                            data-ai-hint="currency exchange"
                          />
                        </div>
                      </div>
                    </div>
                </div>
            </CarouselItem>
             <CarouselItem>
                <div className="w-full py-20 md:py-28 lg:py-32">
                    <div className="container px-4 md:px-6">
                      <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
                        <div className="flex flex-col justify-center space-y-6">
                          <div className="space-y-4">
                            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-slate-900 dark:text-slate-50">
                              International Virtual Card for Global Payments
                            </h1>
                            <p className="max-w-[600px] text-slate-600 md:text-xl dark:text-slate-400">
                              Get a secure virtual card for all your international payments. Top-up easily and spend without limits.
                            </p>
                          </div>
                          <div className="flex flex-col gap-4 min-[400px]:flex-row">
                            <Button asChild size="lg" className="px-8 py-6 text-base">
                              <Link href="/dashboard/cards">
                                Get Your Card
                                <CreditCard className="ml-2 h-5 w-5" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                         <div className="hidden lg:flex items-center justify-center">
                          <Image 
                            src="https://picsum.photos/seed/42/600/400"
                            alt="Virtual Card Banner"
                            width={600}
                            height={400}
                            className="rounded-xl shadow-2xl"
                            data-ai-hint="virtual card payment"
                          />
                        </div>
                      </div>
                    </div>
                </div>
            </CarouselItem>
          </CarouselContent>
           <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex" />
           <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex" />
        </Carousel>
      </section>

      {/* Supported Wallets Strip */}
      <section className="py-8 bg-slate-50 dark:bg-slate-800/50 border-y dark:border-slate-800">
        <div className="container px-4 md:px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              We support:
            </span>
            {wallets.map((wallet) => (
              <div
                key={wallet.id}
                className="flex items-center gap-2 text-slate-500 dark:text-slate-400"
              >
                <PaymentIcon id={wallet.id} className="w-5 h-5" />
                <span className="text-sm font-medium">{wallet.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="w-full py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-blue-100 dark:bg-blue-900/50 px-3 py-1 text-sm font-medium text-blue-800 dark:text-blue-300">
                Our Services
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-slate-900 dark:text-slate-50">
                Everything You Need for Digital Finance
              </h2>
              <p className="max-w-[700px] text-slate-600 md:text-lg dark:text-slate-400">
                Whether you need to quickly exchange money between wallets or
                require a virtual card for online purchases, we have you
                covered.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-stretch gap-8 sm:grid-cols-2 mt-12">
            <Card className="hover:shadow-xl hover:-translate-y-1 transition-all rounded-2xl">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <Repeat className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-2xl">
                    Currency &amp; Wallet Exchange
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600 dark:text-slate-400">
                  Effortlessly transfer funds between bKash, Nagad, PayPal,
                  Payoneer, and Wise. Our platform ensures swift and secure
                  transactions at competitive rates.
                </p>
                <Button asChild variant="outline">
                  <Link href="/dashboard/exchange">
                    Exchange Now <ArrowRight className="ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:shadow-xl hover:-translate-y-1 transition-all rounded-2xl">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-2xl">Virtual USD Cards</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600 dark:text-slate-400">
                  Get your own virtual card for secure online and international
                  payments. Top up easily using your local currency and start
                  spending globally.
                </p>
                <Button asChild variant="outline">
                  <Link href="/dashboard/cards">
                    Get Your Card <ArrowRight className="ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full py-16 md:py-24 bg-slate-50 dark:bg-slate-800/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-block rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1 text-sm font-medium text-slate-800 dark:text-slate-300">
              How It Works
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-slate-900 dark:text-slate-50">
              Exchange in 3 Simple Steps
            </h2>
          </div>
          <div className="mx-auto grid gap-8 md:grid-cols-3 md:gap-12 mt-12 max-w-6xl">
            {[
              {
                icon: Wallet,
                title: "Choose wallets &amp; amount",
                text: "Select how you want to pay and where you want to receive funds.",
              },
              {
                icon: Send,
                title: "Send your payment",
                text: "Transfer to our bKash, Nagad, PayPal, Payoneer, or Wise account.",
              },
              {
                icon: CheckCircle,
                title: "Receive within minutes",
                text: "We send the exchanged amount to your chosen wallet.",
              },
            ].map((step, i) => (
              <Card
                key={i}
                className="p-8 flex flex-col items-center text-center rounded-2xl shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="p-4 bg-blue-100 dark:bg-blue-900/50 rounded-full mb-4">
                  <step.icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-slate-50">
                  Step {i + 1}: {step.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">{step.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="w-full py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-block rounded-lg bg-blue-100 dark:bg-blue-900/50 px-3 py-1 text-sm font-medium text-blue-800 dark:text-blue-300">
              Why Wallet Exchange
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-slate-900 dark:text-slate-50">
              Built for Freelancers &amp; Online Businesses
            </h2>
          </div>
          <div className="mx-auto grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-12 max-w-6xl">
            {[
              {
                icon: Zap,
                title: "Fast settlements",
                text: "Most exchanges are processed within 30-60 minutes during working hours.",
              },
              {
                icon: ShieldCheck,
                title: "Secure &amp; verified",
                text: "Manual review and secure wallet details to keep your funds safe.",
              },
              {
                icon: Users,
                title: "Transparent rates",
                text: "No hidden fees. You see the rate and final amount before you pay.",
              },
              {
                icon: MessageSquare,
                title: "Friendly support",
                text: "Get help via email or chat when you need it.",
              },
            ].map((feature, i) => (
              <Card key={i} className="p-6 rounded-2xl shadow-sm">
                <feature.icon className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-4" />
                <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-slate-50">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {feature.text}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="w-full py-16 md:py-24 bg-slate-50 dark:bg-slate-800/50">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tighter text-center sm:text-4xl text-slate-900 dark:text-slate-50">
            Trusted by remote workers &amp; agencies
          </h2>
          <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-12">
            {[
              {
                quote:
                  "Wallet Exchange is a lifesaver! Getting paid from US clients to my bKash is now incredibly fast and simple.",
                name: "M. Hasan",
                role: "Upwork Designer",
              },
              {
                quote:
                  "The virtual card is perfect for all my SaaS subscriptions. Topping it up is super easy. Highly recommended!",
                name: "Sadia Rahman",
                role: "Agency Owner",
              },
              {
                quote:
                  "I was skeptical at first, but their rates are fair and the service is reliable. Their support team is also very helpful.",
                name: "John Doe",
                role: "Freelance Developer",
              },
            ].map((testimonial, i) => (
              <Card key={i} className="p-6 rounded-2xl shadow-sm">
                <CardContent className="p-0">
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    "{testimonial.quote}"
                  </p>
                  <div className="font-semibold text-slate-900 dark:text-slate-50">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {testimonial.role}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full py-16 md:py-24">
        <div className="container max-w-4xl px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tighter text-center mb-8 sm:text-4xl text-slate-900 dark:text-slate-50">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {[
              {
                q: "How long does an exchange take?",
                a: "Most exchanges are completed within 30-60 minutes during our business hours (10 AM - 10 PM). Orders outside these hours may take longer.",
              },
              {
                q: "What wallets do you support?",
                a: "We support PayPal, Payoneer, Wise, bKash, and Nagad for both sending and receiving funds. You can also use your Wallet Exchange balance.",
              },
              {
                q: "Is there a minimum or maximum amount?",
                a: "Yes, each exchange pair has its own minimum and maximum limits. These are clearly displayed on the exchange form when you enter an amount.",
              },
              {
                q: "How do I get a virtual card?",
                a: "Simply sign up, add at least $10 to your wallet balance, and fill out the application form on the 'My Card' page. The balance is not a fee and remains yours to use.",
              },
            ].map((faq, i) => (
              <AccordionItem key={i} value={`item-${i + 1}`}>
                <AccordionTrigger className="text-lg text-left">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-base text-slate-600 dark:text-slate-400">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </>
  );
}
