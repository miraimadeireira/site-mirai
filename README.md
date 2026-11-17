# Site Madeireira Mirai

Site institucional da **Madeireira Mirai** (Varadouro, São Sebastião/SP), com **simulador de deck em 3D**: o cliente estica o deck pelas alças, escolhe a madeira e recebe a lista de material pronta para pedir orçamento no WhatsApp.

## Como rodar

É uma página estática, sem build. O Three.js é carregado via CDN (jsDelivr), então precisa de internet.

```bash
# qualquer servidor estático serve, por exemplo:
npx serve .
# ou
python3 -m http.server 8080
```

Depois abra `http://localhost:8080`. Abrir o `index.html` direto pelo arquivo também funciona na maioria dos navegadores.

## Estrutura

```
index.html          página inteira (HTML + CSS + JS)
img/
  hero.webp         foto do topo (vigas de maracatiara)
  deck_b.webp       deck cumaru boleado
  deck_e.webp       deck cumaru europeu
  deck_p.webp       deck pinus tratado
  churr.webp        churrasqueira pré-moldada (campanha área gourmet)
  beams.webp        vigas de garapeira (seção catálogo)
  toras.webp        fundo da chamada final
  logo-mirai.svg    logo da Mirai em vetor (a página usa a mesma, embutida no HTML)
```

## Onde mexer no `index.html`

| O quê | Onde procurar |
|---|---|
| Número do WhatsApp | `const WA=` |
| Tipos de deck (nome, cores da textura, textos) | `const SP=[` |
| Categorias do catálogo | `const CAT=[` |
| Modelos prontos do simulador | `const PRE=[` |
| Regras do cálculo (perda, espaçamento de barrotes e pilares) | `function calc()` |
| Cena 3D (luz, câmera, tábuas, degraus, guarda-corpo) | `<script type="module">` → `function rebuild(S)` |
| Cores do site | variáveis CSS no início do `<style>` (`--deep`, `--sea`, etc.) |

### Regras do cálculo atual

- 10% de perda nas tábuas
- barrotes a cada 40 cm
- pilares a cada 1,5 m (a partir de 15 cm de altura)
- degraus a partir de 18 cm de altura
- 2 parafusos por cruzamento tábua × barrote

## Pendências antes de publicar

- [ ] Confirmar endereço completo e horário de funcionamento (hoje aparece só "Varadouro, São Sebastião/SP")
- [ ] Confirmar as larguras de tábua que a Mirai vende (o simulador usa 10, 14 e 20 cm)
- [ ] Confirmar a diferença de perfil do Cumaru Europeu para o texto do card
- [ ] Confirmar se as fotos são próprias da Mirai ou de banco de imagens (principalmente `hero.webp`)
- [ ] Trocar a logo embutida pelo arquivo original da Mirai, se eles tiverem
