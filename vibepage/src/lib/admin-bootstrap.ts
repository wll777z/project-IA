import { z } from "zod";
import {
  administratorContactSchema,
  grantAdministrator,
} from "@/lib/administrators";
import { credentialsSchema } from "@/lib/validation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { mailConfigured } from "@/lib/mail";
export const bootstrapSchema = administratorContactSchema
  .extend({ existing: z.boolean(), password: z.string().optional() })
  .superRefine((value, ctx) => {
    if (
      !value.existing &&
      !credentialsSchema.shape.password.safeParse(value.password).success
    )
      ctx.addIssue({
        code: "custom",
        message: "A senha deve ter entre 12 e 128 caracteres.",
        path: ["password"],
      });
    if (value.existing && value.password !== undefined)
      ctx.addIssue({
        code: "custom",
        message: "O modo existente não altera senha.",
        path: ["password"],
      });
  });
export async function bootstrapAdministrator(input: unknown) {
  const data = bootstrapSchema.parse(input);
  const old = await db.user.findUnique({ where: { email: data.email } });
  if (data.existing) {
    if (!old) throw new Error("A conta ainda não existe.");
    await grantAdministrator(data.email, data.phone);
    return { created: false, pendingVerification: false };
  }
  if (old)
    throw new Error(
      "A conta já existe. Não alteramos sua senha. Use --grant-existing após confirmar o e-mail.",
    );
  if (!mailConfigured || process.env.REQUIRE_EMAIL_VERIFICATION !== "true")
    throw new Error(
      "Configure SMTP real e confirmação de e-mail antes de criar o administrador.",
    );
  const result = await auth.api.signUpEmail({
    body: {
      name: "Administrador",
      email: data.email,
      password: data.password!,
    },
  });
  const actual = await db.user.findUniqueOrThrow({
    where: { email: data.email },
  });
  if (actual.id !== result.user.id)
    throw new Error(
      "A conta foi criada em outra sessão. Confirme o e-mail e use --grant-existing.",
    );
  await db.administrator.create({
    data: { userId: actual.id, phone: data.phone },
  });
  return { created: true, pendingVerification: !actual.emailVerified };
}
