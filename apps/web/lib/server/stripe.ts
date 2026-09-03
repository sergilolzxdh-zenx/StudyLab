import Stripe from "stripe";
import type { PaidPlan } from "@/lib/plans";

export { PLAN_POWERMONEY } from "@/lib/plans";
export type { PaidPlan } from "@/lib/plans";

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY no está configurada en el servidor.");
  }
  if (!cached) {
    cached = new Stripe(secretKey);
  }
  return cached;
}

export function priceIdForPlan(plan: PaidPlan): string {
  const id = plan === "pro" ? process.env.STRIPE_PRICE_ID_PRO : process.env.STRIPE_PRICE_ID_PREMIUM;
  if (!id) {
    throw new Error(`Falta STRIPE_PRICE_ID_${plan.toUpperCase()} en el entorno.`);
  }
  return id;
}
