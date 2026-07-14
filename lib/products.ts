// Catálogo de produtos da Lustosa Tech (estático — sem dependências server).

export interface Plan {
  name: string;
  price: string;
  deadline: string;
  tagline: string;
  items: string[];
  highlight?: boolean;
}

export interface Step {
  title: string;
  desc: string;
}

export interface Platform {
  name: string;
  desc: string;
  color: string; // cor de destaque da marca
  icon: "heart" | "terminal" | "boxes" | "code";
}

export interface Highlight {
  title: string;
  desc: string;
  icon: "code" | "rocket" | "shield" | "wallet" | "refresh";
}

export interface Product {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  badge?: string;
  logo?: string;
  whatsapp: string; // número internacional para o wa.me
  highlights: Highlight[];
  plans: Plan[];
  steps: Step[];
  platforms: Platform[];
  closingNote?: string;
}

export const PRODUCTS: Product[] = [
  {
    slug: "lustosa-build",
    name: "LUSTOSA BUILD",
    tagline: "Seu sistema no ar, do seu jeito",
    badge: "Desenvolvimento de sistemas sob medida",
    logo: "/logo-lbuild.png",
    whatsapp: "5521976701610",
    description:
      "Desenvolvemos seu sistema na plataforma que você escolher — Lovable, Replit, Bubble, ou código puro com Claude Code (React, Next.js, Python). Entregamos o projeto instalado e rodando em produção, no seu domínio, com código-fonte 100% seu e 3 meses de suporte incluso após a instalação. Sem aluguel de software, sem dependência da gente, sem surpresa no boleto.",
    highlights: [
      {
        icon: "code",
        title: "Código-fonte 100% seu",
        desc: "Repositório transferido para você. Sem dependência da gente.",
      },
      {
        icon: "rocket",
        title: "No seu domínio, em produção",
        desc: "Entregamos instalado, testado e rodando de verdade.",
      },
      {
        icon: "shield",
        title: "3 meses de suporte",
        desc: "Correções e ajustes inclusos após a instalação.",
      },
      {
        icon: "wallet",
        title: "Sem aluguel de software",
        desc: "Você paga o desenvolvimento, não uma mensalidade eterna.",
      },
      {
        icon: "refresh",
        title: "Criamos do zero ou finalizamos",
        desc: "Também terminamos apps já iniciados e entregamos funcionais em produção.",
      },
    ],
    plans: [
      {
        name: "Essencial",
        price: "R$ 5.000",
        deadline: "entrega em 7–10 dias",
        tagline: "Pra resolver um problema específico do seu negócio:",
        items: [
          "Sistema de escopo único: agendamento, painel interno, calculadora de orçamento ou portal simples do cliente",
          "Até 5 telas, login básico, 1 integração (WhatsApp, planilha ou pagamento)",
          "Publicado em produção no seu domínio",
          "Código-fonte entregue + repositório transferido",
          "3 meses de suporte pós-instalação (correções e ajustes)",
        ],
      },
      {
        name: "Profissional",
        price: "R$ 10.000",
        deadline: "entrega em 14–21 dias",
        tagline: "Sistema completo pra operação do dia a dia:",
        highlight: true,
        items: [
          "Autenticação com níveis de acesso (admin, equipe, cliente)",
          "Banco de dados estruturado",
          "2–3 integrações (Pix/gateway de pagamento, WhatsApp API, ERP leve)",
          "Painel administrativo + área do usuário",
          "Publicado em produção, código-fonte seu, documentação de uso",
          "3 meses de suporte pós-instalação",
        ],
      },
      {
        name: "Sob Medida",
        price: "a partir de R$ 25.000",
        deadline: "prazo definido no diagnóstico",
        tagline: "Pra quem precisa de algo maior:",
        items: [
          "Escopo desenhado junto com você em diagnóstico técnico",
          "Múltiplas integrações, regras de negócio complexas, volume de usuários",
          "Arquitetura pensada pra escalar",
          "Entrega em produção + handoff completo de código e infraestrutura",
          "3 meses de suporte pós-instalação, com opção de sustentação contínua",
        ],
      },
    ],
    steps: [
      {
        title: "Diagnóstico",
        desc: "Call de 1h: entendemos o problema e você recebe um documento de escopo com preço fechado.",
      },
      {
        title: "Construção",
        desc: "Desenvolvimento com IA + revisão de engenharia. Você acompanha o progresso.",
      },
      {
        title: "Entrega em produção",
        desc: "Sistema no ar, no seu domínio, testado.",
      },
      {
        title: "Handoff",
        desc: "Código-fonte, acessos e documentação transferidos para você.",
      },
      {
        title: "Suporte",
        desc: "3 meses de correções e ajustes inclusos. Depois, sustentação opcional a partir de R$ 500/mês.",
      },
    ],
    platforms: [
      {
        name: "Lovable",
        desc: "Apps web com IA, rápido e visual.",
        color: "#F2495C",
        icon: "heart",
      },
      {
        name: "Replit",
        desc: "Do protótipo à produção no navegador.",
        color: "#F26207",
        icon: "terminal",
      },
      {
        name: "Bubble",
        desc: "No-code poderoso pra apps completos.",
        color: "#1E40FF",
        icon: "boxes",
      },
      {
        name: "Claude Code",
        desc: "Código puro: React, Next.js, Python — controle total.",
        color: "#D97757",
        icon: "code",
      },
    ],
    closingNote:
      "Além de criar do zero, finalizamos apps já iniciados e entregamos funcionais em produção, de acordo com o plano.",
  },
];

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
