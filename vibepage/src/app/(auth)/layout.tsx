import { Brand } from "@/components/brand";
import { ProfileDemo } from "@/components/profile-demo";
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main id="main" className="auth-layout">
      <aside className="auth-story">
        <Brand />
        <h2>
          Um espaço que
          <br />
          só pode ser seu.
        </h2>
        <p>
          Seus links, suas comunidades, sua identidade.
          <br />
          Seu próximo capítulo começa aqui.
        </p>
        <ProfileDemo compact />
      </aside>
      <section className="auth-form-wrap">
        <div className="mobile-brand">
          <Brand />
        </div>
        {children}
      </section>
    </main>
  );
}
