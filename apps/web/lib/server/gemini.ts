import { GoogleGenAI } from "@google/genai";

// gemini-2.0-flash was retired; Google's API now points callers to this one.
export const GEMINI_MODEL = "gemini-3.6-flash";

let cached: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no está configurada en el servidor.");
  }
  if (!cached) {
    cached = new GoogleGenAI({ apiKey });
  }
  return cached;
}
