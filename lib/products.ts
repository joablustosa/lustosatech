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
  logo?: string;
}

export interface Highlight {
  title: string;
  desc: string;
  icon: "code" | "rocket" | "shield" | "wallet" | "refresh" | "search" | "megaphone" | "calendar" | "bot" | "share";
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
  platformsTitle?: string;
  platformsSubtitle?: string;
  plansNote?: string;
  closingNote?: string;
  closingHeadline?: string;
  closingSubline?: string;
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
      "Desenvolvemos seu sistema na plataforma que você escolher — Lovable, Replit, Cursor, ou código puro com Claude Code (React, Next.js, Python). Entregamos o projeto instalado e rodando em produção, no seu domínio, com código-fonte 100% seu e 3 meses de suporte incluso após a instalação. Sem aluguel de software, sem dependência da gente, sem surpresa no boleto.",
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
    platformsTitle: "Você escolhe a plataforma",
    platformsSubtitle:
      "Construímos na ferramenta que faz mais sentido para o seu projeto.",
    platforms: [
      {
        name: "Lovable",
        desc: "Apps web com IA, rápido e visual.",
        color: "#F2495C",
        logo: "/lovable.png",
      },
      {
        name: "Replit",
        desc: "Do protótipo à produção no navegador.",
        color: "#F26207",
        logo: "/replit.png",
      },
      {
        name: "Cursor",
        desc: "IA de código no editor — desenvolvimento ágil.",
        color: "#8A8A8A",
        logo: "/cursor.png",
      },
      {
        name: "Claude Code",
        desc: "Código puro: React, Next.js, Python — controle total.",
        color: "#D97757",
        logo: "/claude.png",
      },
    ],
    closingNote:
      "Além de criar do zero, finalizamos apps já iniciados e entregamos funcionais em produção, de acordo com o plano.",
    closingHeadline: "Bora tirar seu sistema do papel?",
    closingSubline:
      "Comece pelo diagnóstico — 1h, sem compromisso, com preço fechado ao final.",
  },
  {
    slug: "lt-social-media-agent",
    name: "LT SOCIAL MEDIA STUDIO",
    tagline: "Agentes de IA que operam suas redes sociais",
    badge: "Automação de conteúdo e publicação",
    logo: "/logo.png",
    whatsapp: "5521976701610",
    description:
      "Sistema de agentes de IA para redes sociais: Facebook, Instagram, LinkedIn, YouTube, Kwai e TikTok. Você configura a marca, o tom e as regras — os agentes pesquisam tendências, criam publicações e roteiros e publicam automaticamente nos canais escolhidos. Menos operação manual, mais consistência e presença onde o seu público está.",
    highlights: [
      {
        icon: "bot",
        title: "Agentes por rede social",
        desc: "Cada canal tem um agente alinhado ao formato e ao algoritmo da plataforma.",
      },
      {
        icon: "search",
        title: "Buscas e tendências",
        desc: "Pesquisa automática de temas, hashtags e oportunidades conforme a sua configuração.",
      },
      {
        icon: "megaphone",
        title: "Publicações e roteiros",
        desc: "Gera posts, legendas, carrosséis e roteiros de vídeo no tom da sua marca.",
      },
      {
        icon: "calendar",
        title: "Publicação automática",
        desc: "Agenda e publica nos horários que você definir — com ou sem aprovação humana.",
      },
      {
        icon: "share",
        title: "Multi-rede, uma operação",
        desc: "Facebook, Instagram, LinkedIn, YouTube, Kwai e TikTok no mesmo fluxo.",
      },
      {
        icon: "shield",
        title: "Você no controle",
        desc: "Configure limites, voz da marca, temas proibidos e fluxo de aprovação.",
      },
    ],
    plansNote:
      "Escopo e preço fechados no diagnóstico. Implantação + operação dos agentes.",
    plans: [
      {
        name: "Essencial",
        price: "R$ 1.990/mês",
        deadline: "implantação em 7–10 dias",
        tagline: "Para manter presença constante em poucas redes:",
        items: [
          "Até 2 redes sociais à sua escolha",
          "Agentes de busca e criação de publicações",
          "Calendário editorial + publicação automática",
          "1 tom de voz / marca configurado",
          "Painel simples de acompanhamento e ajustes",
          "Suporte à operação dos agentes",
        ],
      },
      {
        name: "Profissional",
        price: "R$ 3.990/mês",
        deadline: "implantação em 10–14 dias",
        tagline: "Operação completa de conteúdo com IA:",
        highlight: true,
        items: [
          "Até 4 redes sociais",
          "Buscas, posts, legendas e roteiros de vídeo",
          "Fluxo de aprovação opcional antes de publicar",
          "Calendário multi-canal sincronizado",
          "Relatório semanal de publicações e temas",
          "Ajustes de persona e regras inclusos",
        ],
      },
      {
        name: "Sob Medida",
        price: "a partir de R$ 7.990/mês",
        deadline: "prazo definido no diagnóstico",
        tagline: "Para marcas e operações que precisam de escala:",
        items: [
          "Todas as redes: Facebook, Instagram, LinkedIn, YouTube, Kwai e TikTok",
          "Multi-marca ou multi-unidade com agentes separados",
          "Roteiros avançados, séries e campanhas coordenadas",
          "Integrações e regras de negócio personalizadas",
          "SLA e sustentação dedicada",
          "Diagnóstico técnico com escopo e preço fechados",
        ],
      },
    ],
    steps: [
      {
        title: "Diagnóstico de marca e canais",
        desc: "Mapeamos redes, público, tom de voz e o que pode (ou não) ser automatizado.",
      },
      {
        title: "Configuração dos agentes",
        desc: "Definimos buscas, formatos, frequência, aprovação e limites de publicação.",
      },
      {
        title: "Conexão das redes",
        desc: "Integramos as contas oficiais e validamos publicação em ambiente controlado.",
      },
      {
        title: "Operação assistida",
        desc: "Os agentes passam a pesquisar, criar e publicar — você acompanha no painel.",
      },
      {
        title: "Otimização contínua",
        desc: "Ajustamos prompts, calendário e regras com base no desempenho e no seu feedback.",
      },
    ],
    platformsTitle: "Redes sociais atendidas",
    platformsSubtitle:
      "Agentes especializados para cada canal, no formato e no ritmo da plataforma.",
    platforms: [
      {
        name: "Facebook",
        desc: "Posts, carrosséis e engajamento na página.",
        color: "#1877F2",
      },
      {
        name: "Instagram",
        desc: "Feed, Reels e legendas com a cara da marca.",
        color: "#E4405F",
      },
      {
        name: "LinkedIn",
        desc: "Conteúdo profissional e autoridade da empresa.",
        color: "#0A66C2",
      },
      {
        name: "YouTube",
        desc: "Roteiros, títulos e descrições para vídeos.",
        color: "#FF0000",
      },
      {
        name: "Kwai",
        desc: "Vídeos curtos e tendências do app.",
        color: "#FF4906",
      },
      {
        name: "TikTok",
        desc: "Roteiros e publicações no formato vertical.",
        color: "#010101",
      },
    ],
    closingNote:
      "Você configura as regras. Os agentes pesquisam, criam e publicam — com a frequência e o nível de autonomia que fizerem sentido para a sua marca.",
    closingHeadline: "Bora colocar agentes nas suas redes?",
    closingSubline:
      "Comece pelo diagnóstico — 1h, sem compromisso, com escopo e preço fechados ao final.",
  },
];

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
