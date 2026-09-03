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
  updateDoc,
  type Timestamp,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/firestore";

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

function notesCollection(uid: string) {
  return collection(getDb(), "users", uid, "notes");
}

export function subscribeToNotes(
  uid: string,
  onChange: (notes: Note[]) => void,
  onError: (message: string) => void
) {
  const q = query(notesCollection(uid), orderBy("updatedAt", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      onChange(
        snap.docs.map((d) => {
          const data = d.data({ serverTimestamps: "estimate" });
          return {
            id: d.id,
            title: (data.title as string) ?? "",
            content: (data.content as string) ?? "",
            createdAt: (data.createdAt as Timestamp) ?? null,
            updatedAt: (data.updatedAt as Timestamp) ?? null,
          };
        })
      );
    },
    (err) => onError(err.message)
  );
}

export async function createNote(uid: string): Promise<string> {
  const ref = await addDoc(notesCollection(uid), {
    title: "Nueva nota",
    content: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateNote(
  uid: string,
  noteId: string,
  patch: { title: string; content: string }
): Promise<void> {
  await updateDoc(doc(getDb(), "users", uid, "notes", noteId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteNote(uid: string, noteId: string): Promise<void> {
  await deleteDoc(doc(getDb(), "users", uid, "notes", noteId));
}
