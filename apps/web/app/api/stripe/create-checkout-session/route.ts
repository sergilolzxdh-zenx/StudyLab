import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, UnauthorizedError } from "@/lib/server/auth";
import { getDb } from "@/lib/server/firebaseAdmin";
import { getStripe, priceIdForPlan } from "@/lib/server/stripe";

export const runtime = "nodejs";

const RequestSchema = z.object({
  plan: z.enum(["pro", "premium"]),
});

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

  const parsed = RequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Petición no válida." }, { status: 400 });
  }
  const { plan } = parsed.data;

  const snap = await getDb().doc(`users/${uid}`).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "No se encontró tu perfil." }, { status: 404 });
  }
  const profile = snap.data() as { email?: string; stripeCustomerId?: string };

  const origin = new URL(req.url).origin;

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceIdForPlan(plan), quantity: 1 }],
      client_reference_id: uid,
      metadata: { uid, plan },
      subscription_data: { metadata: { uid, plan } },
      success_url: `${origin}/plan?checkout=success`,
      cancel_url: `${origin}/plan?checkout=cancelado`,
      ...(profile.stripeCustomerId
        ? { customer: profile.stripeCustomerId }
        : { customer_email: profile.email }),
    });

    if (!session.url) {
      throw new Error("Stripe no devolvió una URL de checkout.");
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("create-checkout-session failed", err);
    return NextResponse.json(
      { error: "No se ha podido iniciar el pago. Inténtalo de nuevo." },
      { status: 502 }
    );
  }
}
