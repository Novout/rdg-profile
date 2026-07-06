export type ChaveAtributo = 'forca' | 'agilidade' | 'resiliência' | 'inconstância' | 'conhecimento' | 'carisma';

export interface Pericia {
  id: string;
  nome: string;
  atributo: ChaveAtributo;
  proficiente: boolean;
}

export interface ItemEquipamento {
  id: string;
  nome: string;
  quantidade: number;
  peso: string;
  observacoes: string;
}

export interface Habilidade {
  id: string;
  nome: string;
  descricao: string;
}

export interface Talento {
  id: string;
  nome: string;
  descricao: string;
}

export interface Nota {
  id: string;
  titulo: string;
  conteudo: string;
}

export interface Ficha {
  id: string;
  criadoEm: number;
  atualizadoEm: number;
  descricao: {
    nome: string;
    jogador: string;
    classe: string;
    subclasse: string;
    raca: string;
    nivel: number;
    antecedente: string;
    alinhamento: string;
    historia: string;
    quebra: string;
  };
  combate: {
    pontosDeVidaMax: number;
    pontosDeVidaAtual: number;
    pontosDeVidaTemp: number;
    classeDeArmadura: number;
    deslocamento: number;
    iniciativaBonus: number;
  };
  atributos: Record<ChaveAtributo, number>;
  salvaguardas: Record<ChaveAtributo, boolean>;
  pericias: Pericia[];
  equipamento: ItemEquipamento[];
  habilidades: Habilidade[];
  talentos: Talento[];
  notas: Nota[];
}

export const ATRIBUTOS_LABEL: Record<ChaveAtributo, string> = {
  forca: 'Força',
  agilidade: 'Agilidade',
  resiliência: 'Resiliência',
  inconstância: 'Inconstância',
  conhecimento: 'Conhecimento',
  carisma: 'Carisma',
};

export const CHAVES_ATRIBUTOS = Object.keys(ATRIBUTOS_LABEL) as ChaveAtributo[];

function periciasPadrao(): Pericia[] {
  const lista: Array<[string, ChaveAtributo]> = [
    ['Atletismo', 'forca'],
    ['Resistência', 'resiliência'],
    ['Queda', 'resiliência'],
    ['Acrobacias', 'agilidade'],
    ['Furtividade', 'agilidade'],
    ['Prestidigitação', 'agilidade'],
    ['Efrium', 'inconstância'],
    ['Novo Mundo', 'inconstância'],
    ['Velho Mundo', 'inconstância'],
    ['Investigação', 'inconstância'],
    ['Natureza', 'inconstância'],
    ['Crença', 'inconstância'],
    ['Pilotagem', 'inconstância'],
    ['Intuição', 'conhecimento'],
    ['Percepção', 'conhecimento'],
    ['Liderança', 'conhecimento'],
    ['Performance', 'carisma'],
    ['Enganação', 'carisma'],
    ['Intimidação', 'carisma'],
    ['Persuasão', 'carisma'],
  ];

  return lista.map(([nome, atributo]) => ({
    id: crypto.randomUUID(),
    nome,
    atributo,
    proficiente: false,
  }));
}

export function criarFicha(): Ficha {
  const agora = Date.now();
  return {
    id: crypto.randomUUID(),
    criadoEm: agora,
    atualizadoEm: agora,
    descricao: {
      nome: '',
      jogador: '',
      classe: '',
      subclasse: '',
      raca: '',
      nivel: 1,
      antecedente: '',
      alinhamento: '',
      historia: '',
      quebra: '',
    },
    combate: {
      pontosDeVidaMax: 10,
      pontosDeVidaAtual: 10,
      pontosDeVidaTemp: 0,
      classeDeArmadura: 10,
      deslocamento: 9,
      iniciativaBonus: 0,
    },
    atributos: {
      forca: -1,
      agilidade: -1,
      resiliência: -1,
      inconstância: -1,
      conhecimento: -1,
      carisma: -1,
    },
    salvaguardas: {
      forca: false,
      agilidade: false,
      resiliência: false,
      inconstância: false,
      conhecimento: false,
      carisma: false,
    },
    pericias: periciasPadrao(),
    equipamento: [],
    habilidades: [],
    talentos: [],
    notas: [],
  };
}

const STORAGE_KEY = 'rdg-profile:fichas';

function normalizarFicha(bruta: any): Ficha {
  const padrao = criarFicha();

  const notasSalvas = Array.isArray(bruta?.notas) ? bruta.notas : [];
  const historiaAntiga: string = typeof bruta?.descricao?.historia === 'string' ? bruta.descricao.historia.trim() : '';
  const notas = notasSalvas.length
    ? notasSalvas
    : historiaAntiga
      ? [{ id: crypto.randomUUID(), titulo: 'História', conteudo: historiaAntiga }]
      : padrao.notas;

  return {
    id: typeof bruta?.id === 'string' ? bruta.id : padrao.id,
    criadoEm: typeof bruta?.criadoEm === 'number' ? bruta.criadoEm : padrao.criadoEm,
    atualizadoEm: typeof bruta?.atualizadoEm === 'number' ? bruta.atualizadoEm : padrao.atualizadoEm,
    descricao: { ...padrao.descricao, ...bruta?.descricao },
    combate: { ...padrao.combate, ...bruta?.combate },
    atributos: { ...padrao.atributos, ...bruta?.atributos },
    salvaguardas: { ...padrao.salvaguardas, ...bruta?.salvaguardas },
    pericias: Array.isArray(bruta?.pericias) && bruta.pericias.length ? bruta.pericias : padrao.pericias,
    equipamento: Array.isArray(bruta?.equipamento) ? bruta.equipamento : [],
    habilidades: Array.isArray(bruta?.habilidades) ? bruta.habilidades : [],
    talentos: Array.isArray(bruta?.talentos) ? bruta.talentos : [],
    notas,
  };
}

export function listarFichas(): Ficha[] {
  try {
    const bruto = localStorage.getItem(STORAGE_KEY);
    if (!bruto) return [];
    const salvo = JSON.parse(bruto);
    if (!Array.isArray(salvo)) return [];
    return salvo.map(normalizarFicha).sort((a, b) => b.atualizadoEm - a.atualizadoEm);
  } catch {
    return [];
  }
}

export function obterFicha(id: string): Ficha | undefined {
  return listarFichas().find((ficha) => ficha.id === id);
}

export function salvarFicha(ficha: Ficha): void {
  const fichas = listarFichas();
  const indice = fichas.findIndex((item) => item.id === ficha.id);
  const atualizada = { ...ficha, atualizadoEm: Date.now() };
  if (indice === -1) {
    fichas.push(atualizada);
  } else {
    fichas[indice] = atualizada;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fichas));
}

export function removerFicha(id: string): void {
  const fichas = listarFichas().filter((ficha) => ficha.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fichas));
}

export function exportarFicha(ficha: Ficha): void {
  const json = JSON.stringify(ficha, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const nome = (ficha.descricao.nome || 'personagem').trim().replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase();
  link.href = url;
  link.download = `ficha-${nome || 'personagem'}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function importarFicha(json: string): Ficha {
  const bruta = JSON.parse(json);
  if (typeof bruta !== 'object' || bruta === null || Array.isArray(bruta)) {
    throw new Error('O arquivo não contém uma ficha válida.');
  }
  const ficha = normalizarFicha(bruta);
  // Evita sobrescrever uma ficha existente com o mesmo id
  if (obterFicha(ficha.id)) {
    ficha.id = crypto.randomUUID();
  }
  ficha.atualizadoEm = Date.now();
  salvarFicha(ficha);
  return ficha;
}
