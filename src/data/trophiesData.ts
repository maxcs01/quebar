export interface Trophy {
  id: string;
  title: string;
  requirement: string;
  message: string;
  category: 'oracao' | 'ofensivas' | 'leitura';
  emoji: string;
  requirementValue: number;
}

export const NEW_TROPHIES: Trophy[] = [
  // --- CATEGORIA 1: TEMPO DE ORAÇÃO ---
  {
    id: 'tr-oracao-1',
    title: 'A Primeira Semente',
    requirement: 'Registrar pelo menos 1 minuto de oração.',
    message: 'Você deu o primeiro passo! Toda grande jornada de fé começa com um simples momento de conexão.',
    category: 'oracao',
    emoji: '🌱',
    requirementValue: 1
  },
  {
    id: 'tr-oracao-2',
    title: 'Coração Desperto',
    requirement: 'Atingir 5 minutos de oração contínua em uma única sessão.',
    message: 'Seu coração está despertando para a presença d\'Ele. Excelente dedicação!',
    category: 'oracao',
    emoji: '🌅',
    requirementValue: 5
  },
  {
    id: 'tr-oracao-3',
    title: 'O Quarto Secreto',
    requirement: 'Atingir 10 minutos de oração em uma única sessão.',
    message: 'Você entrou no seu quarto secreto e fechou a porta (Mateus 6:6). Um tempo precioso de intimidade.',
    category: 'oracao',
    emoji: '🗝️',
    requirementValue: 10
  },
  {
    id: 'tr-oracao-4',
    title: 'Fogo no Altar',
    requirement: 'Atingir 15 minutos de oração contínua.',
    message: 'O fogo no seu altar está aceso e crescendo. Continue alimentando essa chama.',
    category: 'oracao',
    emoji: '🔥',
    requirementValue: 15
  },
  {
    id: 'tr-oracao-5',
    title: 'Vigília Breve',
    requirement: 'Completar 30 minutos em uma única sessão de oração.',
    message: 'Meia hora na presença de Deus! Sua concentração e foco espiritual estão se fortalecendo.',
    category: 'oracao',
    emoji: '⏳',
    requirementValue: 30
  },
  {
    id: 'tr-oracao-6',
    title: 'Uma Hora com o Mestre',
    requirement: 'Orar por 60 minutos ininterruptos.',
    message: 'Você vigiou por uma hora (Marcos 14:37). Uma conquista incrível de profunda devoção.',
    category: 'oracao',
    emoji: '👑',
    requirementValue: 60
  },
  {
    id: 'tr-oracao-7',
    title: 'Atleta do Espírito',
    requirement: 'Acumular 2 horas de oração somadas em um único dia (24h).',
    message: 'Um verdadeiro atleta da fé! Seu dia foi marcado por uma busca intensa e incansável.',
    category: 'oracao',
    emoji: '🛡️',
    requirementValue: 120
  },
  {
    id: 'tr-oracao-8',
    title: 'Incenso Suave',
    requirement: 'Acumular 2 horas totais de oração no histórico geral do perfil.',
    message: 'Suas orações sobem como incenso. Você já acumulou 2 horas de conversa com o Criador.',
    category: 'oracao',
    emoji: '💨',
    requirementValue: 120
  },
  {
    id: 'tr-oracao-9',
    title: 'Comunhão Crescente',
    requirement: 'Acumular 5 horas totais de oração no histórico geral.',
    message: 'A comunhão tornou-se seu estilo de vida. São 5 horas investidas na eternidade.',
    category: 'oracao',
    emoji: '🌈',
    requirementValue: 300
  },
  {
    id: 'tr-oracao-10',
    title: 'Vida de Intercessão',
    requirement: 'Acumular 10 horas totais de oração no histórico geral.',
    message: 'A intercessão flui em você. Dez horas registradas mostram um coração voltado para o céu.',
    category: 'oracao',
    emoji: '🕯️',
    requirementValue: 600
  },
  {
    id: 'tr-oracao-11',
    title: 'Fôlego de Vida',
    requirement: 'Acumular 24 horas totais de oração no histórico geral.',
    message: 'Incrível! Você completou o equivalente a um dia inteiro ininterrupto de oração.',
    category: 'oracao',
    emoji: '🕊️',
    requirementValue: 1440
  },
  {
    id: 'tr-oracao-12',
    title: 'Muralha de Fogo',
    requirement: 'Acumular 50 horas totais de oração no histórico geral.',
    message: 'Você construiu uma verdadeira muralha de oração. Cinquenta horas de fé pura!',
    category: 'oracao',
    emoji: '🏰',
    requirementValue: 3000
  },
  {
    id: 'tr-oracao-13',
    title: 'Amigo Íntimo',
    requirement: 'Acumular 100 horas totais de oração no histórico geral.',
    message: 'Um marco histórico. Cem horas na presença revelam que você se tornou um amigo íntimo de Deus.',
    category: 'oracao',
    emoji: '💎',
    requirementValue: 6000
  },
  {
    id: 'tr-oracao-14',
    title: 'Sem Cessar',
    requirement: 'Registrar 3 momentos separados de oração em turnos diferentes no mesmo dia.',
    message: 'Orando sem cessar! (1 Tessalonicenses 5:17). Você manteve a conexão o dia todo.',
    category: 'oracao',
    emoji: '♾️',
    requirementValue: 3
  },
  {
    id: 'tr-oracao-15',
    title: 'Madrugada com Deus',
    requirement: 'Registrar uma sessão de oração iniciada entre 3h e 5h da manhã.',
    message: 'De madrugada O buscarei! Você sacrificou seu sono para um encontro na quietude.',
    category: 'oracao',
    emoji: '🌌',
    requirementValue: 1
  },
  {
    id: 'tr-oracao-16',
    title: 'Pausa para o Alto',
    requirement: 'Registrar uma sessão de oração iniciada entre 12h e 14h.',
    message: 'No meio da correria do dia, você escolheu pausar para se alimentar do que é eterno.',
    category: 'oracao',
    emoji: '☀️',
    requirementValue: 1
  },
  {
    id: 'tr-oracao-17',
    title: 'Guardião da Noite',
    requirement: 'Registrar uma sessão de oração iniciada após as 23h.',
    message: 'Fechando o dia com a melhor companhia. Você é um guardião que vigia antes do descanso.',
    category: 'oracao',
    emoji: '🌟',
    requirementValue: 1
  },

  // --- CATEGORIA 2: DIAS CONSECUTIVOS (OFENSIVAS) ---
  {
    id: 'tr-ofensivas-18',
    title: 'Primeiro Passo',
    requirement: 'Completar 1 dia com registro de oração.',
    message: 'O hábito começou! Você plantou a semente da constância hoje.',
    category: 'ofensivas',
    emoji: '🚶',
    requirementValue: 1
  },
  {
    id: 'tr-ofensivas-19',
    title: 'Três Dias de Luz',
    requirement: 'Manter uma ofensiva de 3 dias seguidos com oração registrada.',
    message: 'Três dias seguidos! O ritmo está se formando, continue firme.',
    category: 'ofensivas',
    emoji: '⚡',
    requirementValue: 3
  },
  {
    id: 'tr-ofensivas-20',
    title: 'Firme no Propósito',
    requirement: 'Manter uma ofensiva de 5 dias seguidos.',
    message: 'Quase uma semana completa de fidelidade. Seu propósito está ganhando raízes fortes!',
    category: 'ofensivas',
    emoji: '⚓',
    requirementValue: 5
  },
  {
    id: 'tr-ofensivas-21',
    title: 'Constância',
    requirement: 'Manter uma ofensiva de 7 dias seguidos.',
    message: 'Uma semana inteira sem falhar! A constância está transformando a sua rotina.',
    category: 'ofensivas',
    emoji: '🗓️',
    requirementValue: 7
  },
  {
    id: 'tr-ofensivas-22',
    title: 'Dezena da Vitória',
    requirement: 'Manter uma ofensiva de 10 dias seguidos.',
    message: 'Dois dígitos de vitória! Dez dias seguidos colocando o Reino em primeiro lugar.',
    category: 'ofensivas',
    emoji: '🎖️',
    requirementValue: 10
  },
  {
    id: 'tr-ofensivas-23',
    title: 'Quinzena de Fogo',
    requirement: 'Manter uma ofensiva de 15 dias seguidos.',
    message: 'Quinze dias ininterruptos. Metade de um mês vivendo diariamente na presença.',
    category: 'ofensivas',
    emoji: '🌋',
    requirementValue: 15
  },
  {
    id: 'tr-ofensivas-24',
    title: 'O Novo Hábito',
    requirement: 'Manter uma ofensiva de 21 dias seguidos.',
    message: 'Especialistas dizem que 21 dias formam um hábito. Você provou que a oração já faz parte de quem você é!',
    category: 'ofensivas',
    emoji: '🍃',
    requirementValue: 21
  },
  {
    id: 'tr-ofensivas-25',
    title: 'Mês de Graça',
    requirement: 'Manter uma ofensiva de 30 dias seguidos.',
    message: 'Um mês inteiro de fidelidade diária. Sua disciplina é um testemunho vivo.',
    category: 'ofensivas',
    emoji: '💝',
    requirementValue: 30
  },
  {
    id: 'tr-ofensivas-26',
    title: 'A Quarentena',
    requirement: 'Manter uma ofensiva de 40 dias seguidos.',
    message: 'Quarenta dias de perseverança, um número de transformação bíblica (Lucas 4:2).',
    category: 'ofensivas',
    emoji: '⛰️',
    requirementValue: 40
  },
  {
    id: 'tr-ofensivas-27',
    title: 'Jubileu de Oração',
    requirement: 'Manter uma ofensiva de 50 dias seguidos.',
    message: 'Cinquenta dias de vitória contínua! Um marco de verdadeira maturidade espiritual.',
    category: 'ofensivas',
    emoji: '🎷',
    requirementValue: 50
  },
  {
    id: 'tr-ofensivas-28',
    title: 'Estação de Fé',
    requirement: 'Manter uma ofensiva de 90 dias seguidos.',
    message: 'Uma estação inteira (três meses) sem quebrar a corrente. Sua fé floresceu.',
    category: 'ofensivas',
    emoji: '🌳',
    requirementValue: 90
  },
  {
    id: 'tr-ofensivas-29',
    title: 'Cem Dias no Altar',
    requirement: 'Manter uma ofensiva de 100 dias seguidos.',
    message: '100 dias ininterruptos! Um monumento erguido pela sua devoção diária.',
    category: 'ofensivas',
    emoji: '💯',
    requirementValue: 100
  },
  {
    id: 'tr-ofensivas-30',
    title: 'Semestre em Comunhão',
    requirement: 'Manter uma ofensiva de 180 dias seguidos.',
    message: 'Meio ano de consistência impecável. A oração agora é tão natural quanto respirar.',
    category: 'ofensivas',
    emoji: '⛪',
    requirementValue: 180
  },
  {
    id: 'tr-ofensivas-31',
    title: 'Um Ano de Fidelidade',
    requirement: 'Manter uma ofensiva de 365 dias seguidos.',
    message: '365 dias! Você completou um ano inteiro de conversas diárias ininterruptas com o Pai.',
    category: 'ofensivas',
    emoji: '🔔',
    requirementValue: 365
  },
  {
    id: 'tr-ofensivas-32',
    title: 'Resiliência',
    requirement: 'Retomar o hábito por 3 dias consecutivos imediatamente após ter perdido uma ofensiva de 7 dias ou mais.',
    message: 'Cair é humano, levantar é divino. Você não desistiu e retomou com força total!',
    category: 'ofensivas',
    emoji: '🛡️',
    requirementValue: 3
  },
  {
    id: 'tr-ofensivas-33',
    title: 'Guerreiro de Fim de Semana',
    requirement: 'Registrar atividade nos sábados e domingos durante 4 fins de semana consecutivos.',
    message: 'Nem o merecido descanso diminui o seu ritmo. Sua devoção não tira férias!',
    category: 'ofensivas',
    emoji: '🪁',
    requirementValue: 4
  },
  {
    id: 'tr-ofensivas-34',
    title: 'Inabalável',
    requirement: 'Manter uma ofensiva de 500 dias seguidos.',
    message: 'Uma fortaleza inabalável! Você ultrapassou a marca de 500 dias de compromisso absoluto.',
    category: 'ofensivas',
    emoji: '⛰️',
    requirementValue: 500
  },

  // --- CATEGORIA 3: TEMPO DE LEITURA BÍBLICA ---
  {
    id: 'tr-leitura-35',
    title: 'Luz para o Caminho',
    requirement: 'Completar 5 minutos de leitura no app.',
    message: 'Você acendeu a lâmpada que guiará os seus passos hoje (Salmos 119:105).',
    category: 'leitura',
    emoji: '💡',
    requirementValue: 5
  },
  {
    id: 'tr-leitura-36',
    title: 'O Pão Diário',
    requirement: 'Completar 10 minutos de leitura em uma única sessão.',
    message: 'Você recolheu o seu maná de hoje. Alimentação e força garantidas!',
    category: 'leitura',
    emoji: '🍞',
    requirementValue: 10
  },
  {
    id: 'tr-leitura-37',
    title: 'Mergulho na Palavra',
    requirement: 'Completar 20 minutos de leitura contínua.',
    message: 'Indo para águas mais profundas! Vinte minutos imerso na sabedoria milenar.',
    category: 'leitura',
    emoji: '🌊',
    requirementValue: 20
  },
  {
    id: 'tr-leitura-38',
    title: 'Mente Renovada',
    requirement: 'Completar 30 minutos de leitura em uma única sessão.',
    message: 'Meia hora meditando na Palavra. Sua mente está sendo lavada e alinhada com a Verdade.',
    category: 'leitura',
    emoji: '🧠',
    requirementValue: 30
  },
  {
    id: 'tr-leitura-39',
    title: 'Fome e Sede',
    requirement: 'Acumular 1 hora de leitura bíblica dentro do mesmo dia (24h).',
    message: 'Bem-aventurados os que têm fome e sede! Você buscou as Escrituras com intensidade hoje.',
    category: 'leitura',
    emoji: '🍯',
    requirementValue: 60
  },
  {
    id: 'tr-leitura-40',
    title: 'Semeador',
    requirement: 'Acumular 5 horas totais de leitura bíblica no histórico geral.',
    message: 'Você está plantando a boa semente no coração. São 5 horas de edificação acumulada.',
    category: 'leitura',
    emoji: '🌾',
    requirementValue: 300
  },
  {
    id: 'tr-leitura-41',
    title: 'Raízes Profundas',
    requirement: 'Acumular 10 horas totais de leitura no histórico geral.',
    message: 'Árvore plantada junto a ribeiros de águas! Suas raízes nas Escrituras estão ganhando profundidade.',
    category: 'leitura',
    emoji: '🌳',
    requirementValue: 600
  },
  {
    id: 'tr-leitura-42',
    title: 'Escavador de Tesouros',
    requirement: 'Acumular 24 horas totais de leitura no histórico geral.',
    message: 'Você tem buscado a sabedoria como a tesouros escondidos (Provérbios 2:4). Um dia inteiro de leitura!',
    category: 'leitura',
    emoji: '🪙',
    requirementValue: 1440
  },
  {
    id: 'tr-leitura-43',
    title: 'Amante da Lei',
    requirement: 'Acumular 50 horas totais de leitura no histórico geral.',
    message: 'Oh, como amo a tua lei! (Salmos 119:97). Cinquenta horas dedicadas ao livro dos livros.',
    category: 'leitura',
    emoji: '📜',
    requirementValue: 3000
  },
  {
    id: 'tr-leitura-44',
    title: 'Maná Escondido',
    requirement: 'Acumular 100 horas totais de leitura no histórico geral.',
    message: 'Cem horas de revelações! Você está construindo uma bagagem espiritual inestimável.',
    category: 'leitura',
    emoji: '✨',
    requirementValue: 6000
  },
  {
    id: 'tr-leitura-45',
    title: 'Construtor sobre a Rocha',
    requirement: 'Acumular 200 horas totais de leitura no histórico geral.',
    message: 'Edificando a casa sobre a rocha (Mateus 7:24). Sua fundação é inabalável com 200 horas de estudo!',
    category: 'leitura',
    emoji: '🪨',
    requirementValue: 12000
  },
  {
    id: 'tr-leitura-46',
    title: 'Leitor Noturno',
    requirement: 'Iniciar uma sessão de leitura bíblica após as 22h.',
    message: 'Terminando o dia com a melhor influência possível para a sua mente e coração.',
    category: 'leitura',
    emoji: '🦉',
    requirementValue: 1
  },
  {
    id: 'tr-leitura-47',
    title: 'Primeiros Frutos',
    requirement: 'Iniciar uma sessão de leitura bíblica antes das 8h da manhã.',
    message: 'Entregando os primeiros minutos do seu dia para alinhar seus pensamentos aos d\'Ele.',
    category: 'leitura',
    emoji: '☀️',
    requirementValue: 1
  },
  {
    id: 'tr-leitura-48',
    title: 'De Dia e de Noite',
    requirement: 'Registrar leitura bíblica no período da manhã e também à noite no mesmo dia.',
    message: 'Meditando na lei de dia e de noite (Salmos 1:2). Dia totalmente blindado!',
    category: 'leitura',
    emoji: '🌓',
    requirementValue: 1
  },
  {
    id: 'tr-leitura-49',
    title: 'A Espada Afiada',
    requirement: 'Manter 7 dias consecutivos com pelo menos 1 minuto de leitura bíblica registrada.',
    message: 'Sua espada do Espírito está cada vez mais afiada (Hebreus 4:12). Uma semana inteira na Palavra.',
    category: 'leitura',
    emoji: '⚔️',
    requirementValue: 7
  },
  {
    id: 'tr-leitura-50',
    title: 'Mestre do Pergaminho',
    requirement: 'Manter 30 dias consecutivos em que a meta diária de leitura bíblica foi atingida.',
    message: 'Disciplina de mestre! Um mês inteiro focado em conhecer mais a Deus através das letras sagradas.',
    category: 'leitura',
    emoji: '👑',
    requirementValue: 30
  }
];
