// Cena 3D do simulador. Carregado sob demanda quando o simulador entra na tela.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CONFIG } from './config.js';
import { DECKS } from './data.js';
import { texturaMadeira } from './textura.js';
import { degrausDe } from './simulador.js';
import { $, formatar, reduzMovimento } from './util.js';

const VERDE = 0x1f4526;
const VERDE_HOVER = 0x2b5a35;
const GRAFITE = 0x2b2b28;

// Tábua extrudada a partir do perfil real: cantos de cima arredondados (raio do deck),
// cantos de baixo quase retos. Comprimento no eixo X, largura no Z, espessura no Y.
function geometriaTabua(THREE_, comp, esp, larg, raioTopo) {
  const r = Math.min(raioTopo, esp * 0.48, larg * 0.45);
  const rb = Math.min(0.0015, larg * 0.1);
  const x0 = -larg / 2;
  const x1 = larg / 2;
  const y0 = -esp / 2;
  const y1 = esp / 2;
  const p = new THREE_.Shape();
  p.moveTo(x0 + rb, y0);
  p.lineTo(x1 - rb, y0);
  p.quadraticCurveTo(x1, y0, x1, y0 + rb);
  p.lineTo(x1, y1 - r);
  p.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false);
  p.lineTo(x0 + r, y1);
  p.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false);
  p.lineTo(x0, y0 + rb);
  p.quadraticCurveTo(x0, y0, x0 + rb, y0);
  // UV: veio da madeira ao longo do comprimento
  const uv = {
    generateTopUV(_g, v, a, b, c) {
      return [a, b, c].map(
        (i) => new THREE_.Vector2((v[i * 3] - x0) / larg, (v[i * 3 + 1] - y0) / esp),
      );
    },
    generateSideWallUV(_g, v, a, b, c, d) {
      const horiz = Math.abs(v[a * 3 + 1] - v[b * 3 + 1]) < Math.abs(v[a * 3] - v[b * 3]);
      return [a, b, c, d].map((i) => {
        const across = horiz ? (v[i * 3] - x0) / larg : (v[i * 3 + 1] - y0) / esp;
        return new THREE_.Vector2(v[i * 3 + 2] / comp, across);
      });
    },
  };
  const geo = new THREE_.ExtrudeGeometry(p, {
    depth: comp,
    bevelEnabled: false,
    curveSegments: 10,
    UVGenerator: uv,
  });
  geo.rotateY(Math.PI / 2);
  geo.translate(-comp / 2, 0, 0);
  geo.computeVertexNormals();
  return geo;
}

