import { z } from "zod";
const configSchema = z.object({
  controller: z.string().trim().min(2).max(200),
  contactEmail: z.email().max(254),
  version: z.string().trim().min(1).max(80),
  retentionNotice: z.string().trim().min(20).max(2000),
  ageNotice: z.string().trim().min(20).max(2000),
  retentionDays: z.coerce.number().int().min(7).max(365),
});
export function supportConfig(env = process.env) {
  if (env.SUPPORT_INTAKE_ENABLED !== "true") return null;
  const parsed = configSchema.safeParse({
    controller: env.LEGAL_CONTROLLER_NAME,
    contactEmail: env.LEGAL_CONTACT_EMAIL,
    version: env.LEGAL_NOTICE_VERSION,
    retentionNotice: env.LEGAL_RETENTION_NOTICE,
    ageNotice: env.LEGAL_AGE_NOTICE,
    retentionDays: env.SUPPORT_RETENTION_DAYS,
  });
  return parsed.success ? parsed.data : null;
}
