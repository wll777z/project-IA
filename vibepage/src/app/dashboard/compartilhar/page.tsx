import { getOwnedAvailability } from "@/lib/profile-availability";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isPro } from "@/lib/entitlements";
import { getOwnedProfile } from "@/lib/profiles";
import { canonicalProfileURL } from "@/lib/sharing";
import { ShareCenter } from "@/components/share-center";
export const metadata = { title: "Compartilhar e VibeCard" };
export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const [profile, plan, availability] = await Promise.all([
    getOwnedProfile(session.user.id),
    db.entitlement.findUnique({ where: { userId: session.user.id } }),
    getOwnedAvailability(session.user.id),
  ]);
  return (
    <ShareCenter
      profile={profile}
      pro={isPro(plan)}
      unavailable={availability === "unavailable"}
      url={
        profile && availability === "published"
          ? canonicalProfileURL(profile.username)
          : ""
      }
    />
  );
}
