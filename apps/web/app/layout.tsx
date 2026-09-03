import type { Metadata } from "next";
import { Fraunces, Figtree } from "next/font/google";
import { Toaster } from "sonner";
import { StarfieldBackground } from "@/components/features/landing/StarfieldBackground";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StudyLab",
  description:
    "StudyLab — tu espacio de estudio: cuaderno, calendario, resumidor, corrector, flashcards y asistente de IA en un solo lugar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${figtree.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-bg text-text">
        <StarfieldBackground />
        {children}
        <Toaster
          theme="system"
          richColors
          toastOptions={{
            style: {
              background: "var(--surface)",
              color: "var(--text)",
              border: "1px solid var(--border)",
            },
          }}
        />
      </body>
    </html>
  );
}
