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

export type TaskType = "tarea" | "objetivo";

export interface Task {
  id: string;
  title: string;
  /** "YYYY-MM-DD" */
  date: string;
  /** "HH:MM", or null for an all-day item. */
  time: string | null;
  type: TaskType;
  completed: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

function tasksCollection(uid: string) {
  return collection(getDb(), "users", uid, "tasks");
}

export function subscribeToTasks(
  uid: string,
  onChange: (tasks: Task[]) => void,
  onError: (message: string) => void
) {
  const q = query(tasksCollection(uid), orderBy("date", "asc"));
  return onSnapshot(
    q,
    (snap) => {
      onChange(
        snap.docs.map((d) => {
          const data = d.data({ serverTimestamps: "estimate" });
          return {
            id: d.id,
            title: (data.title as string) ?? "",
            date: (data.date as string) ?? "",
            time: (data.time as string | null) ?? null,
            type: (data.type as TaskType) ?? "tarea",
            completed: Boolean(data.completed),
            createdAt: (data.createdAt as Timestamp) ?? null,
            updatedAt: (data.updatedAt as Timestamp) ?? null,
          };
        })
      );
    },
    (err) => onError(err.message)
  );
}

export async function createTask(
  uid: string,
  input: { title: string; date: string; time: string | null; type: TaskType }
): Promise<string> {
  const ref = await addDoc(tasksCollection(uid), {
    ...input,
    completed: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function setTaskCompleted(uid: string, taskId: string, completed: boolean): Promise<void> {
  await updateDoc(doc(getDb(), "users", uid, "tasks", taskId), {
    completed,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTask(uid: string, taskId: string): Promise<void> {
  await deleteDoc(doc(getDb(), "users", uid, "tasks", taskId));
}
