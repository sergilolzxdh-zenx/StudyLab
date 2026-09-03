import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/server/firebaseAdmin";
import { getStripe, PLAN_POWERMONEY, type PaidPlan } from "@/lib/server/stripe";

export const runtime = "nodejs";

function planFromPriceId(priceId: string | undefined): PaidPlan | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_ID_PRO) return "pro";
  if (priceId === process.env.STRIPE_PRICE_ID_PREMIUM) return "premium";
  return null;
}

async function setUserPlan(uid: string, plan: "free" | PaidPlan, extra?: Record<string, unknown>) {
  await getDb()
    .doc(`users/${uid}`)
    .update({
      plan,
      powermoney: PLAN_POWERMONEY[plan],
      powermoneyResetAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      ...extra,
    });
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const uid = session.client_reference_id || (session.metadata?.uid as string | undefined);
      const plan = (session.metadata?.plan as PaidPlan | undefined) ?? "pro";
      if (!uid) break;
      await setUserPlan(uid, plan, {
        stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id,
        stripeSubscriptionId:
          typeof session.subscription === "string" ? session.subscription : session.subscription?.id,
      });
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const uid = subscription.metadata?.uid;
      if (!uid) break;
      if (subscription.status === "active" || subscription.status === "trialing") {
        const plan = planFromPriceId(subscription.items.data[0]?.price?.id);
        if (plan) await setUserPlan(uid, plan);
      } else if (subscription.status === "canceled" || subscription.status === "unpaid") {
        await setUserPlan(uid, "free");
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const uid = subscription.metadata?.uid;
      if (uid) await setUserPlan(uid, "free");
      break;
    }

    default:
      break;
  }
}

/**
 * No Firebase auth here — Stripe calls this directly with its own signed
 * request. Security comes entirely from verifying the Stripe-Signature
 * header against STRIPE_WEBHOOK_SECRET below.
 */
export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    console.error("Stripe webhook received but STRIPE_WEBHOOK_SECRET is not configured.");
    return NextResponse.json({ error: "Webhook no configurado." }, { status: 500 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Firma no válida." }, { status: 400 });
  }

  // Idempotent: Stripe retries on any non-2xx, so only mark an event
  // processed once handling actually succeeds.
  const eventRef = getDb().doc(`stripeEvents/${event.id}`);
  if ((await eventRef.get()).exists) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    await handleEvent(event);
    await eventRef.set({ type: event.type, processedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`Stripe webhook handling failed for event ${event.id} (${event.type})`, err);
    return NextResponse.json({ error: "Error procesando el evento." }, { status: 500 });
  }
}
