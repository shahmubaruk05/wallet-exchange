export type PaymentMethod = {
  id: string;
  name: string;
  currency: "BDT" | "USD";
  type: "mobile" | "e-wallet";
};

export const paymentMethods: PaymentMethod[] = [
  { id: "bkash", name: "Bkash", currency: "BDT", type: "mobile" },
  { id: "nagad", name: "Nagad", currency: "BDT", type: "mobile" },
  { id: "paypal", name: "PayPal", currency: "USD", type: "e-wallet" },
  { id: "payoneer", name: "Payoneer", currency: "USD", type: "e-wallet" },
  { id: "wise", name: "Wise", currency: "USD", type: "e-wallet" },
];

// Mock exchange rates, to be replaced by Firestore data
export let exchangeRates = {
  USD_TO_BDT: 115.5,
  BDT_TO_USD_RATE: 120.0,
};

export type TransactionStatus = "Processing" | "Paid" | "Completed";

// This type should align with the Transaction entity in backend.json
export type Transaction = {
  id: string;
  userId: string;
  paymentMethod: string;
  withdrawalMethod: string;
  amount: number;
  currency: string;
  exchangeRateId: string;
  receivedAmount: number;
  status: TransactionStatus;
  transactionDate: string; // Should be ISO string
};
