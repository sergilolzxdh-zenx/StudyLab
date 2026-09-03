import { NextResponse } from "next/server";
import { requireAuth, UnauthorizedError } from "@/lib/server/auth";
import { getGemini, GEMINI_MODEL } from "@/lib/server/gemini";
import { reserveUse, refundUse, InsufficientUsageError, ProfileNotFoundError } from "@/lib/server/usage";

export const runtime = "nodejs";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

const OCR_PROMPT =
  "Extrae todo el texto que aparece en esta imagen, tal cual, sin añadir explicaciones ni comentarios propios. Conserva los saltos de línea razonablemente. Si no hay texto legible en la imagen, responde exactamente: SIN_TEXTO";

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

  let file: File | null = null;
  try {
    const formData = await req.formData();
    const entry = formData.get("image");
    if (entry instanceof File) file = entry;
  } catch {
    return NextResponse.json({ error: "Petición no válida." }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ error: "No se ha recibido ninguna imagen." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Formato de imagen no soportado. Usa PNG, JPEG o WEBP." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "La imagen es demasiado grande (máximo 4 MB)." }, { status: 400 });
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
    const bytes = Buffer.from(await file.arrayBuffer());
    const base64 = bytes.toString("base64");

    const response = await getGemini().models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: OCR_PROMPT }, { inlineData: { mimeType: file.type, data: base64 } }],
        },
      ],
      config: { temperature: 0.1 },
    });
    const text = (response.text ?? "").trim();
    result = text === "SIN_TEXTO" ? "" : text;
  } catch (err) {
    console.error("aiOcr Gemini call failed", err);
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
