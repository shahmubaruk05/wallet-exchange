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

export let exchangeRates = {
  USD_TO_BDT: 115.5,
  BDT_TO_USD_RATE: 120.0,
};

export type TransactionStatus = "Processing" | "Paid" | "Completed";

export type Transaction = {
  id: string;
  user: string;
  sendMethod: string;
  sendAmount: number;
  sendCurrency: string;
  receiveMethod: string;
  receiveAmount: number;
  receiveCurrency: string;
  date: string;
  status: TransactionStatus;
};

// This is a mock database. In a real app, you'd use a proper database.
export let transactions: Transaction[] = [
  {
    id: "TXN1001",
    user: "user_alpha",
    sendMethod: "PayPal",
    sendAmount: 100,
    sendCurrency: "USD",
    receiveMethod: "Bkash",
    receiveAmount: 11550,
    receiveCurrency: "BDT",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: "Completed",
  },
  {
    id: "TXN1002",
    user: "user_beta",
    sendMethod: "Bkash",
    sendAmount: 5000,
    sendCurrency: "BDT",
    receiveMethod: "Wise",
    receiveAmount: 41.67,
    receiveCurrency: "USD",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "Completed",
  },
  {
    id: "TXN1003",
    user: "user_gamma",
    sendMethod: "Payoneer",
    sendAmount: 250,
    sendCurrency: "USD",
    receiveMethod: "Nagad",
    receiveAmount: 28875,
    receiveCurrency: "BDT",
    date: new Date().toISOString(),
    status: "Processing",
  },
    {
    id: "TXN1004",
    user: "user_delta",
    sendMethod: "Wise",
    sendAmount: 50,
    sendCurrency: "USD",
    receiveMethod: "Bkash",
    receiveAmount: 5775,
    receiveCurrency: "BDT",
    date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    status: "Paid",
  },
];
