import Link from "next/link";
import { Brand } from "@/components/brand";
export const metadata = {
  robots: { index: false, follow: false },
  title: "Recursos Free e Pro",
};
export default function Page() {
  return (
    <main id="main" className="legal-page pro-features">
      <Brand />
      <p className="kicker">DO SEU JEITO, NO SEU RITMO</p>
      <h1>Mais espaço para a sua identidade.</h1>
      <p>
        O Free oferece um perfil completo. Pro adiciona ferramentas de criação e
        análise; não existe checkout ou cobrança nesta versão.
      </p>
      <table>
        <thead>
          <tr>
            <th>Recurso</th>
            <th>Free</th>
            <th>Pro</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Perfil, links e avatar", "Sim", "Sim"],
            ["Cartões gamer", "3 básicos", "12 e seis estilos"],
            ["Temas", "3 gratuitos", "13 temas"],
            ["QR e VibeCard", "QR e Minimal", "Cinco estilos de VibeCard"],
            ["Profile Studio", "Classic", "Quatro layouts, colunas e seções"],
            ["Blocos e galeria", "—", "Até 16 blocos e 18 imagens"],
            ["Coleções", "Aparência ativa", "Até dez coleções"],
            ["Perfis sazonais", "—", "Até cinco intervalos futuros"],
            ["Analytics", "Resumo", "Comparação, 90 dias e CSV"],
            [
              "Efeitos e marca",
              "Personalização básica",
              "Efeitos, fontes e marca opcional",
            ],
          ].map(([feature, free, pro]) => (
            <tr key={feature}>
              <th>{feature}</th>
              <td>{free}</td>
              <td>{pro}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Experimente sem alterar sua conta.</h2>
      <p>
        A demonstração permite testar visualmente o Studio, modelos, blocos,
        temas e efeitos. Coleções, agenda, uploads e compartilhamento com dados
        reais exigem o aplicativo conectado ao banco.
      </p>
      <Link className="button" href="/demo">
        Abrir demonstração Pro
      </Link>
      <Link className="text-button" href="/cadastro">
        Criar perfil Free →
      </Link>
      <p>
        R$ 9,90/mês permanece apenas como valor sugerido. Permissões Pro são
        concedidas administrativamente; nenhuma assinatura está sendo vendida.
      </p>
    </main>
  );
}
