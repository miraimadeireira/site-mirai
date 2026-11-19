// Estado, controles, cálculo de material e ações do simulador (sem 3D).
import { CONFIG, PADRAO } from './config.js';
import { DECKS, EMPRESA } from './data.js';
import { linkWhatsApp, track } from './whatsapp.js';
import { texturaMadeira } from './textura.js';
import { $, formatar, limitar, avisar, anunciar } from './util.js';

const CHAVE = 'mirai-simulador-v3';
const CAMPOS = [
  // chave, input número, input faixa, rótulo
  ['w', 'iw', 'rw', 'Largura'],
  ['l', 'il', 'rl', 'Profundidade'],
  ['h', 'ih', 'rh', 'Altura'],
];

const MODELOS = [
  {
    nome: 'Varanda 3 × 2',
    p: { w: 3, l: 2, h: 0.15, sp: 'pinus-tratado', step: false, rail: false },
  },
  {
    nome: 'Área gourmet 5 × 3,5',
    p: { w: 5, l: 3.5, h: 0.3, sp: 'cumaru-europeu', step: true, rail: false },
  },
  {
    nome: 'Piscina 6 × 4',
    p: { w: 6, l: 4, h: 0.1, sp: 'cumaru-boleado', dir: 'per', step: false, rail: false },
  },
  {
    nome: 'Mirante 4 × 3',
    p: { w: 4, l: 3, h: 0.9, sp: 'cumaru-europeu', step: true, rail: true },
  },
];

export const deckPorId = (id) => DECKS.find((d) => d.id === id) || DECKS[0];

// Desenho do perfil da tábua (corte), com a espessura exagerada para o arredondado aparecer
function perfilSvg(raio) {
  const W = 50;
  const H = 16;
  const x = 3;
  const y = 3;
  const r = Math.max(1, Math.min(H * 0.48, (raio / CONFIG.espessuraTabua) * H));
  const d = `M${x} ${y + H}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}H${x + W - r}A${r} ${r} 0 0 1 ${x + W} ${y + r}V${y + H}Z`;
  return `<svg class="perfil" viewBox="0 0 56 22" aria-hidden="true"><path d="${d}"/></svg>`;
}

function normalizar(s) {
  for (const [k, [min, max]] of Object.entries(CONFIG.limites)) {
    const v = Number(s[k]);
    s[k] = Math.round(limitar(Number.isFinite(v) ? v : PADRAO[k], min, max) * 100) / 100;
  }
  s.gap = Math.round(limitar(Number(s.gap) || PADRAO.gap, CONFIG.junta.min, CONFIG.junta.max));
  const larguras = CONFIG.largurasTabua;
  const bw = Number(s.bw);
  s.bw = larguras.reduce((a, b) => (Math.abs(b - bw) < Math.abs(a - bw) ? b : a), larguras[0]);
  if (!DECKS.some((d) => d.id === s.sp)) s.sp = PADRAO.sp;
  if (s.dir !== 'par' && s.dir !== 'per') s.dir = PADRAO.dir;
  s.step = !!s.step;
  s.rail = !!s.rail;
  s.frame = !!s.frame;
  return s;
}

// ---------- link compartilhável ----------
function paraHash(s) {
  const p = new URLSearchParams({
    w: s.w,
    l: s.l,
    h: s.h,
    m: s.sp,
    t: Math.round(s.bw * 100),
    j: s.gap,
    d: s.dir,
    g: s.step ? 1 : 0,
    c: s.rail ? 1 : 0,
  });
  return '#' + p.toString();
}

function lerHash() {
  const h = location.hash.slice(1);
  if (!h.includes('=')) return null;
  const p = new URLSearchParams(h);
  if (!p.has('w')) return null;
  return {
    w: p.get('w'),
    l: p.get('l'),
    h: p.get('h'),
    sp: p.get('m'),
    bw: Number(p.get('t')) / 100,
    gap: p.get('j'),
    dir: p.get('d'),
    step: p.get('g') === '1',
    rail: p.get('c') === '1',
  };
}

