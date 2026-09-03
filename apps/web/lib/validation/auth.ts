import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "Introduce un email válido." }),
  password: z.string().min(1, { error: "Introduce tu contraseña." }),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(2, { error: "Introduce tu nombre completo." }),
    email: z.email({ error: "Introduce un email válido." }),
    password: z
      .string()
      .min(8, { error: "La contraseña debe tener al menos 8 caracteres." }),
    confirmPassword: z.string(),
    acceptTerms: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.acceptTerms === true, {
    message: "Debes aceptar los términos para continuar.",
    path: ["acceptTerms"],
  });
export type RegisterValues = z.infer<typeof registerSchema>;

export const resetPasswordSchema = z.object({
  email: z.email({ error: "Introduce un email válido." }),
});
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
