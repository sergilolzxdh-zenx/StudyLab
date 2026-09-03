import { getAdminAuth } from "./firebaseAdmin";

export class UnauthorizedError extends Error {}

/** Verifies the Firebase ID token in the Authorization header and returns the caller's uid. */
export async function requireAuth(req: Request): Promise<string> {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer (.+)$/i);
  if (!match) {
    throw new UnauthorizedError("Falta el token de autenticación.");
  }
  try {
    const decoded = await getAdminAuth().verifyIdToken(match[1]);
    return decoded.uid;
  } catch {
    throw new UnauthorizedError("Tu sesión ha caducado. Vuelve a iniciar sesión.");
  }
}
