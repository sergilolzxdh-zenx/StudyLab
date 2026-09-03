import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, UnauthorizedError } from "@/lib/server/auth";
import { getGemini, GEMINI_MODEL } from "@/lib/server/gemini";
import { reserveUse, refundUse, InsufficientUsageError, ProfileNotFoundError } from "@/lib/server/usage";

export const runtime = "nodejs";

const ChatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(8000),
      })
    )
    .min(1)
    .max(50),
});

const SYSTEM_INSTRUCTION =
  "Eres el asistente de estudio de StudyLab. Ayudas a explicar conceptos, resolver dudas, generar preguntas y preparar exámenes, adaptando el nivel al estudiante. Responde en español salvo que te pidan otro idioma. Sé claro y conciso.";

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

  const parsed = ChatRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Petición no válida." }, { status: 400 });
  }

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
    const contents = parsed.data.messages.map((m) => ({
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: m.content }],
    }));

    const response = await getGemini().models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.6 },
    });
    result = response.text ?? "";
  } catch (err) {
    console.error("aiChat Gemini call failed", err);
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
