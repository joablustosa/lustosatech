import type { MetadataRoute } from "next";

// Gera /robots.txt. Libera explicitamente os robos de scraping do Facebook/Meta
// (facebookexternalhit e facebot), exigidos para a verificacao de dominio e para
// gerar a previa de link (Open Graph). Bloqueia apenas a area administrativa.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "facebookexternalhit", allow: "/" },
      { userAgent: "facebookcatalog", allow: "/" },
      { userAgent: "facebot", allow: "/" },
      { userAgent: "*", allow: "/", disallow: "/admin/" },
    ],
    host: "https://lustosatech.com",
  };
}
