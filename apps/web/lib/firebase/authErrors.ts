const MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "Ya existe una cuenta con este email.",
  "auth/invalid-email": "Introduce un email válido.",
  "auth/weak-password": "La contraseña debe tener al menos 8 caracteres.",
  "auth/invalid-credential": "Email o contraseña incorrectos.",
  "auth/user-not-found": "Email o contraseña incorrectos.",
  "auth/wrong-password": "Email o contraseña incorrectos.",
  "auth/too-many-requests": "Demasiados intentos. Inténtalo de nuevo en unos minutos.",
  "auth/network-request-failed": "Problema de conexión. Comprueba tu red e inténtalo de nuevo.",
  "auth/user-disabled": "Esta cuenta ha sido deshabilitada.",
};

/** Never surface a raw Firebase/auth error to the user — always a friendly line. */
export function getAuthErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | undefined)?.code;
  if (code && MESSAGES[code]) return MESSAGES[code];
  return "Ha ocurrido un problema. Inténtalo de nuevo.";
}
