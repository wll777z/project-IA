import { editableAppearance } from "@/lib/appearance";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { emptyProfile, getOwnedProfile } from "@/lib/profiles";
import { isPro } from "@/lib/entitlements";
import { ProfileEditor } from "@/components/profile-editor";
export const metadata = { title: "Editor de perfil" };
export default async function Editor() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const [profile, entitlement] = await Promise.all([
    getOwnedProfile(session.user.id),
    db.entitlement.findUnique({ where: { userId: session.user.id } }),
  ]);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="kicker">SEU PERFIL, DO SEU JEITO</p>
          <h1>Crie sua próxima vibe.</h1>
          <p>Pequenos detalhes. Uma identidade inteira.</p>
        </div>
        <span className="outline-pill">
          {isPro(entitlement) ? "PRO" : "FREE"}
        </span>
      </div>
      <ProfileEditor
        initial={editableAppearance(
          profile ?? emptyProfile(session.user.name),
          isPro(entitlement),
        )}
        pro={isPro(entitlement)}
      />
    </>
  );
}
