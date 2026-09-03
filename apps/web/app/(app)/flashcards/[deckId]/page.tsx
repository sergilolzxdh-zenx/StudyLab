"use client";

import { use, useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import {
  createCard,
  deleteCard,
  deleteDeck,
  recordCardReview,
  subscribeToCards,
  subscribeToDeck,
  updateCard,
  type Deck,
  type Difficulty,
  type Flashcard,
} from "@/lib/firebase/flashcards";
import { logHistoryEntry } from "@/lib/firebase/history";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";

type Mode = "gestionar" | "estudiar";

const inputClass =
  "h-10 rounded-[var(--radius-sm)] border border-border bg-surface-2 px-2.5 font-sans text-sm text-text placeholder:text-text-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text";

export default function FlashcardDeckPage(props: PageProps<"/flashcards/[deckId]">) {
  const { deckId } = use(props.params);
  const router = useRouter();
  const { user } = useAuthUser();
  const uid = user?.uid;

  const [deck, setDeck] = useState<Deck | null | undefined>(undefined);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [cardsError, setCardsError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("gestionar");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");

  const [studyQueue, setStudyQueue] = useState<Flashcard[]>([]);
  const [studyIndex, setStudyIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = subscribeToDeck(uid, deckId, setDeck, () => setDeck(null));
    return unsubscribe;
  }, [uid, deckId]);

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = subscribeToCards(
      uid,
      deckId,
      (list) => {
        setCards(list);
        setCardsLoading(false);
      },
      (message) => {
        setCardsError(message);
        setCardsLoading(false);
      }
    );
    return unsubscribe;
  }, [uid, deckId]);

  async function handleAddCard(e: FormEvent) {
    e.preventDefault();
    if (!uid || !newFront.trim() || !newBack.trim()) return;
    await createCard(uid, deckId, { front: newFront.trim(), back: newBack.trim() });
    setNewFront("");
    setNewBack("");
  }

  function startEdit(card: Flashcard) {
    setEditingId(card.id);
    setEditFront(card.front);
    setEditBack(card.back);
  }

  async function saveEdit() {
    if (!uid || !editingId || !editFront.trim() || !editBack.trim()) return;
    await updateCard(uid, deckId, editingId, { front: editFront.trim(), back: editBack.trim() });
    setEditingId(null);
  }

  async function handleDeleteDeck() {
    if (!uid) return;
    await deleteDeck(uid, deckId);
    router.push("/flashcards");
  }

  function startStudy() {
    setStudyQueue([...cards].sort(() => Math.random() - 0.5));
    setStudyIndex(0);
    setFlipped(false);
    setMode("estudiar");
  }

  async function handleReview(difficulty: Difficulty) {
    const current = studyQueue[studyIndex];
    if (uid && current) await recordCardReview(uid, deckId, current.id, difficulty);

    const isLastCard = studyIndex + 1 >= studyQueue.length;
    if (isLastCard && uid && deck) {
      const count = studyQueue.length;
      await logHistoryEntry(uid, {
        type: "flashcards",
        title: `Estudiaste "${deck.name}"`,
        detail: count === 1 ? "1 tarjeta repasada." : `${count} tarjetas repasadas.`,
      });
    }

    setFlipped(false);
    setStudyIndex((i) => i + 1);
  }

  if (deck === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="h-6 w-6 text-text-dim" />
      </div>
    );
  }

  if (deck === null) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center">
        <p className="font-sans text-sm text-text-dim">Este mazo no existe o ha sido eliminado.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/flashcards" className="font-sans text-sm text-text-dim hover:text-text">
            ← Mazos
          </Link>
          <h1 className="mt-1 font-display text-2xl text-text">{deck.name}</h1>
        </div>
        {mode === "gestionar" ? (
          <Button onClick={startStudy} disabled={cards.length === 0}>
            Estudiar
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => setMode("gestionar")}>
            Salir del estudio
          </Button>
        )}
      </div>

      {mode === "estudiar" ? (
        studyQueue.length === 0 ? (
          <p className="font-sans text-sm text-text-dim">Este mazo no tiene tarjetas.</p>
        ) : studyIndex >= studyQueue.length ? (
          <Card className="text-center">
            <p className="font-display text-2xl text-text">¡Completado!</p>
            <p className="mt-2 font-sans text-sm text-text-dim">
              Has repasado {studyQueue.length}{" "}
              {studyQueue.length === 1 ? "tarjeta" : "tarjetas"}.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Button variant="secondary" onClick={() => setMode("gestionar")}>
                Volver
              </Button>
              <Button onClick={startStudy}>Repasar de nuevo</Button>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col items-center gap-6 py-4">
            <p className="font-sans text-sm text-text-dim">
              {studyIndex + 1} / {studyQueue.length}
            </p>

            <button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              aria-label={flipped ? "Ver el anverso" : "Ver el reverso"}
              className="w-full max-w-md [perspective:1200px]"
            >
              <div
                className={cn(
                  "relative h-64 w-full transition-transform duration-500 [transform-style:preserve-3d]",
                  flipped && "[transform:rotateY(180deg)]"
                )}
              >
                <div className="absolute inset-0 flex items-center justify-center rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center [backface-visibility:hidden]">
                  <p className="font-display text-xl text-text">{studyQueue[studyIndex].front}</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center rounded-[var(--radius-lg)] border border-border bg-surface-2 p-8 text-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
                  <p className="font-sans text-lg text-text">{studyQueue[studyIndex].back}</p>
                </div>
              </div>
            </button>

            {!flipped ? (
              <p className="font-sans text-xs text-text-dim">Toca la tarjeta para ver la respuesta.</p>
            ) : (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => handleReview("dificil")}>
                  Difícil
                </Button>
                <Button variant="secondary" onClick={() => handleReview("normal")}>
                  Normal
                </Button>
                <Button onClick={() => handleReview("facil")}>Fácil</Button>
              </div>
            )}
          </div>
        )
      ) : (
        <>
          <form
            onSubmit={handleAddCard}
            className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-border bg-surface p-4"
          >
            <input
              aria-label="Anverso de la tarjeta"
              value={newFront}
              onChange={(e) => setNewFront(e.target.value)}
              placeholder="Anverso (pregunta)"
              className={inputClass}
            />
            <input
              aria-label="Reverso de la tarjeta"
              value={newBack}
              onChange={(e) => setNewBack(e.target.value)}
              placeholder="Reverso (respuesta)"
              className={inputClass}
            />
            <Button
              type="submit"
              size="sm"
              className="self-end"
              disabled={!uid || !newFront.trim() || !newBack.trim()}
            >
              Añadir tarjeta
            </Button>
          </form>

          {cardsLoading ? (
            <div className="flex items-center gap-2 text-text-dim">
              <Spinner />
              <span className="font-sans text-sm">Cargando…</span>
            </div>
          ) : cardsError ? (
            <p className="font-sans text-sm text-danger">No se han podido cargar las tarjetas.</p>
          ) : cards.length === 0 ? (
            <p className="font-sans text-sm text-text-dim">Este mazo no tiene tarjetas todavía.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {cards.map((card) => (
                <li key={card.id} className="rounded-[var(--radius-md)] border border-border bg-surface p-4">
                  {editingId === card.id ? (
                    <div className="flex flex-col gap-2">
                      <input
                        aria-label="Editar anverso"
                        value={editFront}
                        onChange={(e) => setEditFront(e.target.value)}
                        className={inputClass}
                      />
                      <input
                        aria-label="Editar reverso"
                        value={editBack}
                        onChange={(e) => setEditBack(e.target.value)}
                        className={inputClass}
                      />
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          Cancelar
                        </Button>
                        <Button size="sm" onClick={saveEdit}>
                          Guardar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate font-sans text-sm text-text">{card.front}</p>
                        <p className="mt-0.5 truncate font-sans text-sm text-text-dim">{card.back}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(card)}
                          aria-label={`Editar "${card.front}"`}
                          className="rounded-[var(--radius-sm)] px-2 py-1 font-sans text-xs text-text-dim hover:bg-surface-2 hover:text-text"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => uid && deleteCard(uid, deckId, card.id)}
                          aria-label={`Eliminar "${card.front}"`}
                          className="rounded-[var(--radius-sm)] px-2 py-1 font-sans text-xs text-text-dim hover:bg-surface-2 hover:text-danger"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-border pt-4">
            {confirmingDelete ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-sans text-sm text-text-dim">¿Eliminar este mazo y sus tarjetas?</span>
                <Button size="sm" variant="ghost" onClick={() => setConfirmingDelete(false)}>
                  Cancelar
                </Button>
                <Button size="sm" variant="secondary" onClick={handleDeleteDeck}>
                  Eliminar mazo
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="font-sans text-sm text-text-dim hover:text-danger"
              >
                Eliminar mazo
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
