import { getFirebaseAuth } from "@/lib/firebase/client";

export class FunctionsCallError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function callApi<T>(path: string, body: unknown): Promise<T> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new FunctionsCallError("Tu sesión ha caducado. Vuelve a iniciar sesión.", 401);
  }

  const token = await user.getIdToken();
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}) as Record<string, unknown>);
  if (!res.ok) {
    const message = typeof data.error === "string" ? data.error : "Ha ocurrido un problema. Inténtalo de nuevo.";
    throw new FunctionsCallError(message, res.status);
  }
  return data as T;
}

export type TextToolAction = "resumir" | "explicar" | "preguntas" | "examen" | "corregir" | "traducir";

export async function callAiTextTool(input: {
  action: TextToolAction;
  text: string;
  targetLanguage?: string;
  sourceLanguage?: string;
}): Promise<string> {
  const data = await callApi<{ result: string }>("/api/ai-text-tool", input);
  return data.result;
}

export async function callAiChat(messages: { role: "user" | "assistant"; content: string }[]): Promise<string> {
  const data = await callApi<{ result: string }>("/api/ai-chat", { messages });
  return data.result;
}

export async function callAiOcr(file: File): Promise<string> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new FunctionsCallError("Tu sesión ha caducado. Vuelve a iniciar sesión.", 401);
  }

  const token = await user.getIdToken();
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch("/api/ai-ocr", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const data = await res.json().catch(() => ({}) as Record<string, unknown>);
  if (!res.ok) {
    const message = typeof data.error === "string" ? data.error : "Ha ocurrido un problema. Inténtalo de nuevo.";
    throw new FunctionsCallError(message, res.status);
  }
  return (data as { result: string }).result;
}
