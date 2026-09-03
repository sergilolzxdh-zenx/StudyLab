"use client";

import { useEffect, useState } from "react";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import {
  deleteHistoryEntry,
  subscribeToHistory,
  type HistoryEntry,
  type HistoryType,
} from "@/lib/firebase/history";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";
import { formatRelativeDate } from "@/lib/utils/date";

const TYPE_LABELS: Record<HistoryType, string> = {
  resumen: "Resumen",
  correccion: "Corrección",
  conversacion: "Conversación",
  flashcards: "Flashcards",
  traduccion: "Traducción",
  ocr: "Imágenes",
  estudio: "Estudio",
};

const TYPE_ORDER: HistoryType[] = [
  "estudio",
  "flashcards",
  "resumen",
  "correccion",
  "conversacion",
  "traduccion",
  "ocr",
];

export default function HistorialPage() {
  const { user } = useAuthUser();
  const uid = user?.uid;

  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<HistoryType | "todos">("todos");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = subscribeToHistory(
      uid,
      (list) => {
        setEntries(list);
        setLoading(false);
      },
      (message) => {
        setError(message);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [uid]);

  const filtered = entries.filter((entry) => {
    if (typeFilter !== "todos" && entry.type !== typeFilter) return false;
    const haystack = `${entry.title} ${entry.detail}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="font-display text-3xl text-text">Historial</h1>
        <p className="mt-1 font-sans text-text-dim">
          Todo lo que has estudiado y generado, en un solo sitio.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          aria-label="Buscar en el historial"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar…"
          className="h-10 flex-1 rounded-[var(--radius-md)] border border-border bg-surface-2 px-3 font-sans text-sm text-text placeholder:text-text-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text"
        />
        <div className="flex flex-wrap gap-1">
          <FilterChip active={typeFilter === "todos"} onClick={() => setTypeFilter("todos")}>
            Todos
          </FilterChip>
          {TYPE_ORDER.map((type) => (
            <FilterChip key={type} active={typeFilter === type} onClick={() => setTypeFilter(type)}>
              {TYPE_LABELS[type]}
            </FilterChip>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-text-dim">
          <Spinner />
          <span className="font-sans text-sm">Cargando…</span>
        </div>
      ) : error ? (
        <p className="font-sans text-sm text-danger">No se ha podido cargar tu historial.</p>
      ) : filtered.length === 0 ? (
        <p className="font-sans text-sm text-text-dim">
          {entries.length === 0
            ? "Todavía no hay actividad. Estudia un mazo de flashcards, o usa el resumidor, el corrector, el asistente, el traductor o las imágenes cuando estén conectados — aquí quedará el registro."
            : "Sin resultados."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((entry) => {
            const isOpen = openId === entry.id;
            return (
              <li key={entry.id} className="rounded-[var(--radius-md)] border border-border bg-surface p-4">
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : entry.id)}
                  className="flex w-full items-start justify-between gap-4 text-left"
                >
                  <div className="min-w-0">
                    <span className="font-sans text-xs uppercase tracking-wide text-text-dim">
                      {TYPE_LABELS[entry.type]}
                    </span>
                    <p className="mt-0.5 truncate font-sans text-sm text-text">{entry.title}</p>
                  </div>
                  <span className="shrink-0 font-sans text-xs text-text-dim">
                    {entry.createdAt ? formatRelativeDate(entry.createdAt.toDate()) : "…"}
                  </span>
                </button>

                {isOpen && (
                  <div className="mt-3 flex items-start justify-between gap-4 border-t border-border pt-3">
                    <p className="font-sans text-sm text-text-dim">
                      {entry.detail || "Sin más detalles."}
                    </p>
                    <button
                      type="button"
                      onClick={() => uid && deleteHistoryEntry(uid, entry.id)}
                      aria-label={`Eliminar "${entry.title}"`}
                      className="shrink-0 font-sans text-xs text-text-dim hover:text-danger"
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[var(--radius-full)] border px-3 py-1 font-sans text-xs transition-colors",
        active
          ? "border-accent bg-accent text-accent-contrast"
          : "border-border text-text-dim hover:text-text"
      )}
    >
      {children}
    </button>
  );
}
