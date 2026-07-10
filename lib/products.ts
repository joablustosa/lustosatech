// Catálogo de produtos da Lustosa Tech (estático — sem dependências server).
// Para adicionar um produto novo, basta incluir um item aqui.

export interface ProductFeature {
  title: string;
  desc: string;
}

export interface Product {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  badge?: string;
  features: ProductFeature[];
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

export const PRODUCTS: Product[] = [
  {
    slug: "lchat",
    name: "LCHAT",
    tagline: "Atendimento e vendas no WhatsApp com I.A.",
    badge: "Atendimento com IA no WhatsApp",
    description:
      "A LCHAT responde qualquer dúvida sobre a sua empresa, entende texto, áudio e imagens, agenda reuniões e entrega um relatório completo da conversa para você fechar a venda.",
    features: [
      {
        title: "Base de conhecimento .md",
        desc: "Importe seus documentos e a IA passa a responder com base neles.",
      },
      {
        title: "Entende áudio e imagens",
        desc: "Transcreve áudios e analisa imagens enviadas pelo cliente.",
      },
      {
        title: "Agendamento de reuniões",
        desc: "A IA identifica interesse e envia o link para o cliente marcar.",
      },
      {
        title: "Relatório da conversa",
        desc: "Resumo com necessidades, objeções e próximos passos para vender.",
      },
    ],
    primaryCta: { label: "Acessar painel", href: "/admin/login" },
    secondaryCta: { label: "Agendar reunião", href: "/agendar" },
  },
];

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
