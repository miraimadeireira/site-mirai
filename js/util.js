export const $ = (id) => document.getElementById(id);

export const formatar = (x, casas = 2) =>
  x.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

export const limitar = (v, min, max) => Math.min(max, Math.max(min, v));

export const reduzMovimento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let timerAviso;
export function avisar(texto) {
  const el = $('aviso');
  if (!el) return;
  el.textContent = texto;
  el.classList.add('visivel');
  clearTimeout(timerAviso);
  timerAviso = setTimeout(() => el.classList.remove('visivel'), 2600);
}

export function anunciar(texto) {
  const el = $('anuncio');
  if (el) el.textContent = texto;
}
