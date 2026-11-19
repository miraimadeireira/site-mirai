// Gera uma textura de madeira em canvas a partir das cores de cada deck.
// Veio corre no eixo X (comprimento da tábua).
export function texturaMadeira(cor, semente, largura, altura) {
  const c = document.createElement('canvas');
  c.width = largura;
  c.height = altura;
  const g = c.getContext('2d');
  let r = (semente * 9973) % 2147483647 || 7;
  const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;

  g.fillStyle = cor.base;
  g.fillRect(0, 0, largura, altura);

  const linhas = Math.round(altura * 0.9);
  for (let i = 0; i < linhas; i++) {
    const y = rnd() * altura;
    const amp = 1 + rnd() * altura * 0.03;
    const fr = ((1 + rnd() * 4) / largura) * 6.283;
    const fase = rnd() * 6.283;
    const larga = rnd() < 0.08;
    g.globalAlpha = larga ? 0.04 + rnd() * 0.06 : 0.05 + rnd() * 0.16;
    g.strokeStyle = rnd() < 0.6 ? cor.escuro : cor.claro;
    g.lineWidth = larga ? 6 + rnd() * 14 : 0.4 + rnd() * 1.4;
    g.beginPath();
    for (let x = 0; x <= largura; x += largura / 64) {
      const yy =
        y + Math.sin(x * fr + fase) * amp + Math.sin(x * fr * 2.7 + fase * 1.3) * amp * 0.35;
      if (x) g.lineTo(x, yy);
      else g.moveTo(x, yy);
    }
    g.stroke();
  }

  if (cor.nos) {
    const n = Math.max(1, Math.round(largura / altura / 2));
    for (let k = 0; k < n; k++) {
      const x = rnd() * largura;
      const y = rnd() * altura;
      const rx = altura * (0.05 + rnd() * 0.05);
      const grad = g.createRadialGradient(x, y, 0, x, y, rx * 2.2);
      grad.addColorStop(0, cor.escuro);
      grad.addColorStop(0.45, cor.escuro + 'aa');
      grad.addColorStop(1, cor.escuro + '00');
      g.globalAlpha = 0.6;
      g.fillStyle = grad;
      g.beginPath();
      g.ellipse(x, y, rx * 2.2, rx * 1.2, 0, 0, 6.283);
      g.fill();
    }
  }

  g.fillStyle = cor.escuro;
  for (let i = 0; i < (largura * altura) / 300; i++) {
    g.globalAlpha = 0.1 + rnd() * 0.2;
    g.fillRect(rnd() * largura, rnd() * altura, 2 + rnd() * largura * 0.012, 0.8 + rnd() * 0.6);
  }
  g.globalAlpha = 1;
  return c;
}
