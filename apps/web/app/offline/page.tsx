import Link from "next/link";
import { Card } from "@/components/ui/Card";

export const metadata = {
  title: "Sin conexión — StudyLab",
};

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 py-10 text-center">
      <Card className="w-full">
        <h1 className="font-display text-2xl text-text">Estás sin conexión</h1>
        <p className="mt-2 font-sans text-sm text-text-dim">
          StudyLab necesita conexión para cargar tus notas, tareas y las
          herramientas de IA. Esta página se ha mostrado desde la caché local
          — nada de lo que veas aquí es un dato real.
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-block font-sans text-sm text-text underline underline-offset-4"
        >
          Reintentar
        </Link>
      </Card>
    </div>
  );
}
