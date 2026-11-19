import { EMPRESA } from './data.js';

export const linkWhatsApp = (texto) =>
  `https://wa.me/${EMPRESA.whatsapp}?text=${encodeURIComponent(texto)}`;

// Abre o WhatsApp em nova aba a partir de uma ação do usuário
export function abrirWhatsApp(texto) {
  const a = document.createElement('a');
  a.href = linkWhatsApp(texto);
  a.target = '_blank';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// Rastreamento: pronto para GA4 / Meta Pixel. Nenhum script de terceiros é carregado aqui;
// os eventos vão para window.dataLayer e para o evento 'mirai:track'.
export function track(evento, detalhes = {}) {
  const payload = { event: evento, ...detalhes };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
  window.dispatchEvent(new CustomEvent('mirai:track', { detail: payload }));
}

export function ligarRastreamento() {
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-track]');
    if (!el) return;
    track(el.dataset.track, {
      rotulo: el.dataset.trackLabel || el.textContent.trim().replace(/\s+/g, ' ').slice(0, 80),
    });
  });
}

// Preenche href de todos os links com data-whats="mensagem"
export function ligarLinksWhatsApp(raiz = document) {
  raiz.querySelectorAll('[data-whats]').forEach((a) => {
    a.href = linkWhatsApp(a.dataset.whats);
    a.target = '_blank';
    a.rel = 'noopener';
  });
}
