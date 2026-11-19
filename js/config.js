// Parâmetros do simulador. A Mirai pode ajustar estes valores sem mexer no código 3D.
export const CONFIG = {
  // limites das medidas (em metros)
  limites: {
    w: [1, 12], // largura, junto à parede
    l: [1, 10], // profundidade
    h: [0.05, 1.2], // altura do piso
  },
  // larguras de tábua disponíveis (em metros)
  largurasTabua: [0.1, 0.14, 0.2],
  // junta entre tábuas (em milímetros)
  junta: { min: 3, max: 8 },
  espessuraTabua: 0.025,
  espacamentoBarrotes: 0.4,
  espacamentoPilares: 1.5,
  perdaPercentual: 10,
  parafusosPorCruzamento: 2,
  alturaMinimaPilares: 0.15,
  alturaMinimaDegraus: 0.18,
  alturaDegrau: 0.18,
  profundidadeDegrau: 0.3,
  larguraMaximaDegrau: 2,
};

// Configuração inicial do simulador
export const PADRAO = {
  w: 4.2,
  l: 3,
  h: 0.3,
  sp: 'cumaru-boleado',
  bw: 0.14,
  gap: 5,
  dir: 'par',
  step: true,
  rail: false,
  frame: false,
};
