/**
 * One-shot text handoff between tools (e.g. Imágenes/OCR → Resumidor),
 * per-tab only. Not a general state store — just enough for "send this
 * extracted text to another tool" without a global state manager.
 */
const KEY = "studylab:handoff-text";

export function setHandoffText(text: string): void {
  try {
    sessionStorage.setItem(KEY, text);
  } catch {
    // sessionStorage can throw in some contexts (private mode, etc.) — the
    // handoff is a convenience, not required for the destination tool to work.
  }
}

export function takeHandoffText(): string | null {
  try {
    const value = sessionStorage.getItem(KEY);
    if (value !== null) sessionStorage.removeItem(KEY);
    return value;
  } catch {
    return null;
  }
}
