"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import { createNote, deleteNote, subscribeToNotes, updateNote, type Note } from "@/lib/firebase/notes";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";
import { formatRelativeDate } from "@/lib/utils/date";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function CuadernoPage() {
  const { user } = useAuthUser();
  const uid = user?.uid;

  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const notesRef = useRef<Note[]>([]);
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = subscribeToNotes(
      uid,
      (list) => {
        setNotes(list);
        setNotesLoading(false);
      },
      (message) => {
        setNotesError(message);
        setNotesLoading(false);
      }
    );
    return unsubscribe;
  }, [uid]);

  // Load the selected note into the editor — only on selection change, never
  // on remote updates to the note currently being edited (that would fight
  // the user's typing / cursor position).
  useEffect(() => {
    if (!selectedId) return;
    const note = notesRef.current.find((n) => n.id === selectedId);
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setSaveStatus("idle");
      setDirty(false);
    }
  }, [selectedId]);

  // Debounced autosave.
  useEffect(() => {
    if (!uid || !selectedId || !dirty) return;
    const timer = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        await updateNote(uid, selectedId, { title, content });
        setSaveStatus("saved");
        setDirty(false);
      } catch {
        setSaveStatus("error");
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [uid, selectedId, title, content, dirty]);

  async function handleCreate() {
    if (!uid) return;
    const id = await createNote(uid);
    setSelectedId(id);
    // Set the known defaults directly — don't wait on the notes listener,
    // which may not have caught up with this write yet.
    setTitle("Nueva nota");
    setContent("");
    setSaveStatus("idle");
    setDirty(false);
  }

  async function handleDelete() {
    if (!uid || !selectedId) return;
    await deleteNote(uid, selectedId);
    setSelectedId(null);
    setConfirmingDelete(false);
  }

  const filteredNotes = notes.filter((n) =>
    `${n.title} ${n.content}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8 lg:flex-row">
      <aside className={cn("flex w-full flex-col gap-4 lg:w-72 lg:shrink-0", selectedId && "hidden lg:flex")}>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl text-text">Cuaderno</h1>
          <Button size="sm" onClick={handleCreate} disabled={!uid}>
            Nueva nota
          </Button>
        </div>

        <input
          type="search"
          aria-label="Buscar notas"
          placeholder="Buscar notas…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 rounded-[var(--radius-md)] border border-border bg-surface-2 px-3 font-sans text-sm text-text placeholder:text-text-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text"
        />

        {notesLoading ? (
          <div className="flex items-center gap-2 py-6 text-text-dim">
            <Spinner />
            <span className="font-sans text-sm">Cargando…</span>
          </div>
        ) : notesError ? (
          <p className="font-sans text-sm text-danger">No se han podido cargar tus notas.</p>
        ) : filteredNotes.length === 0 ? (
          <p className="font-sans text-sm text-text-dim">
            {notes.length === 0 ? "Todavía no tienes notas." : "Sin resultados."}
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {filteredNotes.map((note) => (
              <li key={note.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(note.id);
                    setConfirmingDelete(false);
                  }}
                  className={cn(
                    "w-full rounded-[var(--radius-md)] px-3 py-2.5 text-left transition-colors",
                    note.id === selectedId ? "bg-surface-2" : "hover:bg-surface-2"
                  )}
                >
                  <p className="truncate font-sans text-sm text-text">{note.title || "Sin título"}</p>
                  <p className="mt-0.5 truncate font-sans text-xs text-text-dim">
                    {note.updatedAt ? formatRelativeDate(note.updatedAt.toDate()) : "guardando…"}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <section className={cn("flex flex-1 flex-col gap-4", !selectedId && "hidden lg:flex")}>
        {!selectedId ? (
          <div className="flex flex-1 items-center justify-center text-center">
            <p className="font-sans text-sm text-text-dim">Selecciona una nota o crea una nueva.</p>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="self-start font-sans text-sm text-text-dim hover:text-text lg:hidden"
            >
              ← Volver a las notas
            </button>

            <input
              aria-label="Título de la nota"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setDirty(true);
              }}
              placeholder="Título"
              className="border-0 bg-transparent font-display text-2xl text-text placeholder:text-text-dim focus-visible:outline-none"
            />
            <textarea
              aria-label="Contenido de la nota"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setDirty(true);
              }}
              placeholder="Escribe aquí…"
              className="min-h-[400px] flex-1 resize-none border-0 bg-transparent font-sans text-[15px] leading-relaxed text-text placeholder:text-text-dim focus-visible:outline-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
              <span className="font-sans text-xs text-text-dim" role="status">
                {saveStatus === "saving"
                  ? "Guardando…"
                  : saveStatus === "saved"
                    ? "Guardado"
                    : saveStatus === "error"
                      ? "Error al guardar"
                      : ""}
              </span>

              {confirmingDelete ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-sans text-sm text-text-dim">¿Eliminar esta nota?</span>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmingDelete(false)}>
                    Cancelar
                  </Button>
                  <Button size="sm" variant="secondary" onClick={handleDelete}>
                    Eliminar
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setConfirmingDelete(true)}>
                  Eliminar nota
                </Button>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