// ---------- cálculo ----------
export function calcular(s) {
  const par = s.dir === 'par';
  const R = par ? s.w : s.l; // comprimento das tábuas
  const Sp = par ? s.l : s.w; // vão coberto pelas tábuas
  const g = s.gap / 1000;
  const tabuas = Math.ceil((Sp + g) / (s.bw + g) - 1e-9);
  const metros = tabuas * R * (1 + CONFIG.perdaPercentual / 100);
  const barrotes = Math.ceil(R / CONFIG.espacamentoBarrotes - 1e-9) + 1;
  const parafusos = tabuas * barrotes * CONFIG.parafusosPorCruzamento;
  const pilares =
    s.h >= CONFIG.alturaMinimaPilares
      ? (Math.ceil(R / CONFIG.espacamentoPilares - 1e-9) + 1) *
        (Math.ceil(Sp / CONFIG.espacamentoPilares - 1e-9) + 1)
      : 0;
  const degraus = degrausDe(s);
  const larguraDegrau = Math.min(s.w, CONFIG.larguraMaximaDegrau);
  const guarda = s.rail ? s.w - (degraus ? larguraDegrau : 0) + 2 * s.l : 0;
  return {
    R,
    Sp,
    tabuas,
    metros,
    barrotes,
    parafusos,
    pilares,
    degraus,
    larguraDegrau,
    guarda,
    area: s.w * s.l,
  };
}

export function degrausDe(s) {
  if (!s.step || s.h < CONFIG.alturaMinimaDegraus) return 0;
  return Math.max(1, Math.round(s.h / CONFIG.alturaDegrau) - 1);
}

function linhasMaterial(s, c) {
  const linhas = [
    [`Tábuas de ${Math.round(s.bw * 100)} cm`, `${c.tabuas} × ${formatar(c.R)} m`],
    ['Total de tábua com perda', `${formatar(c.metros, 1)} m`],
    ['Barrotes', `${c.barrotes} × ${formatar(c.Sp)} m`],
    ['Parafusos inox', `${c.parafusos} un.`],
    ['Pilares', c.pilares ? `${c.pilares} un.` : 'Apoio no contrapiso'],
  ];
  if (c.degraus) linhas.push(['Degraus', `${c.degraus} × ${formatar(c.larguraDegrau)} m`]);
  if (s.rail) linhas.push(['Guarda-corpo', `${formatar(c.guarda, 1)} m`]);
  return linhas;
}

function mensagem(s, c) {
  const deck = deckPorId(s.sp);
  return [
    'Olá, Mirai! Simulei um deck no site e gostaria de um orçamento:',
    `• Medidas: ${formatar(s.w)} × ${formatar(s.l)} m (${formatar(c.area)} m²), ${Math.round(s.h * 100)} cm de altura`,
    `• Deck: ${deck.nome}, tábuas de ${Math.round(s.bw * 100)} cm, junta de ${s.gap} mm, ${s.dir === 'par' ? 'paralelas à parede' : 'saindo da parede'}`,
    `• ${c.degraus ? c.degraus + ' degrau(s)' : 'Sem degraus'}, ${s.rail ? 'com guarda-corpo' : 'sem guarda-corpo'}`,
    `• Estimativa: ${c.tabuas} tábuas de ${formatar(c.R)} m (${formatar(c.metros, 1)} m com perda), ${c.barrotes} barrotes de ${formatar(c.Sp)} m${c.pilares ? `, ${c.pilares} pilares` : ''}`,
    `Configuração: ${location.origin}${location.pathname}${paraHash(s)}`,
  ].join('\n');
}

