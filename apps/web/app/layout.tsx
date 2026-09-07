import type { Metadata, Viewport } from "next";
import { Fraunces, Figtree } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import { StarfieldBackgroundLoader } from "@/components/features/landing/StarfieldBackgroundLoader";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { ThemeProvider, THEME_STORAGE_KEY } from "@/lib/theme/ThemeProvider";
import "./globals.css";

// Runs before React hydrates so the manually-chosen theme/accent apply
// immediately — without this, the page would flash the system-default
// theme for a frame before switching to the user's saved choice.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = JSON.parse(localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}) || "{}");
    var theme = stored.theme || "system";
    var resolved = theme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme;
    document.documentElement.setAttribute("data-theme", resolved);
    if (stored.accent && stored.accent !== "mono") {
      document.documentElement.setAttribute("data-accent", stored.accent);
    }
  } catch (e) {}
})();
`;

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
  appleWebApp: {
    title: "StudyLab",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${figtree.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-bg text-text">
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <ThemeProvider>
          <StarfieldBackgroundLoader />
          <ServiceWorkerRegister />
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
        </ThemeProvider>
      </body>
    </html>
  );
}
