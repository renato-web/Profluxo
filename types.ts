export enum UserRole {
  COLLABORATOR = 'Colaborador',
  MANAGER = 'Gestor/Diretor'
}

export enum JobTitle {
  WEB_DESIGNER = 'Web Designer',
  TRAFFIC_MANAGER = 'Gestor(a) de Tráfego',
  JOURNALIST = 'Jornalista',
  MKT_MANAGER = 'Gestor de MKT',
  VIDEO_EDITOR = 'Editor de Vídeo',
  DESIGNER = 'Designer',
  UNDEFINED = 'Não definido'
}

export interface TaskLog {
  id: string;
  date: string;
  user: string;
  role: JobTitle;
  tasks: string[];
  productivityScore: number;
  comments?: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

// Mapeamento específico de tarefas por cargo conforme a realidade do setor
export const TASKS_BY_ROLE: Record<JobTitle, string[]> = {
  [JobTitle.MKT_MANAGER]: [
    "Planejamento estratégico de campanhas",
    "Gestão de equipe e distribuição de demandas",
    "Definição de pautas e processos diários",
    "Análise de relatórios de desempenho (KPIs)",
    "Reunião de alinhamento com diretoria",
    "Aprovação de peças e orçamentos",
    "Monitoramento de concorrência",
    "Gestão de crise e resolução de conflitos"
  ],
  [JobTitle.TRAFFIC_MANAGER]: [
    "Configuração de campanhas (Google Ads/Meta Ads)",
    "Otimização de orçamento e lances (Bidding)",
    "Análise de ROI e conversão",
    "Criação de públicos de remarketing",
    "Relatórios de performance de mídia paga",
    "Implementação de Pixel e API de Conversão",
    "Testes A/B de criativos e copys"
  ],
  [JobTitle.WEB_DESIGNER]: [
    "Criação e manutenção de Landing Pages",
    "Atualização do site institucional UNINTA",
    "Design e codificação de E-mail Marketing",
    "Otimização de UI/UX para conversão",
    "Correção de bugs no front-end",
    "Implementação de tags (GTM)",
    "Suporte técnico web para campanhas"
  ],
  [JobTitle.JOURNALIST]: [
    "Redação de matérias para blog/site",
    "Roteirização de vídeos institucionais/comerciais",
    "Assessoria de imprensa e relacionamento",
    "Revisão ortográfica e gramatical de peças",
    "Cobertura de eventos (fotos/notas)",
    "Planejamento de conteúdo para redes sociais",
    "Endomarketing e comunicados internos"
  ],
  [JobTitle.VIDEO_EDITOR]: [
    "Edição e montagem de vídeos (Premiere/DaVinci)",
    "Motion Graphics e animações 2D (After Effects)",
    "Captação de imagem e som em estúdio/externa",
    "Color Grading e tratamento de áudio",
    "Cortes para formatos verticais (Reels/TikTok/Shorts)",
    "Renderização e exportação de arquivos finais",
    "Gestão de backup de arquivos brutos"
  ],
  [JobTitle.DESIGNER]: [
    "Criação de posts para redes sociais (Feed/Stories)",
    "Desenvolvimento de Key Visual (KV) de campanhas",
    "Diagramação de materiais impressos (Flyers/Cartazes)",
    "Criação de apresentações institucionais",
    "Tratamento e manipulação de imagens",
    "Adaptação de peças para diferentes formatos",
    "Criação de identidade visual e logos"
  ],
  [JobTitle.UNDEFINED]: [
    "Outras atividades administrativas",
    "Reunião geral",
    "Treinamento"
  ]
};