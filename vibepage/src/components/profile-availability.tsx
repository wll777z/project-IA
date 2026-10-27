import Link from "next/link";
import type { ProfileAvailability } from "@/lib/profile-availability";
export const availabilityLabels: Record<ProfileAvailability, string> = {
  missing: "NÃO CRIADO",
  draft: "RASCUNHO",
  published: "PUBLICADO",
  unavailable: "INDISPONÍVEL",
};
export function UnavailableProfile({ page = false }: { page?: boolean }) {
  const Heading = page ? "h1" : "h2";
  return (
    <section className="workspace-card" aria-label="Disponibilidade do perfil">
      <Heading className="availability-title">
        Seu perfil está indisponível ao público.
      </Heading>
      <p>
        Você pode continuar editando seus dados. Salvar alterações não libera a
        página, o QR Code ou a VibeCard.
      </p>
      <Link className="text-button" href="/suporte">
        Entrar em contato com o suporte →
      </Link>
    </section>
  );
}
export function FirstSteps({
  hasUsername,
  hasLinks,
}: {
  hasUsername: boolean;
  hasLinks: boolean;
}) {
  return (
    <section
      className="workspace-card first-steps"
      aria-labelledby="first-steps-title"
    >
      <h2 id="first-steps-title">Seu perfil em poucos passos.</h2>
      <ol>
        <li>
          {hasUsername
            ? "Username escolhido."
            : "No editor, escolha seu username na seção Perfil."}
        </li>
        <li>
          {hasLinks
            ? "Primeiro link adicionado."
            : "Na seção Links, adicione seu primeiro destino HTTPS."}
        </li>
        <li>
          Salve para guardar seu rascunho. Para publicar, marque Perfil público
          e salve novamente.
        </li>
        <li>
          Depois de publicar, abra Compartilhar e VibeCard para copiar seu link.
        </li>
      </ol>
      <Link className="text-button" href="/dashboard/editor">
        {hasUsername ? "Continuar no editor →" : "Começar meu perfil →"}
      </Link>
    </section>
  );
}
