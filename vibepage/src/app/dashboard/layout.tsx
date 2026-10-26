import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Brand } from "@/components/brand";
import { Logout } from "@/components/account-actions";
import {
  LayoutDashboard,
  Palette,
  Settings2,
  ChartNoAxesCombined,
} from "lucide-react";
export const metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return (
    <>
      <header className="app-header">
        <Brand />
        <div>
          <span className="account-label">{session.user.name}</span>
          <Logout />
        </div>
      </header>
      <div className="app-layout">
        <aside className="app-sidebar">
          <p className="kicker">SEU UNIVERSO</p>
          <nav aria-label="Área da conta">
            <Link href="/dashboard">
              <LayoutDashboard size={17} />
              Visão geral
            </Link>
            <Link href="/dashboard/editor">
              <Palette size={17} />
              Editar perfil
            </Link>
            <Link href="/dashboard/estatisticas">
              <ChartNoAxesCombined size={17} />
              Estatísticas
            </Link>
            <Link href="/dashboard/conta">
              <Settings2 size={17} />
              Minha conta
            </Link>
          </nav>
          <div className="sidebar-note">
            <span>✦</span>
            <strong>Feito para ser seu.</strong>
            <p>Cada detalhe conta uma parte da sua história.</p>
          </div>
        </aside>
        <main id="main" className="app-content">
          {children}
        </main>
      </div>
    </>
  );
}
