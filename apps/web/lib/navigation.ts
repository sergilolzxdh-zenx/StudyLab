export interface NavItem {
  href: string;
  label: string;
  /** Roadmap phase this tool ships in — omit once the page is real, not a placeholder. */
  phase?: string;
}

export const TOOL_NAV_ITEMS: NavItem[] = [
  { href: "/cuaderno", label: "Cuaderno", phase: "la Fase 5" },
  { href: "/calendario", label: "Calendario", phase: "la Fase 6" },
  { href: "/calculadora", label: "Calculadora de paso" },
  { href: "/resumidor", label: "Resumidor", phase: "la Fase 7" },
  { href: "/corrector", label: "Corrector", phase: "la Fase 8" },
  { href: "/flashcards", label: "Flashcards", phase: "la Fase 9" },
  { href: "/asistente", label: "Asistente IA", phase: "la Fase 10" },
  { href: "/traductor", label: "Traductor", phase: "la Fase 11" },
  { href: "/imagenes", label: "Imágenes", phase: "la Fase 12" },
  { href: "/historial", label: "Historial", phase: "la Fase 13" },
];
