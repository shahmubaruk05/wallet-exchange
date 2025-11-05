
import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, App } from "firebase-admin/app";

// Helper to initialize Firebase Admin SDK only once.
function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0] as App;
  }
  // This will use the GOOGLE_APPLICATION_CREDENTIALS environment variable
  // for authentication, which is appropriate for a server environment.
  return initializeApp();
}


export async function GET(req: Request) {
  try {
    const app = getFirebaseAdminApp();
    const db = getFirestore(app);

    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');

    if (!uid) {
       return NextResponse.json({ ok: false, error: "USER_ID_MISSING" }, { status: 400 });
    }

    const cardsSnap = await db.collection("card_applications")
      .where("userId", "==", uid)
      .where("status", "==", "Approved")
      .limit(1)
      .get();

    if (cardsSnap.empty) {
      return NextResponse.json({ ok: true, hasCard: false, transactions: [] });
    }

    const cardData = cardsSnap.docs[0].data();
    const mercuryCardLast4 = cardData.mercuryCardLast4;
    const mercuryApiToken = process.env.MERCURY_API_TOKEN;

    if (!mercuryApiToken) {
        console.error("MERCURY_API_TOKEN is not set.");
        return NextResponse.json({ ok: false, error: 'SERVER_CONFIG_ERROR' }, { status: 500 });
    }

    if (!mercuryCardLast4) {
      return NextResponse.json({ ok: true, hasCard: true, card: cardData, transactions: [] });
    }

    const mercuryResponse = await fetch("https://api.mercury.com/api/v1/transactions?limit=20", {
      method: "GET",
      headers: {
        // As per instructions, do not add "Bearer "
        "Authorization": mercuryApiToken,
        "Content-Type": "application/json",
      },
    });

    if (!mercuryResponse.ok) {
      const errorBody = await mercuryResponse.text();
      console.error(`Mercury API Error: ${mercuryResponse.status}`, errorBody);
      throw new Error(`MERCURY_API_ERROR`);
    }

    const mercuryData = await mercuryResponse.json();
    
    const txs = (mercuryData.transactions || []).filter(
      (t: any) => t.card?.last4 === mercuryCardLast4
    );

    const formatted = txs.map((t: any) => ({
      id: t.id,
      date: t.postedAt || t.createdAt,
      amount: t.amount,
      currency: t.currency,
      merchant: t.merchant?.name || t.counterparty?.name || 'Unknown Merchant',
      status: t.status,
    }));

    return NextResponse.json({
      ok: true,
      hasCard: true,
      card: {
        mercuryCardLast4: cardData.mercuryCardLast4,
        brand: cardData.brand,
        status: cardData.status,
      },
      transactions: formatted,
    });
  } catch (e: any) {
    console.error("Error in /api/mercury/transactions:", e);
    return NextResponse.json({ ok: false, error: e.message || 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}

// Required for Next.js to treat this as a dynamic route
export const dynamic = 'force-dynamic';
