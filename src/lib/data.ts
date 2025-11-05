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
  USD_TO_BDT: 122,
  BDT_TO_USD_RATE: 127.0,
};

export type TransactionStatus = "Processing" | "Paid" | "Completed" | "Pending" | "Cancelled";

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
  sendingAccountId: string;
  transactionId: string;
  receivingAccountId: string;
  updatedAt?: string; // ISO String for when status was last updated
  adminNote?: string;
  adminProof?: string;
};

export type ExchangeRate = {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  lastUpdated: string;
};

export type CardApplicationStatus = "Pending" | "Approved" | "Rejected";

export type CardApplication = {
  id: string; // Document ID will be user's UID
  userId: string;
  name: string;
  email: string;
  phone: string;
  billingAddress: string;
  status: CardApplicationStatus;
  appliedAt: string; // ISO string
  cardNumber?: string;
  expiryDate?: string; // MM/YY
  cvc?: string;
};

// New type for Mercury Card Transactions
export type CardTransaction = {
  id: string;
  date: string; // ISO string
  description: string;
  amount: number;
  currency: 'USD';
  type: 'debit' | 'credit';
};

// Mock data for card transactions
export const mockCardTransactions: CardTransaction[] = [
    { id: 'ctx-1', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), description: 'Amazon Web Services', amount: 12.50, currency: 'USD', type: 'debit' },
    { id: 'ctx-2', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), description: 'Stripe Payment', amount: 250.00, currency: 'USD', type: 'credit' },
    { id: 'ctx-3', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), description: 'Figma Subscription', amount: 15.00, currency: 'USD', type: 'debit' },
    { id: 'ctx-4', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), description: 'Vercel Hobby', amount: 20.00, currency: 'USD', type: 'debit' },
    { id: 'ctx-5', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), description: 'Client Payment', amount: 1200.00, currency: 'USD', type: 'credit' },
];
