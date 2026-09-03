"use client";

import { useState } from "react";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import { useUserProfile } from "@/lib/firebase/userProfile";
import { createCheckoutSession, createPortalSession } from "@/lib/firebase/billing";
import { FunctionsCallError } from "@/lib/firebase/functions";
import { PLAN_LABEL, PLAN_POWERMONEY, type Plan, type PaidPlan } from "@/lib/plans";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";

const PLAN_ORDER: Plan[] = ["free", "pro", "premium"];

const PLAN_FEATURES: Record<Plan, string[]> = {
  free: ["20 usos de IA al mes", "Cuaderno, calendario y flashcards ilimitados", "Historial de actividad"],
  pro: ["150 usos de IA al mes", "Todo lo de Free", "Prioridad en soporte"],
  premium: ["Uso ilimitado de IA", "Todo lo de Pro", "Acceso anticipado a nuevas herramientas"],
};

export default function PlanPage() {
  const { user } = useAuthUser();
  const { profile, loading, error } = useUserProfile(user?.uid);
  const [redirecting, setRedirecting] = useState<PaidPlan | "portal" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleUpgrade(plan: PaidPlan) {
    setRedirecting(plan);
    setActionError(null);
    try {
      const url = await createCheckoutSession(plan);
      window.location.assign(url);
    } catch (err) {
      setActionError(err instanceof FunctionsCallError ? err.message : "Ha ocurrido un problema. Inténtalo de nuevo.");
      setRedirecting(null);
    }
  }

  async function handleManage() {
    setRedirecting("portal");
    setActionError(null);
    try {
      const url = await createPortalSession();
      window.location.assign(url);
    } catch (err) {
      setActionError(err instanceof FunctionsCallError ? err.message : "Ha ocurrido un problema. Inténtalo de nuevo.");
      setRedirecting(null);
    }
  }

  const currentPlan: Plan = profile?.plan ?? "free";
  const limit = PLAN_POWERMONEY[currentPlan];
  const isUnlimited = !Number.isFinite(limit);
  const used = isUnlimited ? 0 : Math.max(0, limit - (profile?.powermoney ?? 0));
  const percent = isUnlimited ? 100 : Math.min(100, Math.round((used / limit) * 100));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10">
      <div>
        <h1 className="font-display text-3xl text-text">Tu plan</h1>
        <p className="mt-1 font-sans text-text-dim">Consulta tu uso y gestiona tu suscripción.</p>
      </div>

      <Card>
        {loading ? (
          <div className="flex items-center gap-2 text-text-dim">
            <Spinner />
            <span className="font-sans text-sm">Cargando…</span>
          </div>
        ) : error ? (
          <p className="font-sans text-sm text-danger">No se ha podido cargar tu plan.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-2xl text-text">{PLAN_LABEL[currentPlan]}</p>
                <p className="mt-1 font-sans text-sm text-text-dim">
                  {isUnlimited
                    ? "Uso ilimitado."
                    : `${profile?.powermoney ?? 0} de ${limit} usos disponibles.`}
                </p>
              </div>
              {profile?.stripeCustomerId && (
                <Button variant="secondary" size="sm" loading={redirecting === "portal"} onClick={handleManage}>
                  Gestionar suscripción
                </Button>
              )}
            </div>
            {!isUnlimited && (
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full bg-accent" style={{ width: `${percent}%` }} />
              </div>
            )}
          </>
        )}
      </Card>

      {actionError && <p className="font-sans text-sm text-danger">{actionError}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PLAN_ORDER.map((plan) => (
          <Card key={plan} className={cn(currentPlan === plan && "border-text")}>
            <p className="font-display text-xl text-text">{PLAN_LABEL[plan]}</p>
            <p className="mt-1 font-sans text-sm text-text-dim">
              {plan === "premium" ? "Uso ilimitado" : `${PLAN_POWERMONEY[plan]} usos al mes`}
            </p>
            <ul className="mt-4 flex flex-col gap-2">
              {PLAN_FEATURES[plan].map((feature) => (
                <li key={feature} className="font-sans text-sm text-text-dim">
                  · {feature}
                </li>
              ))}
            </ul>
            <div className="mt-5">
              {currentPlan === plan ? (
                <span className="font-sans text-sm text-text-dim">Tu plan actual</span>
              ) : plan === "free" ? null : (
                <Button
                  className="w-full"
                  loading={redirecting === plan}
                  disabled={redirecting !== null}
                  onClick={() => handleUpgrade(plan)}
                >
                  Actualizar a {PLAN_LABEL[plan]}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
