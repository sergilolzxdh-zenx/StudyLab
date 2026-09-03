import { cn } from "@/lib/utils/cn";

export function FirebaseNotConfiguredNotice({ className }: { className?: string }) {
  return (
    <p
      role="status"
      className={cn(
        "rounded-[var(--radius-md)] border border-warning/40 bg-warning/10 px-3.5 py-3 font-sans text-sm text-text",
        className
      )}
    >
      Firebase todavía no está configurado en este entorno, así que este
      formulario no puede enviarse — la integración está lista y solo
      necesita las credenciales reales (ver <code>.env.example</code>).
    </p>
  );
}
