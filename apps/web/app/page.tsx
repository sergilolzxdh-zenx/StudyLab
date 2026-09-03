import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";

export default function Home() {
  return (
    <main className="relative">
      {/* 300vh scroll host — the starfield (mounted globally in the root
          layout) reads camera scroll position to
          surge drift/spin and dive forward through the tunnel. */}
      <div className="relative h-[300vh]">
        <div className="sticky top-0 flex h-screen flex-col items-center justify-center px-6 text-center">
          <span className="font-sans text-xs uppercase tracking-[0.2em] text-text-dim">
            Espacio de estudio
          </span>
          <h1 className="mt-4 font-display text-5xl font-medium tracking-tight text-text sm:text-7xl">
            StudyLab
          </h1>
          <p className="mt-5 max-w-md text-balance font-sans text-base text-text-dim sm:text-lg">
            Cuaderno, calendario, resumidor, corrector, flashcards y un
            asistente de IA — en un único lugar.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/registro" className={buttonVariants("primary", "lg")}>
              Crear cuenta
            </Link>
            <Link href="/login" className={buttonVariants("secondary", "lg")}>
              Iniciar sesión
            </Link>
          </div>

          <span className="absolute bottom-10 font-sans text-xs uppercase tracking-[0.2em] text-text-dim">
            scroll ↓
          </span>
        </div>
      </div>
    </main>
  );
}
