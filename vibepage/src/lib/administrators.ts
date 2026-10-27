import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser, HttpError } from "@/lib/http";
export const administratorContactSchema = z.object({
  email: z
    .email()
    .max(254)
    .transform((v) => v.trim().toLowerCase()),
  phone: z
    .string()
    .transform((v) => {
      const digits = v.replace(/\D/g, "");
      return v.trim().startsWith("+")
        ? "+" + digits
        : digits.length === 11
          ? "+55" + digits
          : "+" + digits;
    })
    .pipe(z.string().regex(/^\+[1-9][0-9]{7,14}$/)),
});
export async function requireAdministrator(request: Request, mutation = false) {
  const user = await requireUser(request, mutation);
  if (
    !user.emailVerified ||
    !(await db.administrator.findUnique({ where: { userId: user.id } }))
  )
    throw new HttpError(
      403,
      "Acesso restrito à administração com e-mail confirmado.",
    );
  return user;
}
export async function grantAdministrator(email: string, phone: string) {
  const contact = administratorContactSchema.parse({ email, phone });
  const user = await db.user.findUnique({ where: { email: contact.email } });
  if (!user?.emailVerified)
    throw new HttpError(
      400,
      "Confirme o e-mail da conta antes de conceder administração.",
    );
  return db.administrator.upsert({
    where: { userId: user.id },
    create: { userId: user.id, phone: contact.phone },
    update: { phone: contact.phone },
  });
}
