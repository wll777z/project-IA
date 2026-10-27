import { getOwnedAvailability } from "@/lib/profile-availability";
import { UnavailableProfile } from "@/components/profile-availability";
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
  const [profile, entitlement, availability] = await Promise.all([
    getOwnedProfile(session.user.id),
    db.entitlement.findUnique({ where: { userId: session.user.id } }),
    getOwnedAvailability(session.user.id),
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
      <p className="analytics-note">
        Este editor altera a aparência padrão. Uma temporada ativa pode mudar a
        apresentação pública até o fim do agendamento.
      </p>
      {availability === "unavailable" && <UnavailableProfile />}
      {!profile && (
        <p className="analytics-note">
          Comece pelo username em Perfil e pelo primeiro destino em Links. Salve
          seu rascunho; quando estiver pronto, marque Perfil público e salve
          para compartilhar.
        </p>
      )}
      <ProfileEditor
        initial={editableAppearance(
          profile ?? emptyProfile(session.user.name),
          isPro(entitlement),
          true,
        )}
        pro={isPro(entitlement)}
        unavailable={availability === "unavailable"}
      />
    </>
  );
}
