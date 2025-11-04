import ExchangeForm from "@/components/ExchangeForm";

export default function DashboardExchangePage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl">
          Create Exchange
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Transfer funds between your favorite wallets in a few simple steps.
        </p>
      </div>
      <ExchangeForm />
    </div>
  );
}
