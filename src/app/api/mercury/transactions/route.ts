
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cardLast4 = searchParams.get("cardLast4");

    if (!cardLast4) {
      return NextResponse.json({ ok: false, error: "Missing cardLast4 query parameter" }, { status: 400 });
    }

    const token = process.env.MERCURY_API_TOKEN;

    if (!token) {
      return NextResponse.json({ ok: false, error: "Missing MERCURY_API_TOKEN env var" }, { status: 500 });
    }

    const res = await fetch("https://api.mercury.com/api/v1/transactions?limit=100", {
      method: "GET",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const text = await res.text();

    if (!res.ok) {
      console.error("Mercury API error:", res.status, text);
      return NextResponse.json({
        ok: false,
        error: `Mercury API responded with ${res.status}`,
        body: text,
      }, { status: res.status });
    }

    const data = JSON.parse(text || "{}");
    const rawList = data.transactions || [];

    const filteredTransactions = rawList.filter((t: any) => {
        return t.cardLast4 === cardLast4 || t.card?.last4 === cardLast4;
    });

    const transactions = filteredTransactions.map((t: any) => ({
      id: t.id ?? "",
      date: t.postedAt ?? t.createdAt,
      merchant: t.merchant?.name ?? t.counterpartyName ?? "Transaction",
      amount: t.amount ?? 0,
      currency: t.currency ?? "USD",
      status: t.status ?? "posted",
    }));

    return NextResponse.json({ ok: true, transactions, from: "mercury" });
  } catch (err: any) {
    console.error("Mercury route error:", err);
    return NextResponse.json({ ok: false, error: err.message || "UNKNOWN_ERROR" }, { status: 500 });
  }
}
