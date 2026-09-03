"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FirebaseNotConfiguredNotice } from "@/components/features/auth/FirebaseNotConfiguredNotice";
import { loginSchema, type LoginValues } from "@/lib/validation/auth";
import { loginWithEmail } from "@/lib/firebase/auth";
import { getAuthErrorMessage } from "@/lib/firebase/authErrors";
import { isFirebaseConfigured } from "@/lib/firebase/client";

export default function LoginPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginValues) {
    setSubmitting(true);
    try {
      await loginWithEmail(values.email, values.password);
      toast.success("Sesión iniciada.");
      router.push("/dashboard");
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <h1 className="font-display text-2xl text-text">Inicia sesión</h1>
      <p className="mt-1 font-sans text-sm text-text-dim">
        Continúa donde lo dejaste.
      </p>

      {!isFirebaseConfigured && <FirebaseNotConfiguredNotice className="mt-6" />}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
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
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <div className="flex justify-end">
          <Link href="/recuperar" className="font-sans text-sm text-text-dim hover:text-text">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Button type="submit" loading={submitting} disabled={!isFirebaseConfigured} className="mt-1">
          Iniciar sesión
        </Button>
      </form>

      <p className="mt-6 text-center font-sans text-sm text-text-dim">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="text-text underline underline-offset-4">
          Regístrate
        </Link>
      </p>
    </Card>
  );
}
