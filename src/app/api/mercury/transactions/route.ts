
import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, App } from "firebase-admin/app";

// Helper to initialize Firebase Admin SDK only once.
function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }
  return initializeApp();
}


export async function GET(req: Request) {
  try {
    const app = getFirebaseAdminApp();
    const db = getFirestore(app);
    
    // Get UID from query parameter instead of Auth header
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');

    if (!uid) {
        return NextResponse.json({ ok: false, error: "User ID is required." }, { status: 400 });
    }

    // Get user's approved card from Firestore
    const cardsQuery = db.collection("card_applications")
      .where("userId", "==", uid)
      .where("status", "==", "Approved")
      .limit(1);
      
    const cardsSnap = await cardsQuery.get();

    if (cardsSnap.empty) {
      return NextResponse.json({ ok: true, hasCard: false, transactions: [] });
    }

    const cardData = cardsSnap.docs[0].data();
    const mercuryCardLast4 = cardData.mercuryCardLast4;

    if (!mercuryCardLast4) {
         return NextResponse.json({ ok: true, hasCard: false, transactions: [], message: "Card last 4 digits not found." });
    }
    
    // --- Call Mercury API ---
    const token = process.env.MERCURY_API_TOKEN;
    if (!token) {
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
      });
    }

    const data = JSON.parse(text || "{}");
    const raw = data.transactions || [];

    // Filter transactions by card's last 4 digits
    const userTransactions = raw.filter((t: any) => {
        return t.cardLast4 === mercuryCardLast4 || t.card?.last4 === mercuryCardLast4;
    });

    const transactions = userTransactions.map((t: any) => ({
      id: t.id ?? "",
      date: t.postedAt ?? t.createdAt,
      merchant: t.merchant?.name ?? t.counterpartyName ?? "Transaction",
      amount: t.amount ?? 0,
      currency: t.currency ?? "USD",
      status: t.status ?? "posted",
    }));

    return NextResponse.json({ ok: true, hasCard: true, transactions });
    
  } catch (err: any) {
    console.error("Mercury route error:", err);
    // Avoid leaking detailed error messages to the client
    return NextResponse.json({ ok: false, error: "An internal server error occurred." }, { status: 500 });
  }
}
