export type Plan = "free" | "pro" | "premium";
export type PaidPlan = "pro" | "premium";

/** powermoney granted per plan — single source of truth for client display and the server webhook. */
export const PLAN_POWERMONEY: Record<Plan, number> = {
  free: 20,
  pro: 150,
  premium: Number.POSITIVE_INFINITY,
};

export const PLAN_LABEL: Record<Plan, string> = {
  free: "Free",
  pro: "Pro",
  premium: "Premium",
};
