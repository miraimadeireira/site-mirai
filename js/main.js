import '../css/tokens.css';
import '../css/base.css';
import '../css/components.css';
import '../css/sections.css';

import { EMPRESA, DECKS, CATEGORIAS_DESTAQUE, CATEGORIAS_LISTA, HISTORIA } from './data.js';
import {
  linkWhatsApp,
  abrirWhatsApp,
  ligarRastreamento,
  ligarLinksWhatsApp,
  track,
} from './whatsapp.js';
import { criarSimulador } from './simulador.js';
import { $, reduzMovimento } from './util.js';

const seta = '<svg class="icone" aria-hidden="true"><use href="#i-seta"/></svg>';
const imagem = (nome, alt, larguras, sizes, proporcao = 0.75) => {
  const src = (ext) => larguras.map((w) => `img/${nome}-${w}.${ext} ${w}w`).join(', ');
  const maior = larguras[larguras.length - 1];
  return `<picture><source type="image/avif" srcset="${src('avif')}" sizes="${sizes}"><source type="image/webp" srcset="${src('webp')}" sizes="${sizes}"><img src="img/${nome}-${maior}.webp" alt="${alt}" width="${maior}" height="${Math.round(maior * proporcao)}" loading="lazy" decoding="async"></picture>`;
};

// ---------- conteúdo a partir dos dados ----------
$('decksGrade').innerHTML = DECKS.map(
  (d) => `
  <article class="card revela">
    <div class="card-foto">${imagem(d.foto, `Tábua de deck ${d.nome}`, [640], '(max-width: 620px) 100vw, (max-width: 960px) 40vw, 400px')}</div>
    <div class="card-corpo">
      <div><span class="selo">${d.selo}</span></div>
      <h3>${d.nome}</h3>
      <p>${d.texto}</p>
      <dl class="ficha">${d.ficha.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>
      <div class="card-acoes">
        <button type="button" class="link-seta" data-deck="${d.id}" data-track="deck_simular" data-track-label="${d.nome}">Simular este deck ${seta}</button>
        <a class="link-seta" data-whats="Olá, Mirai! Gostaria de um orçamento do deck ${d.nome}." data-track="whatsapp_deck" data-track-label="${d.nome}">Pedir orçamento ${seta}</a>
      </div>
    </div>
  </article>`,
).join('');

$('catDestaque').innerHTML = CATEGORIAS_DESTAQUE.map(
  (c) => `
  <a class="cat-card revela" data-whats="Olá, Mirai! Gostaria de um orçamento de ${c.nome.toLowerCase()}." data-track="whatsapp_categoria" data-track-label="${c.nome}">
    <div class="foto ${c.tipo === 'produto' ? 'produto' : ''}">${imagem(c.foto, c.nome, c.tipo === 'produto' ? [640] : [400], '(max-width: 960px) 50vw, 300px')}</div>
    <h3>${c.nome}</h3>
    <p>${c.texto}</p>
    <span class="link-seta">Pedir orçamento ${seta}</span>
  </a>`,
).join('');

$('catLista').innerHTML = CATEGORIAS_LISTA.map(
  ([nome, texto]) => `
  <a data-whats="Olá, Mirai! Gostaria de um orçamento de ${nome.toLowerCase()}." data-track="whatsapp_categoria" data-track-label="${nome}">
    <b>${nome}</b><span>${texto}</span>${seta}
  </a>`,
).join('');

$('linhaTempo').innerHTML = HISTORIA.map(
  ([ano, titulo, texto]) =>
    `<li><span class="ano">${ano}</span><h3>${titulo}</h3><p>${texto}</p></li>`,
).join('');

ligarLinksWhatsApp();
ligarRastreamento();

// ---------- cabeçalho ----------
const topo = $('topo');
const whatsFixo = $('whatsFixo');
const hero = $('inicio');
function aoRolar() {
  topo.classList.toggle('rolou', scrollY > 8);
  whatsFixo.classList.toggle('visivel', hero.getBoundingClientRect().bottom < 0);
}
addEventListener('scroll', aoRolar, { passive: true });
aoRolar();

