import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { db } from "@/lib/db";
import { credentialsSchema, registrationSchema } from "@/lib/validation";
import { mailConfigured, sendMail } from "@/lib/mail";
import { validateProductionEnv } from "../../scripts/production-env.mjs";
type AuthDelivery = (
  to: string,
  subject: string,
  text: string,
) => Promise<void>;
export function createAuth({
  deliver = mailConfigured ? sendMail : undefined,
  requireVerification = process.env.REQUIRE_EMAIL_VERIFICATION === "true",
}: { deliver?: AuthDelivery; requireVerification?: boolean } = {}) {
  if (requireVerification && !deliver)
    throw new Error("Confirmação de e-mail exige SMTP configurado.");
  return betterAuth({
    appName: "VibePage",
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    database: prismaAdapter(db, { provider: "postgresql", transaction: true }),
    emailAndPassword: {
      enabled: true,
      autoSignIn: false,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      requireEmailVerification: requireVerification,
      revokeSessionsOnPasswordReset: true,
      ...(deliver
        ? {
            sendResetPassword: async ({
              user,
              url,
            }: {
              user: { email: string };
              url: string;
            }) => {
              await deliver(
                user.email,
                "Redefina sua senha — VibePage",
                `Para redefinir sua senha, abra: ${url}\nSe você não solicitou, ignore esta mensagem.`,
              );
            },
          }
        : {}),
    },
    ...(deliver && requireVerification
      ? {
          emailVerification: {
            sendOnSignUp: true,
            sendOnSignIn: true,
            autoSignInAfterVerification: false,
            sendVerificationEmail: async ({
              user,
              url,
            }: {
              user: { email: string };
              url: string;
            }) => {
              await deliver(
                user.email,
                "Confirme seu e-mail — VibePage",
                `Para confirmar seu e-mail, abra: ${url}\nSe não foi você, ignore esta mensagem.`,
              );
            },
          },
        }
      : {}),
    user: {
      deleteUser: {
        enabled: true,
        beforeDelete: async (user) => {
          await db.supportCase.updateMany({
            where: { replyEmail: user.email },
            data: { replyEmail: null },
          });
          await db.verification.deleteMany({
            where: { OR: [{ value: user.id }, { identifier: user.email }] },
          });
        },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      freshAge: 60 * 5,
    },
    advanced: {
      useSecureCookies: process.env.BETTER_AUTH_URL?.startsWith("https://"),
      ipAddress: {
        ipAddressHeaders: process.env.AUTH_IP_HEADER
          ? [process.env.AUTH_IP_HEADER]
          : [],
      },
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax" },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 60,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60, max: 3 },
        "/request-password-reset": { window: 60, max: 3 },
        "/send-verification-email": { window: 60, max: 3 },
        "/delete-user": { window: 60, max: 5 },
      },
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (process.env.NODE_ENV === "production")
          validateProductionEnv(process.env);
        if (ctx.request && ctx.request.method !== "GET") {
          if (
            ctx.request.headers.get("origin") !==
            new URL(process.env.BETTER_AUTH_URL || "http://localhost:3000")
              .origin
          ) {
            throw new APIError("FORBIDDEN", {
              message: "Origem não permitida.",
            });
          }
        }
        if (ctx.path === "/sign-up/email" || ctx.path === "/sign-in/email") {
          const schema =
            ctx.path === "/sign-up/email"
              ? registrationSchema
              : credentialsSchema;
          const result = schema.safeParse(ctx.body);
          if (!result.success)
            throw new APIError("BAD_REQUEST", {
              message: "Confira os campos informados.",
            });
          return { context: { ...ctx, body: result.data } };
        }
        if (
          ctx.path === "/delete-user" &&
          (typeof ctx.body?.password !== "string" ||
            !ctx.body.password ||
            ctx.body.password.length > 128)
        ) {
          throw new APIError("BAD_REQUEST", {
            message: "Confirme sua senha para excluir a conta.",
          });
        }
        if (ctx.path === "/update-user")
          throw new APIError("FORBIDDEN", {
            message: "Use o editor de perfil para alterar seus dados públicos.",
          });
      }),
    },
  });
}
export const auth = createAuth();
