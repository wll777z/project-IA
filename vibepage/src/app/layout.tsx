import type { Metadata } from "next";
import { appOrigin } from "@/lib/site-origin";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(appOrigin()),
  title: {
    default: "VibePage — Seu universo, em um link.",
    template: "%s · VibePage",
  },
  description:
    "Uma página com a sua identidade. Reúna seus links, suas comunidades e tudo o que faz você ser você.",
  robots: { index: true, follow: true },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <a className="skip-link" href="#main">
          Pular para conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
