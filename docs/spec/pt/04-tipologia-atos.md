# 4. Tipologia dos atos cobertos

## 4.1 Critério de cobertura

A tipologia da v0.1.0 reflecte o seguinte critério de prioridade:

1. **Frequência e impacto** no DRE 1.ª série.
2. **Centralidade institucional** do tipo no ciclo legislativo PT.
3. **Estabilidade** da forma — tipos com convenção legística madura entram
   antes; tipos com formato em mudança ficam para versões posteriores.

Resultado: 9 tipos de ato cobertos (4 com cobertura completa, 5 com
cobertura skeleton); tudo o resto fica para v0.2+.

## 4.2 Catálogo completo (v0.1.0)

| `@name` | Tipo PT | Base CRP / legal | Autoridade | Promulgação? | Cobertura |
|---|---|---|---|---|---|
| `dec-lei` | Decreto-Lei | Art. 198.º, n.º 1 | Governo (CM) | Sim (PR) | Completa |
| `lei` | Lei | Arts. 161.º, 164.º | Assembleia da República | Sim (PR) | Completa |
| `portaria` | Portaria | Lei habilitante específica | Ministro(s) | Não | Completa |
| `res-cm` | Resolução do CM | Art. 200.º; LO do Governo | Conselho de Ministros | Não | Completa |
| `decreto-ar` | Decreto da AR | Art. 166.º, n.º 5 | AR | Sim (PR) | Skeleton |
| `res-ar` | Resolução da AR | Art. 166.º, n.º 5 | AR | Não | Skeleton |
| `despacho-normativo` | Despacho normativo | Lei habilitante específica | Ministro(s) | Não | Skeleton |
| `dlr` | Decreto Legislativo Regional | Arts. 227.º al. a), 232.º | ALR (Açores ou Madeira) | Sim (Representante da República) | Skeleton |
| `drr` | Decreto Regulamentar Regional | Art. 227.º al. d) | Governo Regional | Sim (Representante da República) | Skeleton |

"Cobertura completa" significa: mapping detalhado, schema completo, regras
Schematron específicas e pelo menos um exemplo no corpus.
"Skeleton" significa: mapping presente, schema declarado, sem exemplo no
corpus (será acrescentado em v0.1.x ou v0.2).

## 4.3 Subtipos (`<FRBRsubtype>`)

Cada tipo tem subtipos catalogados para fazer disambiguação semântica sem
exigir mais um nível de elemento estrutural.

### Decreto-Lei

| Subtipo | Significado |
|---|---|
| `dec-lei-ordinario` | Alínea a) do n.º 1 do art. 198.º — matéria não reservada à AR |
| `dec-lei-autorizado` | Alínea b) — uso de autorização legislativa da AR |
| `dec-lei-parlamentar` | Alínea c) — desenvolvimento de princípios/bases gerais |
| `dec-lei-transposicao` | DL que transpõe directiva da UE (subtipo cumulativo) |
| `dec-lei-alterador` | DL cujo objecto é alterar diploma anterior (subtipo cumulativo) |

### Lei

| Subtipo | Significado |
|---|---|
| `lei-comum` | Competência da alínea c) do art. 161.º |
| `lei-organica` | N.º 2 do art. 166.º — reserva qualificada |
| `lei-de-bases` | Lei que estabelece bases gerais a desenvolver por DL |
| `lei-autorizacao` | Autorização legislativa ao Governo (al. d) do art. 161.º) |
| `lei-de-revisao` | Lei de Revisão Constitucional |

### Decreto da AR

| Subtipo | Significado |
|---|---|
| `decreto-ar-tratado` | Aprovação de convenção/tratado internacional |
| `decreto-ar-mandato` | Declarações sobre mandato presidencial; declarações de guerra; etc. |
| `decreto-ar-outros` | Outras matérias atribuídas pela CRP |

### Resolução da AR

| Subtipo | Significado |
|---|---|
| `res-ar-recomendacao` | Recomendação ao Governo |
| `res-ar-aprovacao` | Aprovação de documento (regimento, programa) |
| `res-ar-politica` | Declarações, votos, posições |
| `res-ar-cessacao-vigencia` | Cessação de vigência de DL autorizado (art. 169.º CRP) |

### Portaria

| Subtipo | Significado |
|---|---|
| `portaria-regulamentar` | Regulamento de execução de lei/DL |
| `portaria-execucao` | Mera execução (aprovação de modelo, tabela) |
| `portaria-extensao` | Extensão de convenção colectiva (Direito do Trabalho) |

