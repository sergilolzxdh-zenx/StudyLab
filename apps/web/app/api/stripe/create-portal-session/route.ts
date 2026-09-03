import { NextResponse } from "next/server";
import { requireAuth, UnauthorizedError } from "@/lib/server/auth";
import { getDb } from "@/lib/server/firebaseAdmin";
import { getStripe } from "@/lib/server/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let uid: string;
  try {
    uid = await requireAuth(req);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof UnauthorizedError ? err.message : "No autorizado." },
      { status: 401 }
    );
  }

  const snap = await getDb().doc(`users/${uid}`).get();
  const customerId = snap.exists ? (snap.data() as { stripeCustomerId?: string }).stripeCustomerId : undefined;

  if (!customerId) {
    return NextResponse.json({ error: "Todavía no tienes una suscripción de pago." }, { status: 400 });
  }

  const origin = new URL(req.url).origin;

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/plan`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("create-portal-session failed", err);
    return NextResponse.json(
      { error: "No se ha podido abrir el portal de facturación. Inténtalo de nuevo." },
      { status: 502 }
    );
  }
}
