"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FirebaseNotConfiguredNotice } from "@/components/features/auth/FirebaseNotConfiguredNotice";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/validation/auth";
import { resetPassword } from "@/lib/firebase/auth";
import { getAuthErrorMessage } from "@/lib/firebase/authErrors";
import { isFirebaseConfigured } from "@/lib/firebase/client";

export default function ResetPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(values: ResetPasswordValues) {
    setSubmitting(true);
    try {
      await resetPassword(values.email);
      setSent(true);
    } catch (error) {
      const code = (error as { code?: string } | undefined)?.code;
      // Don't reveal whether an account exists for this email.
      if (code === "auth/user-not-found") {
        setSent(true);
      } else {
        toast.error(getAuthErrorMessage(error));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <h1 className="font-display text-2xl text-text">Recupera tu contraseña</h1>
      <p className="mt-1 font-sans text-sm text-text-dim">
        Te enviaremos un enlace para restablecerla.
      </p>

      {!isFirebaseConfigured && <FirebaseNotConfiguredNotice className="mt-6" />}

      {sent ? (
        <p role="status" className="mt-6 font-sans text-sm text-text">
          Si existe una cuenta con ese email, recibirás un enlace para
          restablecer tu contraseña en unos minutos.
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Button type="submit" loading={submitting} disabled={!isFirebaseConfigured} className="mt-1">
            Enviar enlace
          </Button>
        </form>
      )}

      <p className="mt-6 text-center font-sans text-sm text-text-dim">
        <Link href="/login" className="text-text underline underline-offset-4">
          Volver a iniciar sesión
        </Link>
      </p>
    </Card>
  );
}
