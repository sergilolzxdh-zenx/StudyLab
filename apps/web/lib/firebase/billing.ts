import { callApi } from "@/lib/firebase/functions";

export type PaidPlan = "pro" | "premium";

export async function createCheckoutSession(plan: PaidPlan): Promise<string> {
  const data = await callApi<{ url: string }>("/api/stripe/create-checkout-session", { plan });
  return data.url;
}

export async function createPortalSession(): Promise<string> {
  const data = await callApi<{ url: string }>("/api/stripe/create-portal-session", {});
  return data.url;
}
