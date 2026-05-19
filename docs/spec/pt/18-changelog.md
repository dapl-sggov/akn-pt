# 18. Changelog

Histórico de versões da especificação. Para o changelog completo do projecto
AKN-PT (todos os artefactos), ver `CHANGELOG.md` na raiz do repositório.

## [0.1.0+editor] — 2026-05-18 (em andamento; previsto para v0.1.1)

### Adicionado

- **Editor web de demonstração** (`editor/`) com templates ricos por tipo de ato,
  import de diploma não marcado (colar texto, upload `.docx` via mammoth.js,
  round-trip de XML AKN-PT), pegada legislativa, validação client-side e
  export AKN-PT XML.
- **Edição estrutural** no editor: inserir artigo/parágrafo em qualquer posição
  (não apenas no fim), mover ↑/↓, e renumeração automática consistente
  (`<num>` visível e `eId`) ao reordenar — durante a fase `drafting`. Renames
  propagam-se aos descendentes (`art_N__para_M`, `…__lit_X`, `…__sublit_Y`).
  `<num>` não-standard (ex. `Artigo 5.º-A`) é preservado.
- **Export multi-formato no editor**: para além de AKN-PT XML, agora exporta
  também PDF (via popup print) e Word `.doc` (HTML+MSO namespace, sem
  dependências externas).
- **Versionamento local**: snapshots nomeados em `localStorage`, comparação
  entre versões com diff word-level (algoritmo LCS), inserções/remoções
  marcadas a verde/vermelho e auto-snapshot antes de cada export. UI dedicada
  com modal "Snapshots" e modal "Comparar versões".
- **Comentários ancorados em eId**: thread por artigo/parágrafo, autor opcional,
  resolve/reabre, replies. Comentários vivem em `doc.comments` (viajam com o
  rascunho) mas NÃO entram no XML por defeito (preserva pureza normativa).
- **Resolução automática de referências cruzadas** no XML exportado e na
  preview HTML:
  - Internas: "artigo 3.º", "n.º 2 do artigo 5.º", "alínea a) do n.º 1
    do artigo 4.º", "subalínea i) da alínea b) do n.º 2 do artigo 5.º"
    → `<ref href="#art_…">…</ref>`. Anti-falso-positivo: ignora se o
    contexto indica externo ("da Constituição", "do referido diploma",
    "do Decreto-Lei…") e só emite se o eId alvo existir.
  - Externas PT: "Decreto-Lei n.º 21/2023", "Lei n.º 5/2026",
    "Portaria n.º 249/2021", "Resolução do CM…" → URI ELI-PT.
  - Externas UE: "Diretiva (UE) 2019/1937" → `data.europa.eu/eli/dir/…`.
- **Modo "alteração de diploma existente"**: carrega XML AKN-PT do alvo,
  permite seleccionar operações por artigo (substituir / revogar / aditar
  após / aditar antes) e gera (a) o XML do diploma alterador com `<article>
  + <quotedStructure startQuote="«" endQuote="»">` (convenção do corpus
  `dl-78-2021`, prefixo `quoted__` nos eIds para unicidade) e (b) a versão
  consolidada (alvo com alterações aplicadas).
- **Assistente IA**: chamadas directas à API Anthropic com chave fornecida
  pelo utilizador e guardada localmente. Tarefas pré-definidas com system
  prompts curados para legística PT: nota justificativa, simplificar texto,
  detectar ambiguidade, sugerir epígrafe, sumário executivo. Modo mock (sem
  chave) para testar UI offline.
- **Bluebell-PT** (autoria plain-text): formato indentado estilo Markdown
  (`ARTIGO 1.º — Título`, `1 -`, `a)`, `i)`, `PREAMBLE`, `FORMULA`, `ANEXO`)
  com parse → doc state e serialize → texto. Bidireccional, estável em
  roundtrip. Tab dedicada no editor permite alternar entre autoria visual
  e textual.
- **Colaboração cross-tab (BroadcastChannel)**: alterações no editor
  sincronizam-se entre tabs do mesmo browser em tempo real. Indicador
  "● N" no topbar mostra o número de tabs ligadas.
- **Partilha por URL**: doc inteiro codificado e comprimido (gzip via
  CompressionStream nativa) num hash `#share=…`. Link copiável; quem o
  abrir carrega o doc automaticamente. Cap de ~32 KB; documentos maiores
  exigem export XML.
- **LoDA inline (Track Changes no modo alterador)**: além das operações
  ao nível do artigo (substituir/revogar/aditar), pode-se agora editar o
  texto de qualquer parágrafo do diploma alvo directamente; o editor
  mostra diff word-level abaixo (verde/vermelho) e as alterações são
  empacotadas como `replace` ao gerar o XML do alterador.
