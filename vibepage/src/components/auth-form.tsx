"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight } from "lucide-react";
import { credentialsSchema, registrationSchema } from "@/lib/validation";
import { authClient } from "@/lib/auth-client";
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const signup = mode === "register";
  const schema = signup
    ? registrationSchema
    : credentialsSchema.extend({ name: z.string().optional() });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof schema>>({ resolver: zodResolver(schema) });
  return (
    <>
      <form
        className="auth-form"
        onSubmit={handleSubmit(async (data) => {
          setMessage("");
          try {
            if (signup) {
              const result = await authClient.signUp.email({
                email: data.email.trim().toLowerCase(),
                password: data.password,
                name: data.name || "",
              });
              setMessage(
                result.error
                  ? result.error.status === 429
                    ? "Muitas tentativas. Aguarde um minuto."
                    : "Não foi possível concluir. Confira os dados e tente novamente."
                  : "Se os dados forem válidos, sua conta está pronta. Entre com seu e-mail e senha para continuar.",
              );
            } else {
              const result = await authClient.signIn.email({
                email: data.email.trim().toLowerCase(),
                password: data.password,
              });
              if (result.error)
                setMessage(
                  result.error.status === 429
                    ? "Muitas tentativas. Aguarde um minuto."
                    : "E-mail ou senha inválidos.",
                );
              else {
                router.push("/dashboard");
                router.refresh();
              }
            }
          } catch {
            setMessage(
              "Não foi possível conectar. Tente novamente em instantes.",
            );
          }
        })}
        noValidate
      >
        {signup && (
          <label>
            Como podemos chamar você?
            <input
              {...register("name")}
              autoComplete="nickname"
              maxLength={60}
              placeholder="Seu nome"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <span id="name-error" className="field-error">
                {errors.name.message}
              </span>
            )}
          </label>
        )}
        <label>
          E-mail
          <input
            type="email"
            {...register("email")}
            autoComplete="email"
            maxLength={254}
            placeholder="voce@exemplo.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <span id="email-error" className="field-error">
              {errors.email.message}
            </span>
          )}
        </label>
        <label>
          Senha
          <input
            type="password"
            {...register("password")}
            autoComplete={signup ? "new-password" : "current-password"}
            maxLength={128}
            placeholder={signup ? "Pelo menos 12 caracteres" : "Sua senha"}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password && (
            <span id="password-error" className="field-error">
              {errors.password.message}
            </span>
          )}
        </label>
        {message && (
          <p className="status-message" role="status">
            {message}
          </p>
        )}
        <button className="button" disabled={isSubmitting} type="submit">
          {isSubmitting
            ? "Só um instante…"
            : signup
              ? "Criar minha conta grátis"
              : "Entrar na minha conta"}
          <ArrowRight size={17} />
        </button>
      </form>
      <div className="auth-links">
        <Link href={signup ? "/login" : "/cadastro"}>
          {signup
            ? "Já tenho conta → Entrar"
            : "Sou novo por aqui → Criar conta"}
        </Link>
        {!signup && <Link href="/recuperar-senha">Esqueci a senha</Link>}
      </div>
      <p className="legal-note">
        Ao usar o VibePage, você concorda com os{" "}
        <Link href="/termos">Termos</Link> e a{" "}
        <Link href="/privacidade">Política de Privacidade</Link>.
      </p>
    </>
  );
}