export function iniciar3D(sim) {
  const palco = $('palco');
  const canvas = $('cv');
  const msg = $('palcoMsg');
  const toqueBtn = $('toque');
  const sairBtn = $('sair3d');
  const toque = matchMedia('(pointer: coarse)').matches;
  const semMovimento = reduzMovimento();

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  // nitidez: no computador renderiza em resolução maior que a tela (supersampling);
  // no celular usa a densidade da tela, limitada a 2
  const densidade = toque
    ? Math.min(devicePixelRatio, 2)
    : Math.min(2, Math.max(devicePixelRatio, 1.75));
  renderer.setPixelRatio(densidade);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const cena = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  cena.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 200);

  // luz de fim de tarde
  const sol = new THREE.DirectionalLight(0xffe2bd, 2.1);
  sol.position.set(-6, 9, 8);
  sol.castShadow = true;
  const tamSombra = Math.min(toque ? 2048 : 4096, renderer.capabilities.maxTextureSize);
  sol.shadow.mapSize.set(tamSombra, tamSombra);
  sol.shadow.camera.near = 1;
  sol.shadow.camera.far = 40;
  sol.shadow.bias = -0.0003;
  sol.shadow.normalBias = 0.015;
  sol.shadow.radius = 3;
  cena.add(sol);
  cena.add(sol.target);
  // a área da sombra acompanha o tamanho do deck: sombra mais definida
  const ajustarSombra = (w, l, extra) => {
    const meio = Math.hypot(w, l + extra) / 2 + 2.5;
    const cx = 0;
    const cz = (l + extra) / 2;
    sol.target.position.set(cx, 0, cz);
    sol.position.set(cx - 6, 9, cz + 8);
    Object.assign(sol.shadow.camera, { left: -meio, right: meio, top: meio, bottom: -meio });
    sol.shadow.camera.updateProjectionMatrix();
  };
  cena.add(new THREE.HemisphereLight(0xfff6ea, 0x8f877a, 0.35));

  // chão: só a sombra de contato
  const chao = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.ShadowMaterial({ opacity: 0.2 }),
  );
  chao.rotation.x = -Math.PI / 2;
  chao.receiveShadow = true;
  cena.add(chao);

  const caixa = new THREE.BoxGeometry(1, 1, 1);
  const parede = new THREE.Mesh(
    caixa,
    new THREE.MeshStandardMaterial({ color: 0xe4e1d8, roughness: 0.95 }),
  );
  parede.castShadow = parede.receiveShadow = true;
  cena.add(parede);
  const porta = new THREE.Mesh(
    caixa,
    new THREE.MeshStandardMaterial({ color: 0x2f3b3f, roughness: 0.2, metalness: 0.1 }),
  );
  cena.add(porta);

  // materiais
  const texturas = {};
  const textura = (id) => {
    if (!texturas[id]) {
      const deck = DECKS.find((d) => d.id === id) || DECKS[0];
      const t = new THREE.CanvasTexture(texturaMadeira(deck.cor, 11, 2048, 256));
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texturas[id] = t;
    }
    return texturas[id];
  };
  const matTabua = new THREE.MeshStandardMaterial({ roughness: 0.62, envMapIntensity: 0.55 });
  const matAcab = new THREE.MeshStandardMaterial({ roughness: 0.66, envMapIntensity: 0.5 });
  const matBarrote = new THREE.MeshStandardMaterial({ color: 0x7b6a52, roughness: 0.9 });
  const matJunta = new THREE.MeshStandardMaterial({ color: 0x24170e, roughness: 1 });
  const matPilar = new THREE.MeshStandardMaterial({ color: 0x5b4c3a, roughness: 0.9 });
  const matCota = new THREE.LineBasicMaterial({ color: GRAFITE });

  // alças de arraste: anel fino
  function criarAlca(k) {
    const g = new THREE.Group();
    g.userData.k = k;
    const mat = new THREE.MeshStandardMaterial({ color: VERDE, roughness: 0.45 });
    const anel = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.016, 12, 48), mat);
    anel.rotation.x = -Math.PI / 2;
    const ponto = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 20), mat);
    const alvo = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
    );
    anel.castShadow = true;
    [anel, ponto, alvo].forEach((m) => {
      m.userData.k = k;
      g.add(m);
    });
    g.userData.mat = mat;
    cena.add(g);
    return g;
  }
  const alcaW = criarAlca('w');
  const alcaL = criarAlca('l');

  const cotas = ['w', 'l', 'h'].map((k) => {
    const el = document.createElement('div');
    el.className = 'cota';
    palco.appendChild(el);
    return { k, el, p: new THREE.Vector3(), ativa: true };
  });

  // ---------- construção do deck ----------
  let grupo = new THREE.Group();
  let linhasCota = null;
  let geometrias = [];
  cena.add(grupo);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const esc = new THREE.Vector3();
  const cima = new THREE.Vector3(0, 1, 0);
  const cor = new THREE.Color();
  const alvoCam = new THREE.Vector3();

  function instanciar(geo, mat, itens, sombra = true) {
    if (!itens.length) return;
    const im = new THREE.InstancedMesh(geo, mat, itens.length);
    itens.forEach((b, i) => {
      q.setFromAxisAngle(cima, b.r || 0);
      pos.set(b.x, b.y, b.z);
      esc.set(b.sx ?? 1, b.sy ?? 1, b.sz ?? 1);
      m4.compose(pos, q, esc);
      im.setMatrixAt(i, m4);
      if (b.c != null) {
        cor.setScalar(b.c);
        im.setColorAt(i, cor);
      }
    });
    im.castShadow = sombra;
    im.receiveShadow = true;
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    grupo.add(im);
  }

  function construir(S) {
    cena.remove(grupo);
    grupo.traverse((o) => o.isInstancedMesh && o.dispose());
    geometrias.forEach((g) => g.dispose());
    geometrias = [];
    grupo = new THREE.Group();
    cena.add(grupo);
    if (linhasCota) {
      cena.remove(linhasCota);
      linhasCota.geometry.dispose();
    }

    const { w, l, h, bw } = S;
    const g = S.gap / 1000;
    const T = CONFIG.espessuraTabua;
    const par = S.dir === 'par';
    const R = par ? w : l;
    const Sp = par ? l : w;
    const paraMundo = (r, s) => (par ? [-w / 2 + r, s] : [-w / 2 + s, r]);
    const deck = DECKS.find((d) => d.id === S.sp) || DECKS[0];
    let semente = 12345;
    const rnd = () => (semente = (semente * 16807) % 2147483647) / 2147483647;

    const tex = textura(S.sp);
    matTabua.map = tex;
    matAcab.map = tex;
    matTabua.transparent = S.frame;
    matTabua.opacity = S.frame ? 0.14 : 1;
    matTabua.depthWrite = !S.frame;
    matTabua.needsUpdate = matAcab.needsUpdate = true;

    // tábuas com o perfil de cada deck
    const raio = deck.raioBorda;
    const n = Math.ceil((Sp + g) / (bw + g) - 1e-9);
    const cheias = [];
    let ultima = null;
    for (let i = 0; i < n; i++) {
      const s0 = i * (bw + g);
      const larg = Math.min(bw, Sp - s0);
      if (larg < 0.005) break;
      const [x, z] = paraMundo(R / 2, s0 + larg / 2);
      const item = { x, y: h - T / 2, z, r: par ? 0 : -Math.PI / 2, c: 0.82 + rnd() * 0.26 };
      if (larg < bw - 1e-6) ultima = { ...item, larg };
      else cheias.push(item);
    }
    const geoTabua = geometriaTabua(THREE, R, T, bw, raio);
    geometrias.push(geoTabua);
    instanciar(geoTabua, matTabua, cheias, !S.frame);
    // fundo escuro logo abaixo das tábuas: as juntas aparecem como linhas definidas
    if (!S.frame)
      instanciar(
        caixa,
        matJunta,
        [{ x: 0, y: h - T - 0.002, z: l / 2, sx: w - 0.01, sy: 0.003, sz: l - 0.01 }],
        false,
      );
    if (ultima) {
      const geoUlt = geometriaTabua(THREE, R, T, ultima.larg, raio);
      geometrias.push(geoUlt);
      instanciar(geoUlt, matTabua, [ultima], !S.frame);
    }

    // barrotes
    const jh = Math.min(0.1, Math.max(0.015, h - T));
    const nb = Math.ceil(R / CONFIG.espacamentoBarrotes - 1e-9) + 1;
    const barrotes = [];
    for (let k = 0; k < nb; k++) {
      const r = 0.025 + (k * (R - 0.05)) / (nb - 1);
      const [x, z] = paraMundo(r, Sp / 2);
      barrotes.push({
        x,
        y: h - T - jh / 2,
        z,
        sx: Sp,
        sy: jh,
        sz: 0.05,
        r: par ? -Math.PI / 2 : 0,
      });
    }
    instanciar(caixa, matBarrote, barrotes);

    // pilares
    const pilares = [];
    const ph = h - T - jh;
    if (h >= CONFIG.alturaMinimaPilares && ph > 0.01) {
      const esp = CONFIG.espacamentoPilares;
      const nr = Math.ceil(R / esp - 1e-9) + 1;
      const ns = Math.ceil(Sp / esp - 1e-9) + 1;
      for (let a = 0; a < nr; a++)
        for (let b = 0; b < ns; b++) {
          const [x, z] = paraMundo(
            0.05 + (a * (R - 0.1)) / (nr - 1),
            0.05 + (b * (Sp - 0.1)) / (ns - 1),
          );
          pilares.push({ x, y: ph / 2, z, sx: 0.09, sy: ph, sz: 0.09 });
        }
    }
    instanciar(caixa, matPilar, pilares);

    // acabamentos: testeiras, degraus, guarda-corpo
    const acab = [];
    if (!S.frame) {
      const fh = h <= 0.32 ? h - T : 0.2;
      const fy = h - T - fh / 2;
      acab.push(
        { x: 0, y: fy, z: l + 0.01, sx: w + 0.04, sy: fh, sz: 0.02, c: 0.9 },
        { x: -w / 2 - 0.01, y: fy, z: l / 2, sx: l, sy: fh, sz: 0.02, r: -Math.PI / 2, c: 0.9 },
        { x: w / 2 + 0.01, y: fy, z: l / 2, sx: l, sy: fh, sz: 0.02, r: -Math.PI / 2, c: 0.9 },
      );
    }
    const nd = degrausDe(S);
    const ld = Math.min(w, CONFIG.larguraMaximaDegrau);
    const pd = CONFIG.profundidadeDegrau;
    let profDegraus = 0;
    for (let j = 1; j <= nd; j++) {
      const topo = h - (j * h) / (nd + 1);
      acab.push({
        x: 0,
        y: topo / 2,
        z: l + (j - 0.5) * pd,
        sx: ld,
        sy: topo,
        sz: pd,
        c: 0.8 + rnd() * 0.2,
      });
      profDegraus = j * pd;
    }
    if (S.rail) {
      const trecho = (ax, az, bx, bz) => {
        const L = Math.hypot(bx - ax, bz - az);
        if (L < 0.05) return;
        const np = Math.ceil(L / 1.2 - 1e-9) + 1;
        const ang = -Math.atan2(bz - az, bx - ax);
        for (let k = 0; k < np; k++) {
          const t = k / (np - 1);
          acab.push({
            x: ax + (bx - ax) * t,
            y: h + 0.5,
            z: az + (bz - az) * t,
            sx: 0.07,
            sy: 1,
            sz: 0.07,
            c: 0.85,
          });
        }
        acab.push(
          {
            x: (ax + bx) / 2,
            y: h + 1.02,
            z: (az + bz) / 2,
            sx: L + 0.07,
            sy: 0.04,
            sz: 0.12,
            r: ang,
            c: 1,
          },
          {
            x: (ax + bx) / 2,
            y: h + 0.55,
            z: (az + bz) / 2,
            sx: L,
            sy: 0.05,
            sz: 0.03,
            r: ang,
            c: 0.9,
          },
        );
      };
      const e = 0.035;
      const zf = l - e;
      if (nd) {
        trecho(-w / 2 + e, zf, -ld / 2, zf);
        trecho(ld / 2, zf, w / 2 - e, zf);
      } else trecho(-w / 2 + e, zf, w / 2 - e, zf);
      trecho(-w / 2 + e, 0.1, -w / 2 + e, zf);
      trecho(w / 2 - e, 0.1, w / 2 - e, zf);
    }
    instanciar(caixa, matAcab, acab);

    // parede e porta
    const ap = h + 2.7;
    parede.scale.set(w + 3, ap, 0.18);
    parede.position.set(0, ap / 2, -0.09);
    porta.scale.set(Math.min(1.8, w - 0.3), 2.1, 0.03);
    porta.position.set(0, h + 1.05, 0.005);

    // alças
    alcaW.position.set(w / 2 + 0.38, h + 0.03, l / 2);
    alcaL.position.set(0, h + 0.03, l + 0.38 + profDegraus);

    // cotas em estilo desenho técnico
    const y = 0.012;
    const zc = l + 0.9 + profDegraus;
    const xc = -w / 2 - 0.85;
    const hx = w / 2 + 0.35;
    const hz = l + 0.35;
    const a = 0.1; // tamanho da seta
    const seg = [];
    const linha = (x1, y1, z1, x2, y2, z2) => seg.push(x1, y1, z1, x2, y2, z2);
    // largura
    linha(-w / 2, y, zc, w / 2, y, zc);
    linha(-w / 2, y, zc, -w / 2 + a, y, zc - a / 2);
    linha(-w / 2, y, zc, -w / 2 + a, y, zc + a / 2);
    linha(w / 2, y, zc, w / 2 - a, y, zc - a / 2);
    linha(w / 2, y, zc, w / 2 - a, y, zc + a / 2);
    linha(-w / 2, y, l + 0.06, -w / 2, y, zc + 0.08);
    linha(w / 2, y, l + 0.06, w / 2, y, zc + 0.08);
    // profundidade
    linha(xc, y, 0, xc, y, l);
    linha(xc, y, 0, xc - a / 2, y, a);
    linha(xc, y, 0, xc + a / 2, y, a);
    linha(xc, y, l, xc - a / 2, y, l - a);
    linha(xc, y, l, xc + a / 2, y, l - a);
    linha(-w / 2 - 0.06, y, 0, xc - 0.08, y, 0);
    linha(-w / 2 - 0.06, y, l, xc - 0.08, y, l);
    // altura
    if (h >= 0.1) {
      linha(hx, 0, hz, hx, h, hz);
      linha(hx - 0.06, h, hz, hx + 0.06, h, hz);
      linha(hx - 0.06, 0, hz, hx + 0.06, 0, hz);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
    linhasCota = new THREE.LineSegments(geo, matCota);
    cena.add(linhasCota);

    const m = (v) => `${formatar(v)} m`;
    cotas[0].p.set(0, y, zc);
    cotas[0].el.textContent = m(w);
    cotas[1].p.set(xc, y, l / 2);
    cotas[1].el.textContent = m(l);
    cotas[2].p.set(hx, h / 2, hz);
    cotas[2].el.textContent = `${Math.round(h * 100)} cm`;
    cotas[2].ativa = h >= 0.1;

    alvoCam.set(0, h * 0.5, l / 2 + profDegraus / 2);
    ajustarSombra(w, l, profDegraus + 1);
  }

  // ---------- câmera ----------
  const controles = new OrbitControls(camera, canvas);
  controles.enableDamping = true;
  controles.dampingFactor = 0.09;
  controles.enablePan = false;
  controles.maxPolarAngle = Math.PI * 0.47;
  controles.minDistance = 0.4;
  controles.maxDistance = 40;

  const DIRECOES = {
    perspectiva: new THREE.Vector3(0.6, 0.52, 1).normalize(),
    planta: new THREE.Vector3(0, 1, 0.0008).normalize(),
    frontal: new THREE.Vector3(0, 0.22, 1).normalize(),
    detalhe: new THREE.Vector3(1, 0.42, 0.85).normalize(),
  };
  // alvo da câmera: o centro do deck, ou o canto da frente na vista de detalhe
  const alvoDetalhe = new THREE.Vector3();
  const alvoDaVista = () => {
    if (vistaAtual !== 'detalhe') return alvoCam;
    const S = sim.estado();
    return alvoDetalhe.set(S.w / 2 - 0.12, S.h - 0.02, S.l - 0.12);
  };
  let vistaAtual = 'perspectiva';
  const transicao = {
    de: new THREE.Vector3(),
    para: new THREE.Vector3(),
    t: 1,
    inicio: 0,
    duracao: 700,
  };

  function enquadrar(vista = vistaAtual, animar = true) {
    vistaAtual = vista;
    const S = sim.estado();
    const alvo = alvoDaVista();
    let d;
    if (vista === 'detalhe') {
      d = 0.75 * Math.max(1, 1.15 / camera.aspect);
    } else {
      const fator = { planta: 1.85, frontal: 1.4, perspectiva: 1.25 }[vista];
      d = (Math.max(S.w, S.l + 1.2) * fator + 3.4) * Math.max(1, 1.15 / camera.aspect);
    }
    transicao.para.copy(alvo).addScaledVector(DIRECOES[vista], d);
    controles.target.copy(alvo);
    transicao.duracao = 700;
    if (animar && !semMovimento) {
      transicao.de.copy(camera.position);
      transicao.t = 0;
      transicao.inicio = performance.now();
    } else {
      camera.position.copy(transicao.para);
      transicao.t = 1;
    }
    document
      .querySelectorAll('#cameras button')
      .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cam === vista)));
    pedirQuadro();
  }

  $('cameras').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-cam]');
    if (b) enquadrar(b.dataset.cam);
  });

  // ---------- arrastar alças ----------
  const raio = new THREE.Raycaster();
  const ponteiro = new THREE.Vector2();
  const plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const ponto = new THREE.Vector3();
  let arrasto = null;
  let sobre = null;

  const mirar = (e) => {
    const r = canvas.getBoundingClientRect();
    ponteiro.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1,
    );
    raio.setFromCamera(ponteiro, camera);
  };
  const escolher = () => {
    const hits = raio.intersectObjects([alcaW, alcaL], true);
    return hits.length ? hits[0].object.userData.k : null;
  };
  const destacar = (k) => {
    for (const a of [alcaW, alcaL]) {
      const on = a.userData.k === k;
      a.scale.setScalar(on ? 1.25 : 1);
      a.userData.mat.color.setHex(on ? VERDE_HOVER : VERDE);
    }
    pedirQuadro();
  };

  canvas.addEventListener(
    'pointerdown',
    (e) => {
      mirar(e);
      const k = escolher();
      if (!k) return;
      arrasto = k;
      controles.enabled = false;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* sem captura */
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      palco.classList.add('arrastando');
      destacar(k);
    },
    true,
  );
  canvas.addEventListener('pointermove', (e) => {
    mirar(e);
    if (arrasto) {
      const S = sim.estado();
      plano.constant = -S.h;
      if (!raio.ray.intersectPlane(plano, ponto)) return;
      const [min, max] = CONFIG.limites[arrasto];
      if (arrasto === 'w') {
        const w = Math.round(Math.min(max, Math.max(min, 2 * (ponto.x - 0.38))) * 10) / 10;
        if (w !== S.w) sim.definir({ w }, 'arrasto');
      } else {
        const extra = degrausDe(S) * CONFIG.profundidadeDegrau;
        const l = Math.round(Math.min(max, Math.max(min, ponto.z - 0.38 - extra)) * 10) / 10;
        if (l !== S.l) sim.definir({ l }, 'arrasto');
      }
      return;
    }
    if (e.pointerType === 'touch') return;
    const k = escolher();
    if (k !== sobre) {
      sobre = k;
      canvas.style.cursor = k ? 'grab' : '';
      destacar(k);
    }
  });
  const soltar = (e) => {
    if (!arrasto) return;
    arrasto = null;
    controles.enabled = !bloqueado;
    palco.classList.remove('arrastando');
    destacar(sobre);
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      /* nada */
    }
  };
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);

  // ---------- celular: não prender a rolagem ----------
  let bloqueado = false;
  function bloquear(sim3d) {
    bloqueado = sim3d;
    controles.enabled = !sim3d;
    canvas.style.pointerEvents = sim3d ? 'none' : '';
    toqueBtn.hidden = !sim3d;
    sairBtn.hidden = sim3d;
  }
  if (toque) {
    bloquear(true);
    toqueBtn.addEventListener('click', () => {
      bloquear(false);
      sairBtn.focus();
    });
    sairBtn.addEventListener('click', () => {
      bloquear(true);
      toqueBtn.focus();
    });
  }

  // ---------- render sob demanda ----------
  let agendado = false;
  let visivel = true;
  let reconstruir = true;
  let reenquadrar = false;
  const v = new THREE.Vector3();
  let primeiro = true;

  function pedirQuadro() {
    if (!agendado && visivel) {
      agendado = true;
      requestAnimationFrame(quadro);
    }
  }

  function quadro() {
    agendado = false;
    let continuar = false;
    if (reconstruir) {
      reconstruir = false;
      construir(sim.estado());
    }
    if (reenquadrar) {
      reenquadrar = false;
      enquadrar(vistaAtual);
    }
    const alvo = alvoDaVista();
    if (controles.target.distanceToSquared(alvo) > 1e-6) {
      controles.target.lerp(alvo, 0.18);
      continuar = true;
    }
    if (transicao.t < 1) {
      transicao.t = Math.min(1, (performance.now() - transicao.inicio) / transicao.duracao);
      const e = 1 - Math.pow(1 - transicao.t, 3);
      camera.position.lerpVectors(transicao.de, transicao.para, e);
      continuar = true;
    }
    if (controles.update()) continuar = true;
    renderer.render(cena, camera);

    const W = palco.clientWidth;
    const H = palco.clientHeight;
    for (const c of cotas) {
      v.copy(c.p).project(camera);
      const ok = c.ativa && v.z < 1;
      c.el.style.display = ok ? '' : 'none';
      if (ok) {
        c.el.style.transform = `translate(${((v.x + 1) / 2) * W}px, ${((1 - v.y) / 2) * H}px) translate(-50%, -50%)`;
      }
    }
    if (primeiro) {
      primeiro = false;
      msg.hidden = true;
    }
    if (continuar) pedirQuadro();
  }

  controles.addEventListener('change', pedirQuadro);
  sim.aoMudar((_S, origem) => {
    reconstruir = true;
    if (origem === 'modelo' || origem === 'restaurar') reenquadrar = true;
    pedirQuadro();
  });

  const ajustar = () => {
    const W = palco.clientWidth;
    const H = palco.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    pedirQuadro();
  };
  ajustar();
  new ResizeObserver(ajustar).observe(palco);
  new IntersectionObserver((es) => {
    visivel = es[0].isIntersecting;
    if (visivel) pedirQuadro();
  }).observe(palco);

  construir(sim.estado());
  reconstruir = false;
  enquadrar('perspectiva', false);
  if (!semMovimento) {
    transicao.de
      .copy(transicao.para)
      .sub(alvoCam)
      .multiplyScalar(1.45)
      .applyAxisAngle(cima, 0.5)
      .add(alvoCam);
    camera.position.copy(transicao.de);
    transicao.t = 0;
    transicao.inicio = performance.now();
    transicao.duracao = 1100;
  }
  pedirQuadro();
}
