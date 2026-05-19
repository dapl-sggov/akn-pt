# AKN-PT Editor (demo v0.1.0 — Cockpit de drafting)

Editor web puro (HTML/CSS/JS, sem servidor) que gera **XML AKN-PT v0.1.0
validável** a partir de um interface amigável para juristas.

> **Nota de UX (v3 — Cockpit de drafting).** O editor foi redesenhado para
> reduzir ruído: o painel esquerdo passou de TOC para **pilha multi-rascunho**,
> o painel direito passou de 4 tabs (Informação/Revisão/Ligações/Saída) para
> uma **régua de actividade** cronológica unificada. A navegação interna ao
> documento vive como **breadcrumb sticky** no topo do canvas. Acções
> secundárias acedem-se via **Cmd-K** (palette pesquisável). O masthead navy
> dá assinatura institucional. Tipografia: *Fraunces* (display) + *STIX Two
> Text* (corpo) + *Geist* (UI).

![v0.1.0](https://img.shields.io/badge/v0.1.0-demo-blue)
![License: EUPL 1.2](https://img.shields.io/badge/license-EUPL--1.2-blue)
![Tests: 18/18](https://img.shields.io/badge/smoke--tests-18%2F18-brightgreen)
![UI tests: 25/25](https://img.shields.io/badge/ui--tests-25%2F25-brightgreen)

## Como executar

Não precisa de instalação. Basta abrir o ficheiro num browser:

```
open editor/index.html        # macOS
xdg-open editor/index.html    # Linux
start editor/index.html       # Windows
```

Ou servir localmente (recomendado para evitar restrições file://):

```bash
cd editor
python -m http.server 8000
# abrir http://localhost:8000/
```

Funciona offline. Os dados ficam apenas no browser (localStorage).

## O que faz

1. **Ecrã de escolha** — 9 cards, um por tipo de ato AKN-PT v0.1.0.
2. **Editor de 3 painéis**:
   - **Esquerda**: TOC (estrutura do documento)
   - **Centro**: corpo do diploma — preface + recitals + articulado + conclusões + anexos
   - **Direita**: 7 tabs — Metadados / Pegada legislativa / **Referências** / **Comentários** / **Assistente IA** / XML / Validação
3. **Templates ricos por tipo**: cada tipo carrega um template pré-preenchido com legística realista (DL com articulado típico, Lei AR, **Portaria com habilitante + modelo em anexo**, RCM com pontos resolutivos em verbo no infinitivo, etc.). O utilizador apaga ou edita o que não quer.
4. **Subtipo-aware**: trocar subtipo (e.g. de DL ordinário para DL autorizado) carrega a fórmula promulgatória correcta.
5. **Adição dinâmica**: novos artigos, números, alíneas, anexos, considerandos — tudo com eIds auto-gerados.
6. **Pegada legislativa**: UI dedicada para `<workflow>` + `<step>` + `<input>`, com vocabulário controlado conforme Lei n.º 5-A/2026. Aviso visível quando obrigatória (publicação ≥ 2026-07-27).
7. **Validação client-side**: badges live no topo (OK / avisos / erros) com lista detalhada na tab "Validação".
8. **Preview HTML**: visualização do documento como seria renderizado.
9. **Export AKN-PT XML**: download de ficheiro `.akn.xml` válido contra XSD + Schematron.
10. **Save/load draft**: localStorage automático em cada alteração; recuperável a partir do ecrã inicial.
11. **Import de diploma não marcado** — três caminhos:
    - **Colar texto**: cole o texto puro do diploma (e.g. copy-paste de `dre.pt`) e o parser heurístico detecta tipo, número, ementa, considerandos, articulado, alíneas, signatures.
    - **Carregar `.docx`**: usa `mammoth.js` (CDN) para extrair texto, depois aplica o mesmo parser.
    - **Carregar `.akn.xml`**: round-trip de documento AKN-PT existente — útil para revisão / continuação de trabalho.
12. **Export multi-formato** (botão ▾ junto a "Exportar XML"): além de AKN-PT XML, gera **PDF** (via popup print) e **Word** (`.doc` com HTML+MSO).
13. **Versionamento local com diff**: botão "Snapshots" no topo — cria fotografias nomeadas em localStorage, lista todas (com auto-snapshots antes de cada export), permite carregar uma snapshot anterior ou **comparar** com o rascunho actual (diff word-level com inserções a verde / remoções a vermelho).
14. **Comentários ancorados em eId**: cada artigo / parágrafo tem botão 💬 que abre uma thread; comentários com autor opcional, replies, resolver/reabrir. Vivem em `doc.comments` (viajam com o rascunho) mas não entram no XML por defeito.
15. **Resolução automática de referências cruzadas** (tab "Referências"): "artigo 3.º" gera `<ref href="#art_3">`, "Lei n.º 5/2026" → URI ELI-PT, "Diretiva (UE) 2019/1937" → URI ELI europeu. Anti-falso-positivo: ignora se o contexto indica externo ("da Constituição", "do referido diploma"); só emite refs internas se o eId alvo existir.
16. **Modo "alteração de diploma existente"** (link na landing): carrega um XML AKN-PT alvo, lista o seu articulado em modo leitura, permite escolher operações por artigo (substituir / revogar / aditar) e exporta (a) o XML do **diploma alterador** com `<quotedStructure startQuote="«" endQuote="»">` e (b) a **versão consolidada** (alvo com alterações aplicadas).
17. **Assistente IA** (tab "IA"): chave da API Anthropic guardada localmente (sem servidor intermédio); tarefas pré-definidas com prompts curados para legística PT — **nota justificativa**, **simplificar texto**, **detectar ambiguidade**, **sugerir epígrafe**, **sumário executivo**. Modo mock (sem chave) para testar UI offline.
18. **Bluebell-PT** (tab "Texto"): autoria plain-text estilo Markdown (`ARTIGO 1.º — Título`, indentação, `1 -`, `a)`, `i)`, `PREAMBLE`, `FORMULA`, `ANEXO`) com compilação bidireccional para AKN-PT. Útil para colar de Word ou escrever sem ratar. Stable em roundtrip (serialize → parse → serialize).
19. **Colaboração cross-tab + partilha por URL** (tab "Partilhar"): duas tabs do mesmo browser sincronizam em tempo real via BroadcastChannel; "Partilhar por URL" gera link com o doc comprimido (gzip) no hash — quem abrir vê o mesmo documento, browser-side, sem upload.
20. **LoDA inline** (modo alterador): além das operações wholesale (substituir/revogar/aditar), pode-se editar o texto de cada parágrafo do alvo directamente; diff word-level (verde/vermelho) aparece logo abaixo e é empacotado como alteração ao gerar o XML do alterador.
21. **Export AKN-PT com comentários** (opção no dropdown): emite os comentários abertos como `<authorialNote marker="✎">` ancorados ao último `<p>` do elemento alvo — `<authorialNote>` é o elemento inline canónico do AKN.
22. **Autocomplete contra base mock DRE**: campos de URI/label do habilitante mostram sugestões a partir de ~30 diplomas reais (Código Civil, Código do Trabalho, CPA, CCP, Lei 5-A/2026, …) + diretivas UE relevantes. Substituível em produção por API real do INCM/DRE.

## Capacidades por tipo de ato

| Tipo | Template | Coverage |
|---|---|---|
| Decreto-Lei | Completo (5 subtipos) | ✓ Full |
| Lei | Completo (5 subtipos) | ✓ Full |
| Portaria | Completo (3 subtipos) | ✓ Full |
| Resolução do CM | Completo (3 subtipos; body com `<paragraph>`) | ✓ Full |
| Decreto da AR | Skeleton (3 subtipos) | Skeleton |
| Resolução da AR | Skeleton (4 subtipos; body com `<paragraph>`) | Skeleton |
| Despacho normativo | Skeleton (2 subtipos) | Skeleton |
| Decreto Legislativo Regional | Skeleton (2 subtipos; pt-20/pt-30) | Skeleton |
| Decreto Regulamentar Regional | Skeleton (2 subtipos; pt-20/pt-30) | Skeleton |

## Validar o XML exportado

```bash
# Exportar via editor → download .akn.xml para um sítio qualquer
python -m akn_pt validate o-meu-doc.akn.xml --phase publication
python -m akn_pt validate o-meu-doc.akn.xml --phase publication --json
```

## Smoke tests

Verifica que o editor gera XML válido para os 9 tipos de actos AKN-PT
e para as features avançadas (alteração, comentários, inline edits):

```bash
node editor/smoke-test.js                          # gera 19 ficheiros em editor/.smoke-output/
python -m akn_pt batch editor/.smoke-output         # valida — 18/18 deve passar
```

Cenários cobertos (9 tipos × 1 baseline + 10 features):

- `dec-lei-simple` — DL ordinário básico (template rico)
- `dec-lei-with-footprint` — DL pós-2026-07-27 com `<workflow>` + `<input>` (pegada legislativa)
- `lei-simple` — Lei AR com assinaturas PAR + PR + PM
- `portaria-simple` — Portaria com lei habilitante (`<ref>` injectado via campo "Habilitante")
- `rcm-simple` — RCM com body em `<paragraph>` (sem `<article>`)
- `dlr-acores` — DLR Açores (jurisdição `pt-20`, Representante da República)
- `decreto-ar-simple` — Decreto da AR aprovando convenção (PAR + PR)
- `despacho-simple` — Despacho normativo ministerial com habilitante
- `drr-acores-simple` — DRR Açores com habilitante (Governo Regional)
- `dec-lei-with-subalineas` — `<point>` com `<list>` aninhada (i, ii, iii)
- `dec-lei-with-insertions` — exercita insertArticleAt + renumberArticles
- `dec-lei-with-refs` — refs internas + externas PT + UE resolvidas
- `amender` + `consolidated` — modo alterador com `<quotedStructure>`
- `bluebell-roundtrip` — Bluebell-PT serialize/parse estável
- `loda-inline` — edição word-level no modo alterador
- `with-comments` — `<authorialNote>` injectados
- **`imported-portaria`** — Portaria importada a partir de texto não marcado (parser heurístico → state → exporter)

## Import: como funciona o parser

O parser heurístico (`js/import-parser.js`) detecta convenções legísticas portuguesas:

| Padrão | Detecção |
|---|---|
| `Decreto-Lei n.º X/YYYY` (e variantes para Lei, Portaria, RCM, etc.) | Tipo de ato + número + ano |
| `de DD de MMMM` | Data de publicação |
| Linha após cabeçalho com >15 chars | Ementa (short title) |
| `Considerando que ...` | Recital |
| `Assim:` / `Manda o Governo` / `A Assembleia da República decreta` | Fórmula promulgatória |
| `Artigo N.º — Título` ou `Artigo N.º` seguido de linha-título | Article com num + heading |
| `Artigo 5.º-A` | eId `art_5_a` |
| `1 -`, `2 -` no início de linha | Paragraph (número) |
| `a)`, `b)` no início de linha | Point (alínea) |
| `Anexo I`, `Anexo (a que se refere ...)` | Attachment |
| `Visto e aprovado em CM`, `Promulgado em`, `Referendado em` | Lifecycle events + signatures |
| Subtipos: "alínea b) art. 198.º" → `dec-lei-autorizado`, "transpõe Diretiva" → `dec-lei-transposicao`, etc. | Subtype heuristics |
| Habilitante: `Decreto-Lei n.º X/Y` no preâmbulo de Portaria/Despacho/DRR | Converte automaticamente para URI ELI-PT |

**Limitações conhecidas:**
- Não preserva formatação inline (`<b>`, `<i>`)
- Refs cruzadas inline ainda não são detectadas (só habilitante)
- Capítulos/secções não detectados (assume articulado plano)
- Assinaturas inferidas por tipo de ato (não extrai nomes do texto)
- Quotedstructure em diplomas alteradores não suportado

O resultado é sempre o ponto de partida — utilizador confirma e corrige no editor antes de exportar.

## Arquitectura

```
editor/
├── index.html             # SPA: landing + editor + modais (preview, import)
├── css/editor.css         # ~700 linhas; aesthetic institucional sóbrio
├── js/
│   ├── templates.js       # 9 tipos × subtipos + templates ricos + 14 step types + 13 input types + fórmulas
│   ├── state.js           # mutações sobre o doc; persistência localStorage
│   ├── akn-export.js      # serialização AKN-PT XML (compatible com XSD + Schematron)
│   ├── validation.js      # 20+ checks client-side (basicos)
│   ├── preview.js         # rendering HTML do documento
│   ├── import-parser.js   # 3 importadores: texto livre, DOCX (via mammoth), AKN-PT XML round-trip
│   └── editor.js          # UI: renderiza painéis, liga eventos, refresh em cada update
├── smoke-test.js          # gera 7 ficheiros (6 templates + 1 import) e valida via akn-pt
└── README.md              # este ficheiro
```

Sem frameworks. Vanilla JS. Toda a lógica é inspecionável e modificável sem
build step.

## Validação cliente vs servidor

O editor faz **validação básica client-side** (campos obrigatórios, eIds
únicos, signatures por tipo, pegada obrigatória pós-cutoff). **Não substitui**
a validação completa via `akn-pt validate` que executa o XSD + Schematron
oficial.

Limitações cliente-side:
- Não verifica conformidade do URI ELI-PT contra o regex completo
- Não verifica todos os patterns Schematron (apenas os mais óbvios)
- Não detecta refs internas órfãs (`href="#xxx"` para eId inexistente)

Para validação completa: exportar XML e correr `akn-pt validate`.

## Features experimentais (escondidas por defeito)

Algumas features ficam atrás de um flag `?lab=1` (ou `localStorage.setItem('akn-pt-lab','1')`)
para reduzir a superfície cognitiva da demo principal. Não estão removidas —
são funcionais e testadas pelo smoke-test, mas não aparecem na UI por defeito:

| Feature | Como activar |
|---|---|
| **Bluebell-PT** (autoria plain-text) | `http://localhost:8000/?lab=1` ou `localStorage.setItem('akn-pt-lab','1')` |
| **Colaboração cross-tab + partilha por URL** | idem |
| **Export AKN-PT com comentários** (`<authorialNote>`) | idem (até revisão Palmirani) |
| **LoDA inline** (edição word-level no modo alterador) | idem |

A linha de raciocínio: demonstração v0.1.0 deve mostrar **menos, melhor**.
Quem queira experimentar todas as features avançadas usa `?lab=1`.

## Features que NÃO estão em v0.1.0 (planeadas para v0.1.1+)

- **Referências cruzadas inline** (`<ref>` no meio de texto livre) — actualmente só via campo "Habilitante" ou texto literal
- **Casos especiais**: republicação técnica (anexo com prefixo `rep__`), `<quotedStructure>` para alterações
- **Hierarquia profunda**: `<book>`, `<part>`, `<title>`, `<chapter>`, `<section>` — actualmente só `<article>` directo em `<body>`
- **Drag-and-drop** para reordenar artigos
- **Múltiplos signatários por papel** com nomes pré-preenchidos da ontologia
- **Suporte EuroVoc** classification
- **Parser AI-assisted** (LLM-based) para diplomas com formatação atípica
- **Modo escuro**

### Já incluído (CP5+)

- ✅ **Templates ricos por tipo** (Portaria especial — com habilitante + modelo em anexo)
- ✅ **Import de DOCX** via mammoth.js
- ✅ **Import de XML AKN-PT** existente (round-trip)
- ✅ **Import de texto não marcado** com parser heurístico

## Demo

Sequência típica de demo (5 min):

1. Abrir `editor/index.html` no browser
2. Escolher "Decreto-Lei" (card vermelho-azulado)
3. Editor abre com template — preencher número (e.g. "150"), data, ementa
4. Trocar subtipo para "Autorizado" — fórmula promulgatória actualiza
5. Adicionar 1 artigo (+ alínea, + número)
6. Tab "Pegada" → adicionar 4 steps (iniciativa → consulta-pública → aprovacao-cm → publicacao)
7. Tab "XML" → ver XML gerado em tempo real
8. Tab "Validação" → ver checks client-side
9. Botão "Preview HTML" → ver renderização limpa
10. Botão "Exportar AKN-PT XML" → download do ficheiro
11. No terminal: `python -m akn_pt validate downloaded-doc.akn.xml --phase publication`
12. → "Validation passed: 0 errors, 0 warnings"

### Demo alternativa — fluxo de import (3 min)

1. Na landing: clicar "Importar diploma não marcado"
2. Aba "Exemplo" → "Carregar exemplo de Portaria"
3. O editor abre populated com: tipo Portaria, número 249/2021, ementa, 3 artigos (incluindo alíneas), anexo, signature do ministro, **habilitante (DL 56/2021) detectado automaticamente** e convertido para URI ELI-PT
4. Verificar tab "Validação" → tudo verde
5. Botão "Exportar" → validar com `akn-pt validate`

Ou, mais realista:
1. Copiar texto de um diploma real de `dre.pt`
2. Aba "Colar texto" → colar → "Importar texto"
3. Editor abre com estrutura detectada — utilizador confirma/corrige
4. Exportar AKN-PT XML

## Inspirações

- **LEOS** (Comissão Europeia) — arquitectura de painéis, conceito de templates por tipo
- **Senato della Repubblica AKN editor** — discriminação visual entre tipos de elementos
- **Lawmaker (UK National Archives)** — auto-numeração, validação live
- **Bungeni Editor** (Africa i-Parliaments) — UX para drafters sem background técnico

## Licença

EUPL-1.2. Veja `LICENSE` na raiz do projecto.