// link ativo conforme a seção visível
const linksNav = [...document.querySelectorAll('.nav a[href^="#"]')];
const secoes = linksNav.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
const obsSecao = new IntersectionObserver(
  (es) => {
    es.forEach((e) => {
      if (!e.isIntersecting) return;
      linksNav.forEach((a) => {
        const ativo = a.getAttribute('href') === '#' + e.target.id;
        a.classList.toggle('ativo', ativo);
        if (ativo) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    });
  },
  { rootMargin: '-45% 0px -50% 0px' },
);
secoes.forEach((s) => obsSecao.observe(s));

// ---------- menu do celular ----------
const menu = $('menuMovel');
const botaoMenu = $('botaoMenu');
let focoAntes = null;
function abrirMenu() {
  focoAntes = document.activeElement;
  menu.classList.add('aberto');
  menu.removeAttribute('inert');
  botaoMenu.setAttribute('aria-expanded', 'true');
  document.body.classList.add('menu-aberto');
  $('fecharMenu').focus();
}
function fecharMenu(devolverFoco = true) {
  menu.classList.remove('aberto');
  menu.setAttribute('inert', '');
  botaoMenu.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-aberto');
  if (devolverFoco && focoAntes) focoAntes.focus();
}
botaoMenu.addEventListener('click', abrirMenu);
$('fecharMenu').addEventListener('click', () => fecharMenu());
menu.addEventListener('click', (e) => {
  if (e.target.closest('nav a')) fecharMenu(false);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menu.classList.contains('aberto')) fecharMenu();
});
menu.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;
  const foco = [...menu.querySelectorAll('a[href], button:not([disabled])')];
  const primeiro = foco[0];
  const ultimo = foco[foco.length - 1];
  if (e.shiftKey && document.activeElement === primeiro) {
    e.preventDefault();
    ultimo.focus();
  } else if (!e.shiftKey && document.activeElement === ultimo) {
    e.preventDefault();
    primeiro.focus();
  }
});
addEventListener('resize', () => {
  if (innerWidth > 1020 && menu.classList.contains('aberto')) fecharMenu(false);
});

// ---------- aparecer ao rolar ----------
if (!reduzMovimento() && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('js');
  const obs = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visivel');
          obs.unobserve(e.target);
        }
      }),
    { rootMargin: '0px 0px -6% 0px' },
  );
  document.querySelectorAll('.revela').forEach((el) => obs.observe(el));
}

// ---------- simulador ----------
const sim = criarSimulador();
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-deck]');
  if (!b) return;
  sim.definir({ sp: b.dataset.deck }, 'card');
  $('simulador').scrollIntoView({ behavior: reduzMovimento() ? 'auto' : 'smooth' });
});

let carregou3D = false;
const obs3D = new IntersectionObserver(
  (es) => {
    if (carregou3D || !es.some((e) => e.isIntersecting)) return;
    carregou3D = true;
    obs3D.disconnect();
    import('./simulador-3d.js')
      .then((m) => m.iniciar3D(sim))
      .catch((err) => {
        console.error(err);
        $('palcoMsg').textContent =
          'Não foi possível abrir o 3D neste navegador. As medidas e a lista de material continuam funcionando.';
        $('palcoMsg').hidden = false;
      });
  },
  { rootMargin: '400px' },
);
obs3D.observe($('palco'));

// ---------- formulário de contato ----------
const form = $('formContato');
const tel = $('fTel');
tel.addEventListener('input', () => {
  const d = tel.value.replace(/\D/g, '').slice(0, 11);
  let v = d;
  if (d.length > 2) v = `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length > 7) v = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
  tel.value = v;
});

const regras = {
  fNome: (v) => (v.trim().length >= 2 ? '' : 'Informe seu nome.'),
  fTel: (v) => {
    const d = v.replace(/\D/g, '');
    return d.length === 0 || d.length >= 10 ? '' : 'Telefone incompleto. Use DDD + número.';
  },
  fMsg: (v) => (v.trim().length >= 5 ? '' : 'Conte um pouco do que você precisa.'),
};
function validar(id) {
  const el = $(id);
  const erro = regras[id](el.value);
  el.setAttribute('aria-invalid', erro ? 'true' : 'false');
  $(id + 'Erro').textContent = erro;
  return !erro;
}
Object.keys(regras).forEach((id) => {
  $(id).addEventListener('blur', () => validar(id));
  $(id).addEventListener('input', () => {
    if ($(id).getAttribute('aria-invalid') === 'true') validar(id);
  });
});
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const ok = Object.keys(regras).map(validar).every(Boolean);
  if (!ok) {
    form.querySelector('[aria-invalid="true"]').focus();
    return;
  }
  const texto = [
    `Olá, Mirai! Aqui é ${$('fNome').value.trim()}.`,
    `Interesse: ${$('fInteresse').value}.`,
    $('fLocal').value.trim() ? `Local da obra: ${$('fLocal').value.trim()}.` : '',
    $('fTel').value ? `Telefone: ${$('fTel').value}.` : '',
    '',
    $('fMsg').value.trim(),
  ]
    .filter((l, i, a) => l !== '' || (i > 0 && a[i - 1] !== ''))
    .join('\n');
  track('whatsapp_formulario', { interesse: $('fInteresse').value });
  abrirWhatsApp(texto);
});

// links fixos
$('whatsFixo').href = linkWhatsApp('Olá, Mirai! Vim pelo site e gostaria de um orçamento.');
document
  .querySelectorAll('[data-ano]')
  .forEach((el) => (el.textContent = new Date().getFullYear()));
document.querySelectorAll('[data-email]').forEach((el) => (el.href = `mailto:${EMPRESA.email}`));
