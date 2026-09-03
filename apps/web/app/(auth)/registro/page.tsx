"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { FirebaseNotConfiguredNotice } from "@/components/features/auth/FirebaseNotConfiguredNotice";
import { registerSchema, type RegisterValues } from "@/lib/validation/auth";
import { registerWithEmail } from "@/lib/firebase/auth";
import { getAuthErrorMessage } from "@/lib/firebase/authErrors";
import { isFirebaseConfigured } from "@/lib/firebase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { acceptTerms: false },
  });

  async function onSubmit(values: RegisterValues) {
    setSubmitting(true);
    try {
      await registerWithEmail(values.name, values.email, values.password);
      toast.success("Cuenta creada. Bienvenido a StudyLab.");
      router.push("/dashboard");
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <h1 className="font-display text-2xl text-text">Crea tu cuenta</h1>
      <p className="mt-1 font-sans text-sm text-text-dim">
        Empieza a organizar tu estudio en un minuto.
      </p>

      {!isFirebaseConfigured && <FirebaseNotConfiguredNotice className="mt-6" />}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
        <Input
          label="Nombre completo"
          autoComplete="name"
          error={errors.name?.message}
          {...register("name")}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          hint={!errors.password ? "Al menos 8 caracteres." : undefined}
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          label="Repite la contraseña"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <Checkbox
          label="Acepto los términos y la política de privacidad."
          error={errors.acceptTerms?.message}
          {...register("acceptTerms")}
        />
        <Button type="submit" loading={submitting} disabled={!isFirebaseConfigured} className="mt-1">
          Crear cuenta
        </Button>
      </form>

      <p className="mt-6 text-center font-sans text-sm text-text-dim">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-text underline underline-offset-4">
          Inicia sesión
        </Link>
      </p>
    </Card>
  );
}
