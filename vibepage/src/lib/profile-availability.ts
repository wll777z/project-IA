import { db } from "@/lib/db";
export type ProfileAvailability =
  "missing" | "draft" | "published" | "unavailable";
export function profileAvailability(
  profile: { published: boolean; suspendedAt: Date | null } | null,
): ProfileAvailability {
  if (!profile) return "missing";
  if (profile.suspendedAt) return "unavailable";
  return profile.published ? "published" : "draft";
}
// Owner-only pages call this with the authenticated session ID. No moderation notes leave the server.
export async function getOwnedAvailability(userId: string) {
  return profileAvailability(
    await db.profile.findUnique({
      where: { userId },
      select: { published: true, suspendedAt: true },
    }),
  );
}
