import AddFundsForm from "@/components/AddFundsForm";

export default function AddFundsPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl">
          Add Funds to Wallet
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Deposit funds from your favorite payment methods directly to your wallet balance.
        </p>
      </div>
      <AddFundsForm />
    </div>
  );
}
