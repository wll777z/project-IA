import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { db } from "@/lib/db";
import { credentialsSchema, registrationSchema } from "@/lib/validation";
import { mailConfigured, sendMail } from "@/lib/mail";
export const auth = betterAuth({
  appName: "VibePage",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "postgresql", transaction: true }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    ...(mailConfigured
      ? {
          sendResetPassword: async ({
            user,
            url,
          }: {
            user: { email: string };
            url: string;
          }) => {
            await sendMail(
              user.email,
              "Redefina sua senha — VibePage",
              `Para redefinir sua senha, abra: ${url}\nSe você não solicitou, ignore esta mensagem.`,
            );
          },
        }
      : {}),
  },
  user: {
    deleteUser: {
      enabled: true,
      beforeDelete: async (user) => {
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
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.request && ctx.request.method !== "GET") {
        const origin = ctx.request.headers.get("origin");
        if (
          origin !==
          new URL(process.env.BETTER_AUTH_URL || "http://localhost:3000").origin
        ) {
          throw new APIError("FORBIDDEN", { message: "Origem não permitida." });
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
        // Drop undeclared fields, including image URLs and arbitrary client attributes.
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
          message: "Edição disponível em uma próxima etapa.",
        });
    }),
  },
});
