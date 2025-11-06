import TransferForm from "@/components/TransferForm";

export default function TransferPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl">
          Transfer Funds
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Send money from your wallet to another user instantly.
        </p>
      </div>
      <TransferForm />
    </div>
  );
}
