import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, UnauthorizedError } from "@/lib/server/auth";
import { getGemini, GEMINI_MODEL } from "@/lib/server/gemini";
import { reserveUse, refundUse, InsufficientUsageError, ProfileNotFoundError } from "@/lib/server/usage";

export const runtime = "nodejs";

const RequestSchema = z.object({
  action: z.enum(["resumir", "explicar", "preguntas", "examen", "corregir", "traducir"]),
  text: z.string().min(1, "El texto no puede estar vacío.").max(20000, "El texto es demasiado largo."),
  targetLanguage: z.string().min(1).max(40).optional(),
  sourceLanguage: z.string().min(1).max(40).optional(),
});

const SYSTEM_PROMPTS: Record<string, string> = {
  resumir:
    "Eres un asistente educativo. Resume el texto del usuario de forma clara y concisa, en español, conservando las ideas clave.",
  explicar:
    "Eres un profesor paciente. Explica el texto del usuario de forma sencilla, como si fuera la primera vez que alguien lo ve.",
  preguntas:
    "Genera entre 3 y 6 preguntas de repaso sobre el texto del usuario, una por línea, sin numerarlas con markdown.",
  examen:
    "Genera un examen corto (5 preguntas con sus respuestas al final) basado en el texto del usuario.",
  corregir:
    "Eres un corrector de textos en español. Corrige ortografía, gramática y puntuación del texto del usuario. Devuelve primero el texto corregido y después una lista breve de los cambios realizados.",
  traducir: "Traduce el texto del usuario de forma fiel y natural.",
};

/** Centralized text-tool endpoint — backs Resumidor, Corrector and Traductor from one route. */
export async function POST(req: Request) {
  let uid: string;
  try {
    uid = await requireAuth(req);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof UnauthorizedError ? err.message : "No autorizado." },
      { status: 401 }
    );
  }

  const parsed = RequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Petición no válida." }, { status: 400 });
  }
  const { action, text, targetLanguage, sourceLanguage } = parsed.data;

  let reserved: boolean;
  try {
    reserved = await reserveUse(uid, 1);
  } catch (err) {
    if (err instanceof InsufficientUsageError) {
      return NextResponse.json({ error: "No tienes usos disponibles." }, { status: 402 });
    }
    if (err instanceof ProfileNotFoundError) {
      return NextResponse.json({ error: "No se encontró tu perfil." }, { status: 404 });
    }
    console.error("reserveUse failed", err);
    return NextResponse.json({ error: "Ha ocurrido un problema. Inténtalo de nuevo." }, { status: 500 });
  }

  let result: string;
  try {
    let systemInstruction = SYSTEM_PROMPTS[action];
    if (action === "traducir") {
      if (targetLanguage) systemInstruction += ` Traduce al ${targetLanguage}.`;
      if (sourceLanguage) systemInstruction += ` El texto original está en ${sourceLanguage}.`;
    }

    const response = await getGemini().models.generateContent({
      model: GEMINI_MODEL,
      contents: text,
      config: { systemInstruction, temperature: 0.4 },
    });
    result = response.text ?? "";
  } catch (err) {
    console.error("aiTextTool Gemini call failed", err);
    if (reserved) {
      await refundUse(uid, 1).catch((refundErr) => console.error("refundUse failed", refundErr));
    }
    return NextResponse.json(
      { error: "La IA está temporalmente ocupada. Inténtalo de nuevo." },
      { status: 502 }
    );
  }

  return NextResponse.json({ result });
}
