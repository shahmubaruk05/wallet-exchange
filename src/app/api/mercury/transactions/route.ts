
import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, App } from "firebase-admin/app";

// Helper to initialize Firebase Admin SDK only once.
function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0] as App;
  }
  return initializeApp();
}


export async function GET(req: Request) {
  try {
    const app = getFirebaseAdminApp();
    const db = getFirestore(app);
    const auth = getAuth(app);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED", hasCard: false }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = await auth.verifyIdToken(token);
    const uid = decoded.uid;

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
        "Authorization": `Bearer ${mercuryApiToken}`,
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
    if (e.code === 'auth/id-token-expired') {
        return NextResponse.json({ ok: false, error: 'TOKEN_EXPIRED' }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: e.message || 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}

// Required for Next.js to treat this as a dynamic route
export const dynamic = 'force-dynamic';
