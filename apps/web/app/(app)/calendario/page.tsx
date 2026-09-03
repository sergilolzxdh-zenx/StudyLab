"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import {
  createTask,
  deleteTask,
  setTaskCompleted,
  subscribeToTasks,
  type Task,
  type TaskType,
} from "@/lib/firebase/tasks";
import { capitalizeFirst, getMonthGrid, toDateKey } from "@/lib/utils/calendar";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";

const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

const inputClass =
  "h-10 rounded-[var(--radius-sm)] border border-border bg-surface-2 px-2.5 font-sans text-sm text-text placeholder:text-text-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text";

export default function CalendarioPage() {
  const { user } = useAuthUser();
  const uid = user?.uid;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));

  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newType, setNewType] = useState<TaskType>("tarea");

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = subscribeToTasks(
      uid,
      (list) => {
        setTasks(list);
        setLoading(false);
      },
      (message) => {
        setError(message);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [uid]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      const list = map.get(task.date) ?? [];
      list.push(task);
      map.set(task.date, list);
    }
    return map;
  }, [tasks]);

  const monthDays = useMemo(() => getMonthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const todayKey = toDateKey(new Date());
  const selectedTasks = [...(tasksByDate.get(selectedDate) ?? [])].sort((a, b) =>
    (a.time ?? "99:99").localeCompare(b.time ?? "99:99")
  );

  async function handleAddTask(e: FormEvent) {
    e.preventDefault();
    if (!uid || !newTitle.trim()) return;
    await createTask(uid, {
      title: newTitle.trim(),
      date: selectedDate,
      time: newTime || null,
      type: newType,
    });
    setNewTitle("");
    setNewTime("");
  }

  function changeMonth(delta: number) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  }

  const monthLabel = capitalizeFirst(cursor.toLocaleDateString("es-ES", { month: "long", year: "numeric" }));
  const selectedLabel = capitalizeFirst(
    new Date(`${selectedDate}T00:00:00`).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-8 lg:flex-row">
      <div className="lg:w-[380px] lg:shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl text-text">{monthLabel}</h1>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="Mes anterior"
              className="grid h-8 w-8 place-items-center rounded-[var(--radius-sm)] text-text-dim transition-colors hover:bg-surface-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Mes siguiente"
              className="grid h-8 w-8 place-items-center rounded-[var(--radius-sm)] text-text-dim transition-colors hover:bg-surface-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text"
            >
              ›
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center font-sans text-xs text-text-dim">
          {WEEKDAY_LABELS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {monthDays.map((day) => {
            const key = toDateKey(day);
            const inMonth = day.getMonth() === cursor.getMonth();
            const dayTasks = tasksByDate.get(key) ?? [];
            const isToday = key === todayKey;
            const isSelected = key === selectedDate;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDate(key)}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-[var(--radius-sm)] font-sans text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text",
                  !inMonth && "text-text-dim/40",
                  inMonth && !isSelected && "text-text hover:bg-surface-2",
                  isSelected && "bg-accent text-accent-contrast",
                  isToday && !isSelected && "border border-text-dim"
                )}
              >
                {day.getDate()}
                {dayTasks.length > 0 && (
                  <span className={cn("h-1 w-1 rounded-full", isSelected ? "bg-accent-contrast" : "bg-text-dim")} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4">
        <h2 className="font-display text-lg text-text">{selectedLabel}</h2>

        {loading ? (
          <div className="flex items-center gap-2 text-text-dim">
            <Spinner />
            <span className="font-sans text-sm">Cargando…</span>
          </div>
        ) : error ? (
          <p className="font-sans text-sm text-danger">No se han podido cargar tus tareas.</p>
        ) : selectedTasks.length === 0 ? (
          <p className="font-sans text-sm text-text-dim">Nada para este día.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {selectedTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3"
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => uid && setTaskCompleted(uid, task.id, !task.completed)}
                  aria-label={`Marcar "${task.title}" como completada`}
                  className="h-4 w-4 shrink-0 accent-[var(--accent)]"
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate font-sans text-sm text-text",
                      task.completed && "text-text-dim line-through"
                    )}
                  >
                    {task.title}
                  </p>
                  <p className="font-sans text-xs text-text-dim">
                    {task.type === "objetivo" ? "Objetivo" : "Tarea"}
                    {task.time ? ` · ${task.time}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => uid && deleteTask(uid, task.id)}
                  aria-label={`Eliminar "${task.title}"`}
                  className="shrink-0 text-text-dim transition-colors hover:text-danger"
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <form
          onSubmit={handleAddTask}
          className="mt-2 flex flex-col gap-2 rounded-[var(--radius-md)] border border-border bg-surface p-4"
        >
          <input
            aria-label="Título de la tarea u objetivo"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Añadir tarea u objetivo…"
            className={inputClass}
          />
          <div className="flex flex-wrap gap-2">
            <input
              aria-label="Hora (opcional)"
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className={cn(inputClass, "w-32")}
            />
            <select
              aria-label="Tipo"
              value={newType}
              onChange={(e) => setNewType(e.target.value as TaskType)}
              className={inputClass}
            >
              <option value="tarea">Tarea</option>
              <option value="objetivo">Objetivo</option>
            </select>
            <Button type="submit" size="sm" className="ml-auto" disabled={!uid || !newTitle.trim()}>
              Añadir
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
