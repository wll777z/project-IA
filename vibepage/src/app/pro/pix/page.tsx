import Link from "next/link";
import { PixKeyCopy } from "@/components/pix-key-copy";

export const metadata = {
  title: "Pix e assinatura Pro | VibePage",
  description: "Informações sobre a futura opção de pagamento Pix do VibePage.",
};

export default function PixInformationPage() {
  // Server-only configuration: never commit a personal phone/Pix key.
  const key = process.env.VIBEPAGE_PIX_KEY?.trim() ?? "";
  const configured = /^\+?\d{10,13}$/.test(key) || (key.length > 0 && key.length <= 77);
  return (
    <main id="main" className="legal-page pro-features">
      <p className="kicker">VIBEPAGE PRO</p>
      <h1>Pagamento via Pix</h1>
      <p>
        Estamos preparando a opção de pagamento manual por Pix. Ainda não
        existe checkout nem confirmação automática nesta versão.
      </p>
      <h2>Chave Pix</h2>
      {configured ? (
        <>
          <PixKeyCopy pixKey={key} />
          <p>
            Atenção: enviar um Pix não ativa o Pro automaticamente. Não faça
            transferências antes de o VibePage anunciar oficialmente a abertura
            das vendas e fornecer um procedimento de confirmação.
          </p>
        </>
      ) : (
        <p>
          A chave Pix ainda não foi configurada no servidor. Nenhum pagamento
          está disponível por esta página.
        </p>
      )}
      <p>
        O preço de R$ 9,90/mês é somente uma sugestão. Não há assinatura
        recorrente ou cobrança ativa. Para receber pagamentos de forma segura,
        ainda será necessária uma solução de confirmação e atendimento.
      </p>
      <Link className="text-button" href="/demo/pro">
        Ver os recursos do Pro →
      </Link>
    </main>
  );
}