- **Comentários no XML exportado** (opcional): "Exportar AKN-PT XML +
  comentários" injecta os comentários abertos como `<authorialNote
  marker="✎" eId="note_…">…</authorialNote>` ancorados ao último `<p>` do
  elemento alvo. Aproveita o elemento inline canónico do AKN.
- **Autocomplete contra base mock DRE**: campos de "habilitante" (URI
  ELI-PT e label humano) ganham popover de sugestões a partir de ~30
  diplomas portugueses frequentemente citados (Código Civil, Código do
  Trabalho, CPA, CCP, Lei n.º 5-A/2026, etc.) + diretivas UE relevantes.
  Em produção esta base seria substituída por API real do DRE/INCM.
- **Subalíneas (i, ii, iii)** documentadas explicitamente como `<point>` com
  `<list>` recursiva — cap. 5 §"Subalíneas" e cap. 15 §15.2.1. Schema XSD já
  aceitava; foi gap apenas documental.
- **Convenção "parágrafo sem `<num>`"** documentada — quando o artigo tem um
  único parágrafo, omite-se `<num>`; quando passa a ter mais que um, todos
  ganham número (auto-numeração no editor de referência).
- Schema test positive `dec-lei-with-subalineas.akn.xml` (regressão).
- Corpus `dl-21-2023.akn.xml` enriquecido com Art. 5.º contendo subalíneas
  reais (modalidades de retaliação na transposição da Diretiva 2019/1937).
- Mapping `_common-patterns.md` ganhou secção "Subalíneas" com exemplo XML
  completo.

## [0.1.0] — 2026-05-18

### Adicionado

- Capítulos 1 a 18 (versão inicial completa, em PT).
- **Capítulo 12** dedicado à pegada legislativa (Lei n.º 5-A/2026), com
  vocabulário controlado (`WorkflowStepTarget`, `ContributionType`), schema
  (`<workflow>`, `<step>`, `<input>`, `<affects>`) e regras Schematron de
  obrigatoriedade a partir de 2026-07-27.
- Sumário executivo em EN (`../en/executive-summary.md`).
- Technical overview em EN (`../en/technical-overview.md`).
- Catálogo completo de 9 tipos de ato no escopo da v0.1.0:
  - Cobertura completa: Decreto-Lei, Lei, Portaria, Resolução do CM.
  - Cobertura skeleton: Decreto AR, Resolução AR, Despacho normativo, DLR, DRR.
- Catálogo de subtipos por tipo (`<FRBRsubtype>`).
- Mapping conceptual completo (PT structure → AKN element), com fórmulas
  promulgatórias catalogadas por subtipo.
- Modelo FRBR materializado em AKN-PT (Work / Expression / Manifestation).
- Especificação ELI-PT (cap. 8 deste documento + especificação dedicada em
  `eli-pt/`).
- Modelo de validação em três fases (drafting / review / publication) —
  ADR-0004.
- Modelo de actores em `<references>` com 6 tipos TLC (Organization, Person,
  Role, Concept, Location, Event).
- Tratamento de Regiões Autónomas via `pt-20` (Açores) e `pt-30` (Madeira)
  (cap. 10).
- Casos especiais catalogados: Artigo X.º-A, alteração com
  `<quotedStructure>`, republicação técnica, vacatio legis, DL autorizado,
  DL de transposição (cap. 11).
- Glossário PT-EN (cap. 16).
- Bibliografia (cap. 17).

### Decidido (com link para ADR)

- Modelo de governação híbrido — [ADR-0001](../../adr/0001-project-governance.md).
- Licença EUPL-1.2 — [ADR-0002](../../adr/0002-license.md).
- Monorepo GitHub — [ADR-0003](../../adr/0003-repository-strategy.md).
- Conformance em três fases — [ADR-0004](../../adr/0004-conformance-level.md).
- Namespace OASIS canónico + perfil em `<FRBRformat>` — [ADR-0005](../../adr/0005-namespace-uri-versioning.md).
- Línguas por artefacto (PT body, EN summary; código EN) — [ADR-0006](../../adr/0006-documentation-languages.md).
- Escopo de v0.1.0 — [ADR-0007](../../adr/0007-scope-v0-1-0.md).
- Stack do validador: Python 3.12+ + lxml — [ADR-0008](../../adr/0008-validator-stack.md).
- ELI-PT com domínio placeholder `eli.gov.pt` em v0.1; final por coordenação
  INCM — [ADR-0009](../../adr/0009-eli-pt-domain.md).
- Modelo de revisão externa por milestone — [ADR-0010](../../adr/0010-external-review.md).

### Estado

- 10 ADRs em estado **Proposed**.
- Schema XSD modular (4 ficheiros).
- Schematron com 8 patterns e 3 fases.
- Test suite: 39/39 verde (9 positivos, 20 XSD-negativos, 10 Schematron-negativos).
- Corpus: 10 documentos reais marcados.
- Validador: Python (CLI + lib + Docker + CI).

## Versões anteriores

Não há. v0.1.0 é a versão fundadora — antes desta existiu apenas o draft
v0.0.1 do mapping para DL/Portaria/RCM (`mapping/v0.0.1/`), não publicado
formalmente.

## Próximas versões previstas

### v0.1.1 (patch — clarificações)

- Validação de coerência entre `<num>Artigo 5.º</num>` e `eId="art_5"`
  (warning).
- Imposição de URI `data.europa.eu/eli/dir/...` para directivas UE em DLs de
  transposição (error).
- Correção de qualquer ambiguidade detectada por revisores externos
  (Palmirani, Fitsilis).

### v0.2.0 (minor — extensões compatíveis)

- `<analysis>` preenchido por consolidação automática.
- Classificação EuroVoc obrigatória.
- Suporte a pegada legislativa estruturada (Lei n.º 5-A/2026).
- Tipo `acordao` (jurisprudência) com modelo separado (artefacto próprio).
- Tipo `retificacao` para declarações de retificação.

### v1.0.0 (major — após estabilização institucional)

- Migração para `xs:import + xs:restriction` (XSD com AKN base como
  dependência).
- Domínio ELI-PT final (`data.dre.pt` ou outro).
- Acordo institucional consolidado (SGGOV + INCM + AR via Comissão Técnica
  AKN-PT).
- Integração documentada em produção (SmartLegis + DRE).

## Política de evolução

Per [cap. 2 §2.8](02-conformidade.md#28-conformance-temporal--política-de-evolução)
e ADR-0005:

- **PATCH** não introduz mudanças que invalidem documentos antigos.
- **MINOR** adiciona elementos opcionais, novos tipos, novos subtipos — sem
  invalidar documentos antigos.
- **MAJOR** pode introduzir mudanças não-compatíveis; documentos antigos
  continuam válidos contra o seu próprio schema (versionado em path).
