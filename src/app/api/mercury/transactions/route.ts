
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const token = process.env.MERCURY_API_TOKEN;

    if (!token) {
      return NextResponse.json({ ok: false, error: "Missing MERCURY_API_TOKEN" }, { status: 500 });
    }

    const res = await fetch("https://api.mercury.com/api/v1/transactions?limit=10", {
      method: "GET",
      headers: {
        Authorization: token, // IMPORTANT: no 'Bearer' prefix
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
      });
    }

    const data = JSON.parse(text || "{}");
    const raw = data.transactions || data.data || [];
    const transactions = raw.map((t: any) => ({
      id: t.id ?? "",
      date: t.created_at ?? t.posted_at,
      description: t.merchant_name ?? t.description ?? "Transaction",
      amount: t.amount ?? 0,
      currency: t.currency ?? "USD",
      status: t.status ?? "posted",
    }));

    return NextResponse.json({ ok: true, transactions });
  } catch (err: any) {
    console.error("Mercury route error:", err);
    return NextResponse.json({ ok: false, error: err.message || "UNKNOWN_ERROR" }, { status: 500 });
  }
}
