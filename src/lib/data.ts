
export type PaymentMethod = {
  id: string;
  name: string;
  currency: "BDT" | "USD" | "VIRTUAL";
  type: "mobile" | "e-wallet" | "virtual-card" | "wallet";
};

export const paymentMethods: PaymentMethod[] = [
  { id: "bkash", name: "Bkash", currency: "BDT", type: "mobile" },
  { id: "nagad", name: "Nagad", currency: "BDT", type: "mobile" },
  { id: "paypal", name: "PayPal", currency: "USD", type: "e-wallet" },
  { id: "payoneer", name: "Payoneer", currency: "USD", type: "e-wallet" },
  { id: "wise", name: "Wise", currency: "USD", type: "e-wallet" },
  { id: "wallet", name: "Wallet Balance", currency: "USD", type: "wallet" },
  { id: "virtual_card_top_up", name: "Virtual Card Top Up", currency: "USD", type: "virtual-card"},
];

// Mock exchange rates, to be replaced by Firestore data
export let exchangeRates = {
  USD_TO_BDT: 122,
  BDT_TO_USD_RATE: 127.0,
};

export type TransactionStatus = "Processing" | "Paid" | "Completed" | "Pending" | "Cancelled";
export type TransactionType = "EXCHANGE" | "CARD_TOP_UP" | "ADD_FUNDS";


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
  transactionFee: number;
  updatedAt?: string; // ISO String for when status was last updated
  adminNote?: string;
  transactionType: TransactionType;
  topUpDetails?: {
    sentAmount: number;
    sentCurrency: string;
    topUpAmountUSD: number;
  };
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
  brand?: string;
  mercuryCardLast4?: string;
  adminInstruction?: string; // Instruction from admin to the user
};

export type CardTopUpStatus = "Pending" | "Completed" | "Cancelled";

export type CardTopUp = {
  id: string;
  userId: string;
  paymentMethod: string;
  sentAmount: number;
  sentCurrency: string;
  topUpAmountUSD: number;
  status: CardTopUpStatus;
  createdAt: string; // ISO string
  sendingAccountId: string;
  transactionId: string;
  transactionFee: number;
  adminNote?: string;
};

export type ExchangeLimit = {
    id: string;
    fromMethod: string;
    toMethod: string;
    minAmount: number;
    maxAmount: number;
}

export type User = {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role?: 'admin' | 'user';
  walletBalance?: number;
}
    