// ---------- montagem da interface ----------
export function criarSimulador() {
  const doHash = lerHash();
  let salvo = null;
  try {
    salvo = JSON.parse(localStorage.getItem(CHAVE) || 'null');
  } catch {
    salvo = null;
  }
  const S = normalizar({ ...PADRAO, ...(doHash || salvo || {}) });
  const historico = [];
  let ultimoRegistro = 0;
  const ouvintes = [];

  // opções de deck com miniatura da textura
  $('opcoesDeck').innerHTML = DECKS.map((d, i) => {
    const mini = texturaMadeira(d.cor, i + 3, 160, 160).toDataURL('image/jpeg', 0.85);
    const acabamento = (d.ficha.find(([k]) => k === 'Acabamento') || [])[1] || '';
    return `<label class="opcao-deck"><input class="oculto" type="radio" name="sp" value="${d.id}"><i style="background-image:url(${mini})"></i><span>${d.nome}<small>${acabamento}</small></span>${perfilSvg(d.raioBorda)}</label>`;
  }).join('');

  $('segLargura').innerHTML = CONFIG.largurasTabua
    .map(
      (v) =>
        `<label><input class="oculto" type="radio" name="bw" value="${v}"><span>${Math.round(v * 100)} cm</span></label>`,
    )
    .join('');

  $('modelos').innerHTML = MODELOS.map(
    (m, i) =>
      `<button type="button" data-i="${i}" data-track="simulador_modelo">${m.nome}</button>`,
  ).join('');

  for (const [k, ni, ri] of CAMPOS) {
    const [min, max] = CONFIG.limites[k];
    for (const id of [ni, ri]) {
      $(id).min = min;
      $(id).max = max;
    }
    $('lim-' + k).innerHTML = `<span>${formatar(min)} m</span><span>${formatar(max)} m</span>`;
  }
  $('rg').min = CONFIG.junta.min;
  $('rg').max = CONFIG.junta.max;

  function sincronizar(origem) {
    for (const [k, ni, ri] of CAMPOS) {
      if (origem !== ni) {
        $(ni).value = S[k].toFixed(2);
        $(ni).closest('.entrada').dataset.invalido = 'false';
        $(ni).setAttribute('aria-invalid', 'false');
        $('erro-' + k).textContent = '';
      }
      if (origem !== ri) $(ri).value = S[k];
    }
    document.querySelectorAll('input[name=sp]').forEach((r) => (r.checked = r.value === S.sp));
    document
      .querySelectorAll('input[name=bw]')
      .forEach((r) => (r.checked = Math.abs(+r.value - S.bw) < 1e-6));
    document.querySelectorAll('input[name=dir]').forEach((r) => (r.checked = r.value === S.dir));
    $('rg').value = S.gap;
    $('og').textContent = `${S.gap} mm`;
    $('tStep').checked = S.step;
    $('tRail').checked = S.rail;
    $('tFrame').checked = S.frame;
  }

  function exibir() {
    const c = calcular(S);
    const deck = deckPorId(S.sp);
    $('sArea').textContent = `${formatar(c.area)} m²`;
    $('sSub').textContent =
      `${formatar(S.w)} × ${formatar(S.l)} m · ${deck.nome} · ${Math.round(S.h * 100)} cm de altura`;
    $('sLista').innerHTML = linhasMaterial(S, c)
      .map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`)
      .join('');
    $('waSim').href = linkWhatsApp(mensagem(S, c));
    $('sNota').textContent =
      `Estimativa com ${CONFIG.perdaPercentual}% de perda nas tábuas, barrotes a cada ${Math.round(CONFIG.espacamentoBarrotes * 100)} cm e pilares a cada ${formatar(CONFIG.espacamentoPilares, 1)} m. A lista final é conferida pela equipe da Mirai.`;
  }

  function salvar() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(S));
    } catch {
      /* armazenamento indisponível */
    }
  }

  function botoes() {
    $('bDesfazer').disabled = historico.length === 0;
  }

  function notificar(origem) {
    exibir();
    salvar();
    botoes();
    ouvintes.forEach((f) => f(S, origem));
  }

  function definir(patch, origem, registrar = true) {
    const antes = { ...S };
    Object.assign(S, patch);
    normalizar(S);
    const mudou = Object.keys(S).some((k) => S[k] !== antes[k]);
    sincronizar(origem);
    if (!mudou) return;
    if (registrar) {
      const agora = performance.now();
      if (agora - ultimoRegistro > 700) {
        historico.push(antes);
        if (historico.length > 60) historico.shift();
      }
      ultimoRegistro = agora;
    }
    notificar(origem);
  }

  function desfazer() {
    const anterior = historico.pop();
    if (!anterior) return;
    Object.assign(S, anterior);
    ultimoRegistro = 0;
    sincronizar();
    notificar('desfazer');
    anunciar('Última alteração desfeita.');
  }

  function restaurar() {
    ultimoRegistro = 0;
    definir({ ...PADRAO }, 'restaurar');
    ultimoRegistro = 0;
    anunciar('Simulador restaurado para o padrão.');
  }

  // ---------- eventos dos controles ----------
  const painel = $('painel');
  painel.addEventListener('submit', (e) => e.preventDefault());
  painel.addEventListener('input', (e) => {
    const t = e.target;
    const campo = CAMPOS.find(([, ni, ri]) => t.id === ni || t.id === ri);
    if (campo) {
      const [k, ni] = campo;
      const [min, max] = CONFIG.limites[k];
      const v = parseFloat(String(t.value).replace(',', '.'));
      if (t.id === ni) {
        let erro = '';
        if (t.value === '' || Number.isNaN(v)) erro = 'Digite um número.';
        else if (v < min || v > max) erro = `Use entre ${formatar(min)} e ${formatar(max)} m.`;
        $('erro-' + k).textContent = erro;
        t.setAttribute('aria-invalid', erro ? 'true' : 'false');
        t.closest('.entrada').dataset.invalido = erro ? 'true' : 'false';
        if (erro) return;
      }
      definir({ [k]: v }, t.id);
      return;
    }
    if (t.id === 'rg') definir({ gap: +t.value });
    else if (t.name === 'sp') definir({ sp: t.value });
    else if (t.name === 'bw') definir({ bw: +t.value });
    else if (t.name === 'dir') definir({ dir: t.value });
    else if (t.id === 'tStep') definir({ step: t.checked });
    else if (t.id === 'tRail') definir({ rail: t.checked });
    else if (t.id === 'tFrame') definir({ frame: t.checked }, 'visual', false);
  });
  painel.addEventListener('change', (e) => {
    if (e.target.type === 'number') sincronizar();
  });

  $('modelos').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    ultimoRegistro = 0;
    definir(MODELOS[+b.dataset.i].p, 'modelo');
  });

  $('bDesfazer').addEventListener('click', desfazer);
  $('bRestaurar').addEventListener('click', restaurar);

  $('bCompartilhar').addEventListener('click', async () => {
    const url = `${location.origin}${location.pathname}${paraHash(S)}`;
    track('simulador_compartilhar');
    try {
      await navigator.clipboard.writeText(url);
      avisar('Link da configuração copiado.');
    } catch {
      history.replaceState(null, '', paraHash(S));
      avisar('O link está no endereço da página.');
    }
  });

  const imprimir = () => {
    montarFolha();
    track('simulador_imprimir');
    try {
      window.print();
    } catch {
      avisar('A impressão não está disponível aqui.');
    }
  };
  $('bImprimir').addEventListener('click', imprimir);
  $('bImprimir2').addEventListener('click', imprimir);
  window.addEventListener('beforeprint', montarFolha);

  // teclado: setas mudam as medidas quando o palco está focado
  $('palco').addEventListener('keydown', (e) => {
    const passo = e.shiftKey ? 0.5 : 0.1;
    const mapa = {
      ArrowRight: ['w', passo],
      ArrowLeft: ['w', -passo],
      ArrowUp: ['l', passo],
      ArrowDown: ['l', -passo],
    };
    if (mapa[e.key]) {
      e.preventDefault();
      const [k, d] = mapa[e.key];
      definir({ [k]: Math.round((S[k] + d) * 10) / 10 }, 'teclado');
      anunciar(`${k === 'w' ? 'Largura' : 'Profundidade'}: ${formatar(S[k])} metros.`);
    }
  });
  $('simulador').addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && e.target.type !== 'number') {
      e.preventDefault();
      desfazer();
    }
  });

  function montarFolha() {
    const c = calcular(S);
    const deck = deckPorId(S.sp);
    const data = new Date().toLocaleDateString('pt-BR');
    const config = [
      ['Medidas', `${formatar(S.w)} × ${formatar(S.l)} m (${formatar(c.area)} m²)`],
      ['Altura do piso', `${Math.round(S.h * 100)} cm`],
      ['Deck', deck.nome],
      [
        'Tábuas',
        `${Math.round(S.bw * 100)} cm, junta de ${S.gap} mm, ${S.dir === 'par' ? 'paralelas à parede' : 'saindo da parede'}`,
      ],
      [
        'Detalhes',
        `${c.degraus ? c.degraus + ' degrau(s)' : 'Sem degraus'}, ${S.rail ? 'com guarda-corpo' : 'sem guarda-corpo'}`,
      ],
    ];
    const tabela = (linhas) =>
      `<table>${linhas.map(([a, b]) => `<tr><th>${a}</th><td>${b}</td></tr>`).join('')}</table>`;
    $('folha').innerHTML = `
      <header><img src="img/logo-mirai.svg" alt="Madeireira Mirai"><span>${data}</span></header>
      <h1>Resumo do deck simulado</h1>
      <p>Estimativa gerada pelo simulador do site. A lista final é conferida pela equipe.</p>
      <h2>Configuração</h2>${tabela(config)}
      <h2>Lista de material estimada</h2>${tabela(linhasMaterial(S, c))}
      <footer>${EMPRESA.nome} · ${EMPRESA.endereco} · WhatsApp ${EMPRESA.whatsappExibicao} · Tel. ${EMPRESA.telefoneExibicao} · ${EMPRESA.email}<br>
      Regras: ${CONFIG.perdaPercentual}% de perda nas tábuas, barrotes a cada ${Math.round(CONFIG.espacamentoBarrotes * 100)} cm, pilares a cada ${formatar(CONFIG.espacamentoPilares, 1)} m.</footer>`;
  }

  sincronizar();
  exibir();
  botoes();
  if (doHash) {
    requestAnimationFrame(() => $('simulador').scrollIntoView());
  }

  return {
    estado: () => S,
    definir,
    desfazer,
    restaurar,
    aoMudar: (f) => ouvintes.push(f),
  };
}
