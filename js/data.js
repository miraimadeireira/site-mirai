// Dados da empresa e do catálogo. Edite aqui textos, contatos e produtos.
export const EMPRESA = {
  nome: 'Madeireira Mirai',
  whatsapp: '5512991862507',
  whatsappExibicao: '(12) 99186-2507',
  telefone: '+551238932432',
  telefoneExibicao: '(12) 3893-2432',
  email: 'contato@madeireiramirai.com.br',
  instagram: 'https://www.instagram.com/miraimadeireira/',
  instagramExibicao: '@miraimadeireira',
  endereco: 'Varadouro, São Sebastião/SP',
  entrega: 'De Caraguatatuba a Boracéia',
  equipe: 'Viviane, Vinicius, Edvaldo, Kayke, Jessica e Anderson',
};

// Linha de decks. `cor` alimenta a textura gerada no simulador 3D.
export const DECKS = [
  {
    id: 'cumaru-boleado',
    nome: 'Cumaru Boleado',
    selo: 'Premium',
    foto: 'deck-cumaru-boleado-card',
    perfil: 'boleado',
    cor: { base: '#8B5A33', escuro: '#4E2E17', claro: '#B37C4B' },
    texto:
      'Bordas arredondadas, confortáveis para pisar descalço. Visual sofisticado e resistente para áreas externas.',
    ficha: [
      ['Madeira', 'Cumaru'],
      ['Acabamento', 'Bordas arredondadas'],
      ['Durabilidade', 'Muito alta'],
      ['Indicação', 'Piscina, varanda e área gourmet'],
    ],
  },
  {
    id: 'cumaru-europeu',
    nome: 'Cumaru Europeu',
    selo: 'Premium',
    foto: 'deck-cumaru-europeu-card',
    perfil: 'reto',
    cor: { base: '#965F37', escuro: '#55321A', claro: '#BC8452' },
    texto:
      'O mesmo cumaru denso e durável, em outro perfil de acabamento. A equipe confirma as medidas disponíveis.',
    ficha: [
      ['Madeira', 'Cumaru'],
      ['Acabamento', 'Perfil europeu'],
      ['Durabilidade', 'Muito alta'],
      ['Indicação', 'Varandas e áreas externas'],
    ],
  },
  {
    id: 'pinus-tratado',
    nome: 'Pinus Tratado',
    selo: 'Mais vendido',
    foto: 'deck-pinus-tratado-card',
    perfil: 'boleado',
    cor: { base: '#C9A469', escuro: '#8C6A38', claro: '#E4C890', nos: true },
    texto:
      'Madeira de reflorestamento tratada, a opção mais em conta da linha. Com verniz marítimo em dia, vai bem no litoral.',
    ficha: [
      ['Madeira', 'Pinus tratado'],
      ['Acabamento', 'Bordas arredondadas'],
      ['Durabilidade', 'Boa, com verniz em dia'],
      ['Indicação', 'Jardim e áreas cobertas'],
    ],
  },
];

export const CATEGORIAS_DESTAQUE = [
  {
    nome: 'Madeiras',
    texto: 'Vigas de maracatiara e garapeira, caibros e tábuas.',
    foto: 'madeiras',
    tipo: 'foto',
  },
  {
    nome: 'Decks',
    texto: 'Cumaru boleado, cumaru europeu e pinus tratado.',
    foto: 'deck-cumaru-europeu-card',
    tipo: 'produto',
  },
  {
    nome: 'Churrasqueiras',
    texto: 'Pré-moldadas: tradicional, lisa, mesclada e gourmet.',
    foto: 'churrasqueira-card',
    tipo: 'produto',
  },
  {
    nome: 'Toras de eucalipto',
    texto: 'Madeira roliça tratada.',
    foto: 'toras',
    tipo: 'foto',
  },
];

export const CATEGORIAS_LISTA = [
  ['Telhados', 'Telhas cerâmicas, tégulas, PVC, fibrocimento e mantas térmicas'],
  ['Pisos e revestimentos', 'Porcelanatos, pisos externos e soleiras'],
  ['Portas e janelas', 'Portas maciças de angelim, curupixá e tauari'],
  ['Construção básica', 'Cimento, areia, brita, tintas, hidráulica e elétrica'],
  ['Acabamento', 'Vernizes, incluindo verniz marítimo'],
  ['Banheiro', 'Louças sanitárias'],
];

export const HISTORIA = [
  ['1972', 'Miraí, MG', 'João Miguel Paiva funda a Mirai na cidade mineira que dá nome à loja.'],
  ['1975', 'São Sebastião', 'O negócio desce a serra e se instala no litoral norte paulista.'],
  ['1998', 'Nova geração', 'Viviane e Valdeir assumem a condução da madeireira.'],
  ['2000', 'Varadouro', 'A loja muda para o endereço atual, no bairro do Varadouro.'],
  ['2011', 'Obra completa', 'Além de madeira, a Mirai passa a vender materiais de construção.'],
];
