"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import { createDeck, subscribeToDecks, type Deck } from "@/lib/firebase/flashcards";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { formatRelativeDate } from "@/lib/utils/date";

export default function FlashcardsPage() {
  const { user } = useAuthUser();
  const uid = user?.uid;

  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newDeckName, setNewDeckName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = subscribeToDecks(
      uid,
      (list) => {
        setDecks(list);
        setLoading(false);
      },
      (message) => {
        setError(message);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [uid]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!uid || !newDeckName.trim()) return;
    setCreating(true);
    try {
      await createDeck(uid, newDeckName.trim());
      setNewDeckName("");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="font-display text-3xl text-text">Flashcards</h1>
        <p className="mt-1 font-sans text-text-dim">
          Crea mazos de tarjetas y estúdialos volteándolas.
        </p>
      </div>

      <form onSubmit={handleCreate} className="flex flex-col gap-2 sm:flex-row">
        <input
          aria-label="Nombre del mazo nuevo"
          value={newDeckName}
          onChange={(e) => setNewDeckName(e.target.value)}
          placeholder="Nombre del mazo (p. ej. Vocabulario de Inglés)"
          className="h-11 flex-1 rounded-[var(--radius-md)] border border-border bg-surface-2 px-3.5 font-sans text-[15px] text-text placeholder:text-text-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text"
        />
        <Button type="submit" loading={creating} disabled={!uid || !newDeckName.trim()}>
          Crear mazo
        </Button>
      </form>

      {loading ? (
        <div className="flex items-center gap-2 text-text-dim">
          <Spinner />
          <span className="font-sans text-sm">Cargando…</span>
        </div>
      ) : error ? (
        <p className="font-sans text-sm text-danger">No se han podido cargar tus mazos.</p>
      ) : decks.length === 0 ? (
        <p className="font-sans text-sm text-text-dim">Todavía no tienes ningún mazo.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <Link key={deck.id} href={`/flashcards/${deck.id}`}>
              <Card className="h-full transition-colors hover:bg-surface-2">
                <p className="font-display text-lg text-text">{deck.name}</p>
                <p className="mt-1 font-sans text-xs text-text-dim">
                  {deck.updatedAt ? `Editado ${formatRelativeDate(deck.updatedAt.toDate())}` : ""}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
