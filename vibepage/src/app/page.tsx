import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Gamepad2,
  Link2,
  Palette,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { UltimateShowcase } from "@/components/ultimate-showcase";
import { themes } from "@/lib/themes";
import { Brand } from "@/components/brand";
import { ProfileDemo } from "@/components/profile-demo";
export default function Home() {
  return (
    <>
      <header className="site-header shell">
        <Brand />
        <nav className="desktop-nav" aria-label="Principal">
          <a href="#como-funciona">Como funciona</a>
          <a href="#cartoes">Cartões gamer</a>
          <a href="#temas">Temas</a>
          <a href="#planos">Planos</a>
        </nav>
        <div className="nav-actions">
          <Link href="/login" className="login-link">
            Entrar
          </Link>
          <Link href="/cadastro" className="button button-small">
            Criar meu perfil <ArrowUpRight size={15} />
          </Link>
        </div>
      </header>
      <main id="main">
        <section className="hero shell">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="online" /> PARA QUEM NÃO CABE EM UMA BIO{" "}
              <span>↗</span>
            </div>
            <h1>
              Seu universo.
              <br />
              Sua vibe.
              <br />
              <span>Um só link.</span>
            </h1>
            <p className="hero-description">
              Você é mais que um @. Junte seus links, seu estilo e suas
              comunidades em uma página que é a sua cara.
            </p>
            <div className="hero-buttons">
              <Link className="button" href="/cadastro">
                Criar meu perfil grátis <ArrowRight size={18} />
              </Link>
              <Link className="text-button" href="/demo">
                Experimentar o editor <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="hero-note">
              <span className="mini-avatars">
                <i>W</i>
                <i>K</i>
                <i>L</i>
              </span>
              <span>
                Seu espaço na internet.
                <br />
                <strong>Grátis para começar. Seu para criar.</strong>
              </span>
            </div>
          </div>
          <ProfileDemo />
        </section>
        <div className="community-strip">
          <div className="shell">
            <span>UM LINK. TODAS AS SUAS VERSÕES.</span>
            <strong>
              <Gamepad2 size={19} /> Gamers
            </strong>
            <span className="strip-star">✦</span>
            <strong>Criadores</strong>
            <span className="strip-star">✦</span>
            <strong>Comunidades</strong>
            <span className="strip-star">✦</span>
            <strong>Você.</strong>
          </div>
        </div>
        <section id="como-funciona" className="section shell">
          <div className="section-heading">
            <div>
              <p className="kicker">MENOS LIMITES. MAIS VOCÊ.</p>
              <h2>
                Não é só um perfil.
                <br />É o seu ponto de encontro.
              </h2>
            </div>
            <p>
              Do lobby à sua próxima ideia.
              <br />
              Tudo começa no seu espaço.
            </p>
          </div>
          <div className="feature-grid">
            {[
              [
                Palette,
                "Sua identidade, sem filtro",
                "Cores e temas que combinam com seu universo. Você escolhe a atmosfera.",
              ],
              [
                Link2,
                "Tudo conectado",
                "Seu canal, suas redes e suas comunidades. Um endereço para reunir tudo.",
              ],
              [
                Zap,
                "Feito para qualquer tela",
                "Do setup ao celular. Uma experiência leve, bonita e fácil de navegar.",
              ],
            ].map(([Icon, title, copy], i) => {
              const I = Icon as typeof Palette;
              return (
                <article className="feature-card" key={String(title)}>
                  <div className="feature-top">
                    <I size={22} />
                    <span>0{i + 1}</span>
                  </div>
                  <h3>{String(title)}</h3>
                  <p>{String(copy)}</p>
                </article>
              );
            })}
          </div>
        </section>
        <UltimateShowcase />
        <section id="temas" className="section theme-section">
          <div className="shell">
            <div className="section-heading">
              <div>
                <p className="kicker">ESCOLHA SUA ATMOSFERA</p>
                <h2>Uma vibe para cada versão sua.</h2>
              </div>
              <span className="outline-pill">Prévia dos temas</span>
            </div>
            <div className="themes-grid">
              {themes.map(
                ({
                  id,
                  name: title,
                  description: copy,
                  className,
                  premium,
                }) => (
                  <article key={id} className="theme-item">
                    <div className={`theme-preview ${className}`}>
                      <div className="theme-orb" />
                      <div className="tiny-avatar" />
                      <div className="tiny-name" />
                      <div className="tiny-bio" />
                      <div className="tiny-link" />
                      <div className="tiny-link" />
                      <div className="tiny-link" />
                    </div>
                    <h3>
                      {title}{" "}
                      {premium && <span className="theme-pro">PRO</span>}
                    </h3>
                    <p>{copy}</p>
                    <Link className="theme-try" href={`/demo?theme=${id}`}>
                      Testar tema ↗
                    </Link>
                  </article>
                ),
              )}
            </div>
          </div>
        </section>
        <section id="planos" className="section shell">
          <div className="center-heading">
            <p className="kicker">COMECE COM A SUA VIBE</p>
            <h2>Seu espaço. No seu ritmo.</h2>
            <p>Comece grátis. A evolução Pro chega depois.</p>
          </div>
          <div className="pricing-grid">
            <article className="price-card">
              <span className="outline-pill">FREE</span>
              <h3>Uma boa vibe já basta.</h3>
              <div className="price">
                R$ 0<span>/ para começar</span>
              </div>
              <ul>
                {[
                  "Um perfil só seu",
                  "Até 100 links e 3 cartões gamer",
                  "Temas gratuitos",
                  "Seu username disponível",
                  "Marca discreta VibePage",
                ].map((t) => (
                  <li key={t}>
                    <Check size={16} />
                    {t}
                  </li>
                ))}
              </ul>
              <Link href="/cadastro" className="button button-secondary">
                Começar grátis <ArrowRight size={16} />
              </Link>
            </article>
            <article className="price-card pro">
              <span className="outline-pill">
                <Sparkles size={13} /> PRO · EM BREVE
              </span>
              <h3>Sua vibe, outro nível.</h3>
              <div className="price">
                R$ 9,90<span>/ mês, valor sugerido</span>
              </div>
              <ul>
                {[
                  "Tudo do plano Free",
                  "12 cartões e 6 estilos visuais",
                  "Temas e efeitos exclusivos",
                  "Estatísticas detalhadas",
                  "Remoção da marca",
                  "Personalização avançada",
                ].map((t) => (
                  <li key={t}>
                    <Check size={16} />
                    {t}
                  </li>
                ))}
              </ul>
              <p className="coming-soon">
                Acesso Pro apenas por concessão administrativa. Sem checkout ou
                cobrança.
              </p>
            </article>
          </div>
        </section>
        <section className="section faq shell">
          <div>
            <p className="kicker">SEM MISTÉRIO</p>
            <h2>Antes de dar o play.</h2>
          </div>
          <div>
            {[
              [
                "O VibePage é gratuito?",
                "Sim. A proposta Free inclui um perfil e os recursos essenciais. A assinatura Pro ainda não está à venda e não há cobranças nesta versão.",
              ],
              [
                "Preciso saber programar?",
                "Não. Você pode editar seu nome, bio, links e aparência em um editor com prévia em tempo real. Experimente a demonstração antes de criar sua conta.",
              ],
              [
                "Posso escolher meu username?",
                "Sim. Escolha um nome disponível no editor. Ele será reservado ao salvar e formará o endereço da sua página. Nomes reservados e já utilizados não estão disponíveis.",
              ],
              [
                "Meus dados ficam seguros?",
                "Usamos senhas protegidas, sessões no servidor e controle de acesso. Você pode excluir sua conta na área autenticada.",
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <span>+</span>
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="final-cta shell">
          <span>✦</span>
          <h2>
            A internet tem espaço
            <br />
            para a sua vibe.
          </h2>
          <Link href="/cadastro" className="button">
            Bora criar meu perfil <ArrowUpRight size={18} />
          </Link>
          <p>Sem cartão. Sem complicação.</p>
        </section>
      </main>
      <footer className="site-footer shell">
        <Brand />
        <p>Seu universo, em um link. © {new Date().getFullYear()} VibePage</p>
        <div>
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/termos">Termos</Link>
          <span>
            <ShieldCheck size={13} /> Feito com cuidado
          </span>
        </div>
      </footer>
    </>
  );
}
