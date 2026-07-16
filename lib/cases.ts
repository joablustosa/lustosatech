// Cases de sucesso da Lustosa Tech (estático — sem dependências server).

export interface SuccessCase {
  slug: string;
  name: string;
  url: string; // site do case (link externo)
  sector: string; // exibido como badge
  tagline: string;
  description: string;
  results: string[]; // destaques / entregas
  color: string; // cor de destaque do monograma
}

export const CASES: SuccessCase[] = [
  {
    slug: "reserva-festa",
    name: "Reserva Festa",
    url: "https://reservafesta.com.br/",
    sector: "Eventos · Marketplace",
    tagline:
      "O portal que conecta quem vai dar a festa a casas e fornecedores certificados.",
    description:
      "Portal de divulgação de casas de festas e fornecedores de eventos. Reúne buffets, decoração, música, fotografia, cerimonial e espaços em um só lugar, com fornecedores certificados, painel de gestão para anunciantes e a área 'Minha Festa' para o cliente organizar a celebração de ponta a ponta.",
    results: [
      "Marketplace completo: casas de festas + categorias de fornecedores",
      "Fornecedores certificados com painel de gestão (Gestão PRO)",
      "Área 'Minha Festa' para o cliente planejar tudo em um só lugar",
      "Presença digital que gera leads para o segmento de eventos",
    ],
    color: "#E4405F",
  },
  {
    slug: "plataforma-rodoviaria",
    name: "Plataforma Rodoviária",
    url: "https://www.plataformarodoviaria.com.br/",
    sector: "Transporte Rodoviário · IA-first",
    tagline:
      "O primeiro agente de IA para controlar toda a operação do setor rodoviário.",
    description:
      "Plataforma IA-first para empresas de transporte rodoviário e viagens: um copiloto inteligente que apoia e automatiza a operação de ponta a ponta. Pioneira em levar agentes de IA nativos para o setor, ajudando a otimizar frota, viagens, logística e as decisões do dia a dia.",
    results: [
      "IA nativa dedicada ao setor rodoviário — pioneira no segmento",
      "Copiloto que apoia decisões e automatiza a operação",
      "Controle de ponta a ponta: frota, viagens e logística",
      "Do operacional ao estratégico com apoio de agentes de IA",
    ],
    color: "#1B4F72",
  },
];
