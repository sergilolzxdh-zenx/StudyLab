"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/firestore";

export type HistoryType =
  | "resumen"
  | "correccion"
  | "conversacion"
  | "flashcards"
  | "traduccion"
  | "ocr"
  | "estudio";

export interface HistoryEntry {
  id: string;
  type: HistoryType;
  title: string;
  detail: string;
  createdAt: Timestamp | null;
}

function historyCollection(uid: string) {
  return collection(getDb(), "users", uid, "history");
}

export function subscribeToHistory(
  uid: string,
  onChange: (entries: HistoryEntry[]) => void,
  onError: (message: string) => void
) {
  const q = query(historyCollection(uid), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      onChange(
        snap.docs.map((d) => {
          const data = d.data({ serverTimestamps: "estimate" });
          return {
            id: d.id,
            type: (data.type as HistoryType) ?? "estudio",
            title: (data.title as string) ?? "",
            detail: (data.detail as string) ?? "",
            createdAt: (data.createdAt as Timestamp) ?? null,
          };
        })
      );
    },
    (err) => onError(err.message)
  );
}

export async function logHistoryEntry(
  uid: string,
  input: { type: HistoryType; title: string; detail?: string }
): Promise<void> {
  await addDoc(historyCollection(uid), {
    type: input.type,
    title: input.title,
    detail: input.detail ?? "",
    createdAt: serverTimestamp(),
  });
}

export async function deleteHistoryEntry(uid: string, entryId: string): Promise<void> {
  await deleteDoc(doc(getDb(), "users", uid, "history", entryId));
}
