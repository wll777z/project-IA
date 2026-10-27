import { db } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Brand } from "@/components/brand";
import { Logout } from "@/components/account-actions";
import { DashboardNav } from "@/components/dashboard-nav";
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
  const administrator =
    session.user.emailVerified &&
    (await db.administrator.findUnique({ where: { userId: session.user.id } }));
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
          <DashboardNav administrator={!!administrator} />
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
