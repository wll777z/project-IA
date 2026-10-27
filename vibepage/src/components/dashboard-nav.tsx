"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Palette,
  Settings2,
  ChartNoAxesCombined,
  Share2,
  Layers,
  Sparkles,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
const destinations = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { href: "/dashboard/editor", label: "Editar perfil", icon: Palette },
  {
    href: "/dashboard/compartilhar",
    label: "Compartilhar e VibeCard",
    icon: Share2,
  },
  {
    href: "/dashboard/estatisticas",
    label: "Estatísticas",
    icon: ChartNoAxesCombined,
  },
  {
    href: "/dashboard/aparencias",
    label: "Coleções e temporadas",
    icon: Layers,
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics Pro",
    icon: ChartNoAxesCombined,
  },
  { href: "/demo/pro", label: "Conhecer o Pro", icon: Sparkles },
  { href: "/dashboard/conta", label: "Minha conta", icon: Settings2 },
];
export function DashboardNavigation({
  pathname,
  administrator = false,
}: {
  pathname: string;
  administrator?: boolean;
}) {
  const items = administrator
    ? [
        ...destinations,
        {
          href: "/dashboard/moderacao",
          label: "Suporte e moderação",
          icon: ShieldCheck,
        },
      ]
    : destinations;
  const active = items.find(
    ({ href }) =>
      pathname === href ||
      (href !== "/dashboard" && pathname.startsWith(href + "/")),
  );
  function links() {
    return items.map(({ href, label, icon: Icon }) => (
      <Link
        key={href}
        href={href}
        aria-current={active?.href === href ? "page" : undefined}
      >
        <Icon size={17} aria-hidden="true" />
        {label}
      </Link>
    ));
  }
  return (
    <>
      <nav className="dashboard-nav-desktop" aria-label="Área da conta">
        {links()}
      </nav>
      <details className="dashboard-nav-mobile">
        <summary>
          <span>
            Navegação <strong>{active?.label ?? "Área da conta"}</strong>
          </span>
          <ChevronDown size={18} aria-hidden="true" />
        </summary>
        <nav aria-label="Área da conta no celular">{links()}</nav>
      </details>
    </>
  );
}
export function DashboardNav({ administrator }: { administrator: boolean }) {
  return (
    <DashboardNavigation
      pathname={usePathname()}
      administrator={administrator}
    />
  );
}
