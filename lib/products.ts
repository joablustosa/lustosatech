// Catálogo de produtos da Lustosa Tech (estático — sem dependências server).

export interface Plan {
  name: string;
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
    slug: "arqia",
    name: "ARQIA",
    tagline: "Sua equipe não vai assistir aula sobre IA. Vai construir com IA.",
    badge: "Programa Corporativo de IA Aplicada",
    logo: "/logo.png",
    whatsapp: "5521976701610",
    description:
      "O ARQIA é um programa corporativo de 6 semanas em que sua equipe não assiste aula: constrói soluções de IA com os dados e os processos da própria empresa. São 12 encontros ao vivo pelo Microsoft Teams (70% mão na massa), um projeto prático em equipe e um Demo Day com premiação. No fim, a diretoria recebe um relatório executivo com engajamento, evolução medida e o ROI estimado de cada projeto. Atacamos de uma vez as três maiores dores do treinamento corporativo de IA no Brasil: baixo engajamento, dificuldade de medir resultado e falta de orientação depois do curso.",
    highlights: [
      {
        icon: "rocket",
        title: "70% mão na massa",
        desc: "No máximo 30% de teoria. O resto é demonstração ao vivo e prática guiada com as ferramentas reais.",
      },
      {
        icon: "megaphone",
        title: "Competição que engaja",
        desc: "Demo Day com banca da liderança e premiação — o motor que resolve o baixo engajamento, a dor nº 1 do mercado.",
      },
      {
        icon: "wallet",
        title: "Resultado que a diretoria vê",
        desc: "Relatório executivo com presença, evolução medida e ROI estimado por projeto. Fim do treinamento que ninguém sabe se funcionou.",
      },
      {
        icon: "refresh",
        title: "A vida continua depois",
        desc: "Plataforma on-demand por 12 meses e mentoria pós-curso — ataca a reclamação de 'sem orientação após o curso'.",
      },
      {
        icon: "bot",
        title: "Do prompt ao agente",
        desc: "A equipe sai construindo prompts profissionais e identificando processos da empresa para automatizar com agentes.",
      },
      {
        icon: "shield",
        title: "Seguro para a empresa",
        desc: "Uso de IA com dados corporativos dentro das regras: segurança e LGPD desde a primeira aula.",
      },
    ],
    plansNote:
      "Turmas de até 25 pessoas para preservar a interação. Escopo e proposta fechados no diagnóstico — fale com a gente no WhatsApp.",
    plans: [
      {
        name: "ARQIA Start",
        deadline: "6 semanas • turma de até 15",
        tagline: "Para pequenas empresas capacitarem o time em IA com resultado mensurável:",
        items: [
          "12 aulas ao vivo pelo Teams (18h) + projeto prático em equipe",
          "Demo Day com banca e premiação ao 1º, 2º e 3º lugares",
          "Plataforma on-demand por 12 meses (aulas, prompts e materiais)",
          "Relatório executivo final com engajamento e evolução medida",
          "Turma única de até 15 colaboradores",
          "Canal de dúvidas no Teams durante as 6 semanas",
        ],
      },
      {
        name: "ARQIA Pro",
        deadline: "6 semanas • turma de até 25",
        tagline: "Para médias empresas que querem transformar IA em vantagem, não só treinar:",
        highlight: true,
        items: [
          "Tudo do Start, com turma de até 25 colaboradores",
          "Diagnóstico com a liderança + 100% dos exemplos com dados e casos da sua empresa",
          "Biblioteca de prompts personalizada por departamento (RH, financeiro, comercial, operações)",
          "3 meses de mentoria pós-curso levando os projetos vencedores à implementação real",
          "Workshop executivo de 2h para a diretoria sobre estratégia de IA",
          "Relatório final expandido com roadmap de implementação",
        ],
      },
      {
        name: "ARQIA Enterprise",
        deadline: "múltiplas turmas • sob diagnóstico",
        tagline: "Para grandes empresas que precisam capacitar muitos times com escala e governança:",
        items: [
          "Múltiplas turmas, simultâneas ou em ondas, para dezenas ou centenas de colaboradores",
          "Tudo do Pro, com customização por área e trilhas por nível de senioridade",
          "Roadmap de implementação de 6 meses e mentoria estendida dos projetos",
          "Gestor de conta dedicado, SLA e acompanhamento executivo periódico",
          "Opção de turmas presenciais e integração com a universidade corporativa",
          "Escopo, cronograma e preço fechados no diagnóstico",
        ],
      },
    ],
    steps: [
      {
        title: "Diagnóstico e kickoff",
        desc: "Alinhamos objetivos com a liderança, aplicamos a avaliação diagnóstica e, no Pro/Enterprise, customizamos os exemplos com casos reais da empresa.",
      },
      {
        title: "Fundamentos que importam",
        desc: "IA generativa na prática, panorama das ferramentas (Claude, ChatGPT, Gemini, Copilot) e uso seguro dos dados da empresa — LGPD.",
      },
      {
        title: "Engenharia de prompt aplicada",
        desc: "Prompts profissionais, técnicas de contexto e iteração, e uma biblioteca de prompts reutilizáveis por área.",
      },
      {
        title: "IA no fluxo de trabalho",
        desc: "Documentos, planilhas e apresentações com IA, análise de dados sem programar e automações do dia a dia.",
      },
      {
        title: "Agentes e projeto prático",
        desc: "O que são agentes, casos por setor e, em equipes de 3 a 5, a construção de uma solução para um problema real — com mentoria ao vivo.",
      },
      {
        title: "Demo Day + relatório executivo",
        desc: "Cada equipe faz o pitch para a banca; 15 dias depois a diretoria recebe o relatório com métricas, projetos e ROI estimado.",
      },
    ],
    platformsTitle: "Ferramentas que sua equipe vai dominar",
    platformsSubtitle:
      "Do primeiro prompt aos agentes — nas plataformas líderes de mercado.",
    platforms: [
      {
        name: "Claude",
        desc: "Raciocínio, escrita e código com a IA da Anthropic.",
        color: "#D97757",
        logo: "/claude.png",
      },
      {
        name: "ChatGPT",
        desc: "O assistente de IA mais usado do mundo, aplicado ao trabalho.",
        color: "#10A37F",
      },
      {
        name: "Gemini",
        desc: "IA do Google integrada a e-mail, documentos e planilhas.",
        color: "#1A73E8",
      },
      {
        name: "Copilot",
        desc: "IA da Microsoft dentro do Office e do Teams.",
        color: "#0078D4",
      },
    ],
    closingNote:
      "Um programa que resolve as três dores que travam o treinamento de IA nas empresas: engajamento (competição com premiação), medição (relatório executivo com ROI) e continuidade (plataforma on-demand + mentoria).",
    closingHeadline: "Sua equipe não vai assistir aula sobre IA. Vai construir com IA.",
    closingSubline:
      "Comece pelo diagnóstico — 1h com a liderança, sem compromisso, com escopo e proposta ao final.",
  },
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
        desc: "3 meses de correções e ajustes inclusos. Depois, sustentação opcional.",
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
  // ===== LT SOCIAL MEDIA STUDIO — DESATIVADO TEMPORARIAMENTE =====
  // Produto retirado do catálogo por ora. Mantido comentado (e não removido)
  // para facilitar a reativação: basta apagar o abre-comentário abaixo e o
  // fecha-comentário logo após o fim deste objeto.
  /*
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
  */
  // ===== fim do bloco desativado =====
  {
    slug: "lustosa-refactor",
    name: "LUSTOSA REFACTOR",
    tagline: "Do legado ao digital — sem big bang",
    badge: "Modernização de sistemas legados",
    logo: "/logo.png",
    whatsapp: "5521976701610",
    description:
      "Pegamos o sistema legado da sua empresa e levamos para stacks atuais, com web + mobile-first. Delphi, VB, desktop, COBOL, PHP antigo, ERP monolítico — o que for. Usamos modernização incremental (padrão strangler): o negócio continua no ar enquanto migramos módulo a módulo, com risco controlado, testes de paridade e cutover sem apagar a luz. Código novo, experiência atual, operação no seu ritmo.",
    highlights: [
      {
        icon: "shield",
        title: "Sem big bang",
        desc: "Migração incremental: legado e novo convivem até o cutover seguro.",
      },
      {
        icon: "rocket",
        title: "Web + mobile-first",
        desc: "Interfaces responsivas, PWA ou app — a experiência que o mercado espera.",
      },
      {
        icon: "code",
        title: "Stack atual",
        desc: "React, Next.js, APIs modernas, cloud — linguagens e práticas de hoje.",
      },
      {
        icon: "refresh",
        title: "Valor a cada fatia",
        desc: "Entrega módulo a módulo: ROI contínuo, sem travar o negócio por anos.",
      },
      {
        icon: "search",
        title: "Diagnóstico antes de codar",
        desc: "Mapa de dependências, riscos, dívida técnica e roadmap priorizado.",
      },
      {
        icon: "wallet",
        title: "Preço por fase",
        desc: "Modelo do mercado: assessment fixo, fatias sob escopo ou squad mensal.",
      },
    ],
    plansNote:
      "Precificação usada por consultorias de modernização: diagnóstico fechado, depois entrega por fatia ou engajamento de squad — sem reescrever tudo de uma vez.",
    plans: [
      {
        name: "Diagnóstico",
        deadline: "2–3 semanas",
        tagline: "Assessment técnico fechado — o padrão do mercado antes de migrar:",
        items: [
          "Inventário do legado, dependências e riscos",
          "Mapa de dívidas técnicas e dados críticos",
          "Arquitetura alvo (web / mobile-first / APIs)",
          "Roadmap por fatias (strangler) com esforço e custo estimado",
          "Documento executivo + apresentação para stakeholders",
          "Crédito do diagnóstico abatido se seguir para Modernização Incremental",
        ],
      },
      {
        name: "Incremental",
        deadline: "4–10 semanas por módulo",
        tagline: "Modernização módulo a módulo — o caminho mais seguro do ramo:",
        highlight: true,
        items: [
          "1 fatia de negócio migrada (ex.: login, pedidos, financeiro)",
          "Camada strangler: legado e novo em paralelo com fallback",
          "UI web mobile-first + APIs na stack atual",
          "Migração de dados com testes de paridade",
          "Cutover gradual, zero downtime planejado",
          "Código-fonte, docs e handoff da fatia",
        ],
      },
      {
        name: "Squad",
        deadline: "ciclo contínuo (mín. 3 meses)",
        tagline: "Time dedicado de modernização — modelo squad das big techs de consultoria:",
        items: [
          "Squad enxuto (produto + engenharia) focado no legado",
          "Backlog priorizado: fatias, APIs, mobile-first, dívida técnica",
          "Releases quinzenais com métricas de progresso da migração",
          "Operação dual controlada até desligar o legado",
          "Sustentação do novo e suporte ao cutover",
          "Escopo e capacidade definidos no kickoff pós-diagnóstico",
        ],
      },
    ],
    steps: [
      {
        title: "Assessment",
        desc: "Entendemos o legado, os riscos e o que gera mais valor migrar primeiro — com preço e roadmap claros.",
      },
      {
        title: "Arquitetura alvo",
        desc: "Definimos stack web/mobile-first, APIs, dados e a camada que permite legado e novo coexistirem.",
      },
      {
        title: "Primeira fatia",
        desc: "Modernizamos um módulo de ponta a ponta, validamos paridade e publicamos em produção com fallback.",
      },
      {
        title: "Migração incremental",
        desc: "Repetimos fatia a fatia: tráfego migra, o legado encolhe, o negócio não para.",
      },
      {
        title: "Cutover e descomissionamento",
        desc: "Desligamos o que sobrou do legado, documentamos e transferimos operação para o seu time.",
      },
    ],
    platformsTitle: "Do legado para stacks atuais",
    platformsSubtitle:
      "Linguagens e formatos antigos viram web responsiva, mobile-first e APIs modernas — no ritmo da sua operação.",
    platforms: [
      {
        name: "Delphi / VB",
        desc: "→ Web, PWA e APIs REST/GraphQL.",
        color: "#ED1C24",
      },
      {
        name: "Desktop / WinForms",
        desc: "→ Mobile-first e experiência multi-dispositivo.",
        color: "#0078D4",
      },
      {
        name: "PHP / Java legado",
        desc: "→ Next.js, Node, .NET ou Python atuais.",
        color: "#777BB4",
      },
      {
        name: "Monólito / ERP",
        desc: "→ Módulos, APIs e front moderno por fatia.",
        color: "#405A8C",
      },
      {
        name: "Mainframe / COBOL",
        desc: "→ Fachada + serviços novos, cutover gradual.",
        color: "#1B4F72",
      },
      {
        name: "Mobile nativo antigo",
        desc: "→ React Native, Flutter ou PWA unificada.",
        color: "#61DAFB",
      },
    ],
    closingNote:
      "Não reescrevemos tudo de uma vez. Diagnosticamos, priorizamos e modernizamos por fatias — o mesmo método usado pelas melhores empresas de modernização de legado.",
    closingHeadline: "Seu legado não precisa travar o futuro.",
    closingSubline:
      "Comece pelo Diagnóstico — assessment fechado, roadmap claro e próximo passo com preço definido.",
  },
];

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
