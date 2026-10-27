import type { MetadataRoute } from "next";
import { appOrigin } from "@/lib/site-origin";
export default function robots(): MetadataRoute.Robots {
  return {
    sitemap: `${appOrigin()}/sitemap.xml`,
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/api/",
        "/go/",
        "/login",
        "/cadastro",
        "/recuperar-senha",
        "/redefinir-senha",
        "/demo",
        "/suporte",
        "/pro/",
      ],
    },
  };
}
