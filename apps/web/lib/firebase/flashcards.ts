"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Timestamp,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/firestore";

export type Difficulty = "dificil" | "normal" | "facil";

export interface Deck {
  id: string;
  name: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficulty: Difficulty | null;
  lastReviewedAt: Timestamp | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

function decksCollection(uid: string) {
  return collection(getDb(), "users", uid, "flashcardDecks");
}

function cardsCollection(uid: string, deckId: string) {
  return collection(getDb(), "users", uid, "flashcardDecks", deckId, "cards");
}

export function subscribeToDecks(
  uid: string,
  onChange: (decks: Deck[]) => void,
  onError: (message: string) => void
) {
  const q = query(decksCollection(uid), orderBy("updatedAt", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      onChange(
        snap.docs.map((d) => {
          const data = d.data({ serverTimestamps: "estimate" });
          return {
            id: d.id,
            name: (data.name as string) ?? "",
            createdAt: (data.createdAt as Timestamp) ?? null,
            updatedAt: (data.updatedAt as Timestamp) ?? null,
          };
        })
      );
    },
    (err) => onError(err.message)
  );
}

export async function createDeck(uid: string, name: string): Promise<string> {
  const ref = await addDoc(decksCollection(uid), {
    name,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export function subscribeToDeck(
  uid: string,
  deckId: string,
  onChange: (deck: Deck | null) => void,
  onError: (message: string) => void
) {
  return onSnapshot(
    doc(getDb(), "users", uid, "flashcardDecks", deckId),
    (snap) => {
      if (!snap.exists()) {
        onChange(null);
        return;
      }
      const data = snap.data({ serverTimestamps: "estimate" });
      onChange({
        id: snap.id,
        name: (data.name as string) ?? "",
        createdAt: (data.createdAt as Timestamp) ?? null,
        updatedAt: (data.updatedAt as Timestamp) ?? null,
      });
    },
    (err) => onError(err.message)
  );
}

export async function deleteDeck(uid: string, deckId: string): Promise<void> {
  // Firestore doesn't cascade-delete subcollections — remove the cards first
  // so nothing orphaned is left behind.
  const cardsSnap = await getDocs(cardsCollection(uid, deckId));
  const batch = writeBatch(getDb());
  cardsSnap.docs.forEach((cardDoc) => batch.delete(cardDoc.ref));
  batch.delete(doc(getDb(), "users", uid, "flashcardDecks", deckId));
  await batch.commit();
}

export function subscribeToCards(
  uid: string,
  deckId: string,
  onChange: (cards: Flashcard[]) => void,
  onError: (message: string) => void
) {
  const q = query(cardsCollection(uid, deckId), orderBy("createdAt", "asc"));
  return onSnapshot(
    q,
    (snap) => {
      onChange(
        snap.docs.map((d) => {
          const data = d.data({ serverTimestamps: "estimate" });
          return {
            id: d.id,
            front: (data.front as string) ?? "",
            back: (data.back as string) ?? "",
            difficulty: (data.difficulty as Difficulty) ?? null,
            lastReviewedAt: (data.lastReviewedAt as Timestamp) ?? null,
            createdAt: (data.createdAt as Timestamp) ?? null,
            updatedAt: (data.updatedAt as Timestamp) ?? null,
          };
        })
      );
    },
    (err) => onError(err.message)
  );
}

export async function createCard(
  uid: string,
  deckId: string,
  input: { front: string; back: string }
): Promise<void> {
  await addDoc(cardsCollection(uid, deckId), {
    ...input,
    difficulty: null,
    lastReviewedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await updateDoc(doc(getDb(), "users", uid, "flashcardDecks", deckId), {
    updatedAt: serverTimestamp(),
  });
}

export async function updateCard(
  uid: string,
  deckId: string,
  cardId: string,
  input: { front: string; back: string }
): Promise<void> {
  await updateDoc(doc(getDb(), "users", uid, "flashcardDecks", deckId, "cards", cardId), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCard(uid: string, deckId: string, cardId: string): Promise<void> {
  await deleteDoc(doc(getDb(), "users", uid, "flashcardDecks", deckId, "cards", cardId));
}

export async function recordCardReview(
  uid: string,
  deckId: string,
  cardId: string,
  difficulty: Difficulty
): Promise<void> {
  await updateDoc(doc(getDb(), "users", uid, "flashcardDecks", deckId, "cards", cardId), {
    difficulty,
    lastReviewedAt: serverTimestamp(),
  });
}
