
import { NextResponse } from "next/server";


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cardLast4 = searchParams.get('cardLast4');

    if (!cardLast4) {
      return NextResponse.json({ ok: false, error: "Card last 4 digits are required." }, { status: 400 });
    }
    
    const token = process.env.MERCURY_API_TOKEN;

    if (!token) {
      console.error("MERCURY_API_TOKEN is not set in the environment.");
      return NextResponse.json({ ok: false, error: "Missing MERCURY_API_TOKEN" }, { status: 500 });
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
    const raw = data.transactions || [];

    const userTransactions = raw.filter((t: any) => {
      return t.cardLast4 === cardLast4 || t.card?.last4 === cardLast4;
    });

    const transactions = userTransactions.map((t: any) => ({
      id: t.id ?? "",
      date: t.postedAt ?? t.createdAt,
      merchant: t.merchant?.name ?? t.counterpartyName ?? "Transaction",
      amount: t.amount ?? 0,
      currency: t.currency ?? "USD",
      status: t.status ?? "posted",
    }));

    return NextResponse.json({ ok: true, transactions });

  } catch (err: any) {
    console.error("Mercury route error:", err);
    return NextResponse.json({ ok: false, error: "An internal server error occurred." }, { status: 500 });
  }
}
