# Site Madeireira Mirai

Site institucional da **Madeireira Mirai** (Varadouro, São Sebastião/SP), com **simulador de deck em 3D**: o cliente estica o deck pelas alças, escolhe a madeira e recebe a lista de material pronta para pedir orçamento no WhatsApp.

## Como rodar

Precisa de Node.js 18 ou mais novo.

```bash
npm install
npm run dev       # servidor de desenvolvimento em http://localhost:5173
npm run build     # gera a versão final em dist/
npm run preview   # serve o conteúdo de dist/ para conferir o build
npm run lint      # ESLint
npm run format    # Prettier
```

O build é um site estático (pasta `dist/`), pronto para Vercel, Netlify ou qualquer hospedagem. Na Vercel: framework **Vite**, comando `npm run build`, pasta de saída `dist`.

## Estrutura

```
index.html                 estrutura da página (seções, formulário, ícones)
css/
  tokens.css               cores, fontes, espaçamentos, raios — o "manual de marca" em variáveis
  base.css                 reset, tipografia e utilitários
  components.css           botões, cabeçalho, menu do celular, campos, selos, aviso
  sections.css             cada seção da página + folha de impressão
js/
  main.js                  monta as seções a partir dos dados, menu, link ativo, formulário
  data.js                  dados da empresa, decks, categorias e história
  config.js                CONFIG do simulador (limites, tábuas, barrotes, pilares, perda)
  simulador.js             estado, controles, cálculo, desfazer, link e impressão
  simulador-3d.js          cena 3D (Three.js), carregada só quando o simulador aparece
  textura.js               textura de madeira gerada em canvas
  whatsapp.js              links do WhatsApp e rastreamento de cliques
  util.js                  funções pequenas compartilhadas
public/
  img/                     fotos em AVIF + WebP e logos em SVG
  favicon.svg, apple-touch-icon.png, og.jpg, robots.txt, sitemap.xml
```

## Onde editar

| O quê                                                                | Arquivo                                                   |
| -------------------------------------------------------------------- | --------------------------------------------------------- |
| Número do WhatsApp, telefone, e-mail, endereço, equipe               | `js/data.js` → `EMPRESA`                                  |
| Decks (nome, selo, texto, ficha técnica, cores da textura)           | `js/data.js` → `DECKS`                                    |
| Categorias do catálogo                                               | `js/data.js` → `CATEGORIAS_DESTAQUE` e `CATEGORIAS_LISTA` |
| Linha do tempo                                                       | `js/data.js` → `HISTORIA`                                 |
| Larguras de tábua, espaçamento de barrotes e pilares, perda, limites | `js/config.js` → `CONFIG`                                 |
| Configuração inicial do simulador                                    | `js/config.js` → `PADRAO`                                 |
| Modelos prontos (Varanda, Piscina…)                                  | `js/simulador.js` → `MODELOS`                             |
| Cores, fontes, espaçamentos                                          | `css/tokens.css`                                          |
| Textos das seções                                                    | `index.html`                                              |

## Simulador 3D

- Alças verdes esticam largura e profundidade; setas do teclado também (Shift = passos de 0,5 m).
- Vistas prontas: **Perspectiva**, **Planta** (de cima, com cotas) e **Frontal**.
- **Desfazer** (Ctrl+Z), **Restaurar padrão**, **Copiar link** da configuração e **Imprimir resumo**.
- Link compartilhável no formato `#w=4.2&l=3&h=0.3&m=cumaru-boleado&t=14&j=5&d=par&g=1&c=0`, lido ao abrir a página.
- No celular, a cena só recebe toques depois de "Toque para interagir", para não prender a rolagem.
- O render só acontece quando algo muda, e pausa fora da tela.

## Rastreamento

Elementos com `data-track` disparam eventos em `window.dataLayer` e o evento `mirai:track`. Para ligar o GA4 ou o Meta Pixel, basta incluir o script deles e ler o `dataLayer`. Nenhum script de terceiros vem incluído.

## Pendências que dependem da Mirai

- [ ] Endereço completo e horário de funcionamento (hoje aparece só "Varadouro, São Sebastião/SP")
- [ ] Larguras reais das tábuas vendidas (o simulador usa 10, 14 e 20 cm em `CONFIG.largurasTabua`)
- [ ] Diferença de perfil do Cumaru Europeu, para o texto e a ficha técnica
- [ ] Confirmar se as fotos são próprias ou de banco de imagens (principalmente a do topo)
- [ ] Arquivo original da logo (a atual foi vetorizada a partir do site)
