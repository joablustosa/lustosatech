import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") ||
  "https://lustosatech.com";

const SITE_NAME = "Lustosa Tech";
const SITE_TITLE = "Agência de I.A. e Soluções Tech | Lustosa Tech";
const SITE_DESCRIPTION =
  "Agência de Inteligência Artificial e soluções tech: automação no WhatsApp, desenvolvimento sob medida com IA, produtos digitais e notícias de I.A. Código-fonte seu, entrega em produção.";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f5" },
    { media: "(prefers-color-scheme: dark)", color: "#191817" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "technology",
  keywords: [
    "agência de inteligência artificial",
    "soluções tech",
    "automação WhatsApp",
    "desenvolvimento com IA",
    "Lustosa Tech",
    "Lustosa Build",
    "ChatGPT",
    "Claude",
    "Cursor",
    "Lovable",
    "Replit",
    "Next.js",
    "notícias de IA",
  ],
  alternates: {
    canonical: "/",
    languages: { "pt-BR": "/" },
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "200x200" },
      { url: "/logo.png", type: "image/png", sizes: "200x200" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og.png",
        width: 1920,
        height: 1024,
        alt: "Lustosa Tech — Agência de I.A. e soluções tech",
        type: "image/png",
      },
      {
        url: "/logo.png",
        width: 200,
        height: 200,
        alt: "Logo Lustosa Tech",
        type: "image/png",
      },
      {
        url: "/logo-lbuild.png",
        width: 200,
        height: 200,
        alt: "Lustosa Build",
        type: "image/png",
      },
      {
        url: "/lovable.png",
        width: 512,
        height: 512,
        alt: "Lovable",
        type: "image/png",
      },
      {
        url: "/replit.png",
        width: 512,
        height: 512,
        alt: "Replit",
        type: "image/png",
      },
      {
        url: "/cursor.png",
        width: 512,
        height: 512,
        alt: "Cursor",
        type: "image/png",
      },
      {
        url: "/claude.png",
        width: 512,
        height: 512,
        alt: "Claude Code",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: {
      url: "/og.png",
      alt: "Lustosa Tech — Agência de I.A. e soluções tech",
      width: 1920,
      height: 1024,
    },
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    other: {
      "facebook-domain-verification": "3hzjo04pgtmllk6wuq7i369xrm0hmj",
    },
  },
  other: {
    "facebook-domain-verification": "3hzjo04pgtmllk6wuq7i369xrm0hmj",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
        width: 200,
        height: 200,
      },
      image: `${SITE_URL}/og.png`,
      description: SITE_DESCRIPTION,
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "pt-BR",
    },
    {
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}/#service`,
      name: "Agência de I.A. e Soluções Tech",
      url: SITE_URL,
      image: `${SITE_URL}/og.png`,
      description: SITE_DESCRIPTION,
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: "BR",
      serviceType: [
        "Inteligência Artificial",
        "Automação WhatsApp",
        "Desenvolvimento de software",
        "Produtos digitais",
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.theme==='dark'||(!('theme'in localStorage)&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
