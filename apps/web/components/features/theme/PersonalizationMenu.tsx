"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme, type AccentColor, type BackgroundMode, type ThemeMode } from "@/lib/theme/ThemeProvider";
import { cn } from "@/lib/utils/cn";

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "system", label: "Sistema" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
];

const BACKGROUND_OPTIONS: { value: BackgroundMode; label: string; hint: string }[] = [
  { value: "starfield", label: "Estrellas", hint: "El fondo animado (solo en oscuro)" },
  { value: "basic", label: "Básico", hint: "Color liso, sin animación" },
];

const ACCENT_OPTIONS: { value: AccentColor; label: string; swatch: string }[] = [
  { value: "mono", label: "Mono", swatch: "var(--text)" },
  { value: "indigo", label: "Índigo", swatch: "#4f46e5" },
  { value: "emerald", label: "Esmeralda", swatch: "#059669" },
  { value: "amber", label: "Ámbar", swatch: "#d97706" },
  { value: "rose", label: "Rosa", swatch: "#e11d48" },
];

function PaletteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.5-1.9-.2-.6.2-1.2.8-1.2H16a4 4 0 0 0 4-4c0-5-3.6-9-8-9Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="7.5" cy="11" r="1.2" fill="currentColor" />
      <circle cx="10.5" cy="7.5" r="1.2" fill="currentColor" />
      <circle cx="15" cy="8" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function PersonalizationMenu() {
  const { theme, setTheme, background, setBackground, accent, setAccent } = useTheme();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Personalizar apariencia"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] text-text-dim transition-[background-color,color,transform] duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:bg-surface-2 hover:text-text active:scale-[0.94]"
      >
        <PaletteIcon />
      </button>

      <div
        ref={popoverRef}
        role="dialog"
        aria-label="Personalización"
        aria-hidden={!open}
        inert={!open}
        className={cn(
          "absolute right-0 top-[calc(100%+8px)] z-30 w-[17rem] max-w-[calc(100vw-2rem)] origin-top-right",
          "rounded-[var(--radius-md)] border border-border bg-surface p-4 shadow-[var(--shadow-md)]",
          "transition-[opacity,transform] duration-[var(--duration-base)] ease-[var(--ease-out)]",
          open ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-1 scale-95 opacity-0"
        )}
      >
        <p className="font-display text-base text-text">Personalización</p>

        <fieldset className="mt-4">
          <legend className="font-sans text-xs font-medium uppercase tracking-wide text-text-dim">Tema</legend>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={theme === opt.value}
                onClick={() => setTheme(opt.value)}
                className={cn(
                  "h-8 rounded-[var(--radius-sm)] font-sans text-xs transition-[background-color,color,transform] duration-[var(--duration-fast)] ease-[var(--ease-out)] active:scale-[0.95]",
                  theme === opt.value
                    ? "bg-accent text-accent-contrast"
                    : "bg-surface-2 text-text-dim hover:text-text"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-4">
          <legend className="font-sans text-xs font-medium uppercase tracking-wide text-text-dim">Fondo</legend>
          <div className="mt-2 flex flex-col gap-1.5">
            {BACKGROUND_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={background === opt.value}
                onClick={() => setBackground(opt.value)}
                className={cn(
                  "flex items-center justify-between rounded-[var(--radius-sm)] px-3 py-2 text-left transition-[background-color,transform] duration-[var(--duration-fast)] ease-[var(--ease-out)] active:scale-[0.98]",
                  background === opt.value ? "bg-surface-2" : "hover:bg-surface-2"
                )}
              >
                <span>
                  <span className="block font-sans text-sm text-text">{opt.label}</span>
                  <span className="block font-sans text-xs text-text-dim">{opt.hint}</span>
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-4 w-4 shrink-0 rounded-full border border-border transition-[background-color,border-color] duration-[var(--duration-fast)]",
                    background === opt.value && "border-accent bg-accent"
                  )}
                />
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-4">
          <legend className="font-sans text-xs font-medium uppercase tracking-wide text-text-dim">Acento</legend>
          <div className="mt-2 flex gap-2">
            {ACCENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-label={opt.label}
                aria-pressed={accent === opt.value}
                onClick={() => setAccent(opt.value)}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-full transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out)] active:scale-[0.9]",
                  accent === opt.value ? "ring-2 ring-text ring-offset-2 ring-offset-surface" : "hover:scale-[1.08]"
                )}
              >
                <span
                  aria-hidden="true"
                  className="h-5 w-5 rounded-full border border-border"
                  style={{ background: opt.swatch }}
                />
              </button>
            ))}
          </div>
        </fieldset>
      </div>
    </div>
  );
}