### Resolução do CM

| Subtipo | Significado |
|---|---|
| `res-cm-normativa` | RCM com normatividade (aprova plano, estratégia vinculativa) |
| `res-cm-politica` | RCM puramente política (declaração, posição) |
| `res-cm-administrativa` | RCM com efeito interno (grupo de trabalho, autorização de despesa) |

### Despacho normativo

| Subtipo | Significado |
|---|---|
| `despacho-normativo` | Despacho normativo individual |
| `despacho-conjunto` | Despacho assinado por dois ou mais ministros |

### DLR

| Subtipo | Significado |
|---|---|
| `dlr-ordinario` | DLR no âmbito da competência regional |
| `dlr-autorizado` | Desenvolvimento de bases definidas por lei da AR |

### DRR

| Subtipo | Significado |
|---|---|
| `drr-execucao` | Execução de DLR ou lei nacional |
| `drr-regulamentar` | Regulamentação autónoma no âmbito regional |

## 4.4 Tipos explicitamente fora de escopo

Por razões substantivas distintas, ficam fora da v0.1.0:

| Tipo / categoria | Razão da exclusão |
|---|---|
| Jurisprudência (acórdãos TC, STJ, STA, TRs) | AKN tem modelo `<judgment>` distinto; merece artefacto próprio |
| Atos administrativos (alvarás, licenças, decisões individualizadas) | Natureza individual, não normativa |
| Atos pré-1976 | Convenções legísticas distintas; necessitam estudo histórico |
| Orçamento do Estado | Regime próprio (LEO); peso/complexidade justifica tratamento à parte |
| Comunicações ao TC | Procedimentais; não normativas |
| Avisos do BdP, CMVM, ASF e outros reguladores independentes | Publicação por canais próprios; fora da soberania técnica SGGOV |
| Avisos administrativos (concursos, etc.) | Não normativos |

Estes tipos **não devem** ser identificados sob slugs AKN-PT v0.1.0; usar
slug fora do catálogo ou inventar slugs alternativos viola conformance.

## 4.5 Tipos de "alteração" — não são tipo próprio

Construções legísticas que **modificam** outros actos não constituem tipo
próprio do `@name`:

- **Retificação** (Declaração de Retificação) — em v0.1 marca-se como
  instância em `<analysis>/<activeModifications>` do diploma alvo (quando a
  consolidação for produzida em v0.2+). O texto da retificação fica em corpus
  separado com tipo a definir em v0.2.
- **Alteração** de diploma anterior — marca-se como subtipo cumulativo do
  diploma alterador (e.g. `dec-lei-alterador` num DL ordinário que altera
  outro DL).
- **Republicação técnica** — não é tipo; é construção interna do diploma
  alterador (anexo com `<mainBody>` contendo o texto integral do diploma
  republicado, com prefixo de eId `rep__`).

Ver [cap. 11](11-ciclo-vida.md) para o tratamento dinâmico destes casos.

## 4.6 Cruzamento `@name` × estrutura sumarizado

A coerência entre o tipo (`@name`) e a estrutura interna esperada é validada
pelo Schematron. Tabela sumária para referência rápida:

| `@name` | Body típico | Conclusions canónica |
|---|---|---|
| `dec-lei` | `<article>+` (eventualmente com chapters/sections) | conclusion + countersignature (PM) + promulgation (PR) + countersignature (ministros) |
| `lei` | `<article>+` | conclusion + signature (PAR) + promulgation (PR) + countersignature (PM, único) |
| `decreto-ar` | `<article>+` (curto) | signature (PAR) + promulgation (PR) |
| `res-ar` | `<paragraph>+` (sem `<article>`) | signature (PAR) |
| `portaria` | `<article>+` (curto) | signature (ministerial, 1+ ) |
| `res-cm` | `<paragraph>+` (sem `<article>`) | signature (PM, única) |
| `despacho-normativo` | `<article>+` (curto) | signature (ministerial, 1+ ) |
| `dlr` | `<article>+` | signature (PALR) + promulgation (RR Açores/Madeira) |
| `drr` | `<article>+` | signature (Pres. GR) + promulgation (RR Açores/Madeira) |

O detalhe de cada tipo está no [capítulo 6](06-mapeamento-estrutural.md).
