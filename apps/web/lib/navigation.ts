export interface NavItem {
  href: string;
  label: string;
}

export const TOOL_NAV_ITEMS: NavItem[] = [
  { href: "/cuaderno", label: "Cuaderno" },
  { href: "/calendario", label: "Calendario" },
  { href: "/calculadora", label: "Calculadora de paso" },
  { href: "/resumidor", label: "Resumidor" },
  { href: "/corrector", label: "Corrector" },
  { href: "/flashcards", label: "Flashcards" },
  { href: "/asistente", label: "Asistente IA" },
  { href: "/traductor", label: "Traductor" },
  { href: "/imagenes", label: "Imágenes" },
  { href: "/historial", label: "Historial" },
];
