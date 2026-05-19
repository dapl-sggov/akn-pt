# 8. Identificadores — eId, FRBR URI, ELI-PT

O AKN-PT distingue três famílias de identificadores, cada uma com finalidade
e regras próprias:

| Família | Identifica | Visibilidade | Exemplo |
|---|---|---|---|
| `eId` | Fragmentos internos do documento | Interno; estável por documento | `art_5__para_1__lit_a` |
| FRBR URI | A obra (Work), versão (Expression) ou ficheiro (Manifestation) | Global; resolúvel | `https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt` |
| ELI-PT (sub-conjunto canónico de FRBR URI) | Identificação institucional do ato | Global; permanente | (mesma forma que FRBR URI) |

## 8.1 eIds — identificadores internos

### Forma

Dois sub-formatos são aceites, conforme o uso:

| Sub-formato | Quando usar | Padrão regex |
|---|---|---|
| snake_case com `__` separador | Articulado (artigos, números, alíneas, anexos, considerandos, eventos) | `[a-z]+(_[a-z0-9]+)*((__)[a-z]+(_[a-z0-9]+)*)*` |
| kebab-case com hífenes | TLC actors em `<references>` | `[a-z][a-z0-9\-]*` |

A regex agregada do XSD (`EIdType`) aceita ambas as formas.

### Catálogo de eIds canónicos

| Construto | eId pattern | Exemplo |
|---|---|---|
| Artigo | `art_N` | `art_5` |
| Artigo X.º-A inserido | `art_N_X` | `art_5_a` |
| Número de artigo | `art_N__para_M` | `art_5__para_2` |
| Alínea | `art_N__para_M__lit_X` | `art_5__para_2__lit_a` |
| Subalínea | `art_N__para_M__lit_X__sublit_Y` | `art_5__para_2__lit_a__sublit_i` |
| Capítulo | `cap_N` | `cap_2` |
| Secção | `cap_N__sec_M` | `cap_2__sec_3` |
| Subsecção | `cap_N__sec_M__ssec_K` | `cap_2__sec_3__ssec_1` |
| Título (acima de capítulo) | `tit_N` | `tit_1` |
| Parte | `prt_N` | `prt_1` |
| Livro | `lvr_N` | `lvr_1` |
| Considerando | `rec_N` | `rec_3` |
| Anexo | `anx_N` | `anx_1` |
| Ponto resolutivo (RCM/Res-AR) | `para_N` | `para_2` |
| Sub-ponto de ponto resolutivo | `para_N__lit_X` | `para_2__lit_a` |
| Evento lifecycle | `eN` ou nome descritivo | `e1`, `e2`, `e3` |
| Republicação técnica em anexo | `rep__{eid-original}` | `rep__art_5` |
| `<quotedStructure>` interno | `quoted__{eid-original}` | `quoted__art_3` |

### Regras de invariância

1. **Unicidade.** No mesmo documento, todos os `eId` **DEVEM** ser únicos
   (validado pelo Schematron).
2. **Hierarquia coerente.** O eId de um filho **DEVE** começar pelo eId do pai
   seguido de `__` e do segmento próprio (e.g. `art_5__para_1` é filho de
   `art_5`).
3. **Persistência por documento.** Os eIds atribuídos a uma Expression
   **NÃO DEVEM** mudar em PATCHs de Manifestation (re-emissão de XML); podem
   mudar em nova Expression (consolidada), com mapeamento registado em
   `<analysis>` (v0.2+).
4. **Sem espaços, sem maiúsculas, sem caracteres não-ASCII**. O Schematron
   rejeita eIds que violem o padrão regex.

## 8.2 FRBR URI — identificação das três camadas

Cada camada FRBR tem dois sub-URIs:

- **`<FRBRuri>`** — identifica a camada como um todo (a obra, a versão, o ficheiro).
- **`<FRBRthis>`** — identifica este fragmento concreto da camada, em geral
  com sufixo `/!main` indicando que é o conteúdo principal.

### Work

```
https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt
                                              ← FRBRWork/FRBRuri
https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt/!main
                                              ← FRBRWork/FRBRthis
```

### Expression (versão textual)

```
https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt/2026-03-15
                                              ← FRBRExpression/FRBRuri
https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt/2026-03-15/!main
                                              ← FRBRExpression/FRBRthis
```

A data `2026-03-15` é o `point-in-time` — a data em que esta versão começou
a produzir efeitos. Versão originária pode omitir o segmento ou usar a data
de entrada em vigor; recomenda-se incluir explicitamente para consistência.

### Manifestation (ficheiro)

```
https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt/2026-03-15.xml
                                              ← FRBRManifestation/FRBRuri
https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt/2026-03-15.xml/!main
                                              ← FRBRManifestation/FRBRthis
```

O sufixo `.xml` identifica o formato concreto. Formatos alternativos
(`.html`, `.json`, `.pdf`) têm o seu próprio FRBR URI no mesmo padrão.

## 8.3 ELI-PT — o sub-conjunto institucional

ELI-PT é **a sub-forma de FRBR URI** que segue o template canónico (capítulo 3
da especificação ELI-PT). Todos os FRBR URIs em AKN-PT **DEVEM** ser URIs
ELI-PT bem formados, ou seja, satisfazer:

```
{domain}/eli/{jurisdiction}/{type}/{year}/{number}/{language}[/{point-in-time}][.{format}][/!main]
```

Onde:

- `{domain}` — `eli.gov.pt` em placeholder; final a fixar pela INCM
  (recomendação: `data.dre.pt`).
- `eli` — marcador literal (obrigatório por compatibilidade com ELI europeu).
- `{jurisdiction}` — `pt` (nacional), `pt-20` (Açores), `pt-30` (Madeira).
- `{type}` — slug do tipo (`dec-lei`, `lei`, …).
- `{year}` — ano de adopção (`YYYY`).
- `{number}` — número do ato dentro do ano.
- `{language}` — `pt` (sempre, para Portugal).

## 8.4 Fragmento — referência a parte do ato

Para referenciar um fragmento de um ato (interno ou externo), acrescenta-se
`#{eId}` ao URI:

```
https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt#art_5__para_2__lit_a
```

A granularidade até à alínea é **obrigatória** (per ELI-PT §7). Subalínea é
opcional. Abaixo disso (palavra, frase) fica fora de escopo.

## 8.5 Conversão entre URLs legados (dre.pt) e ELI-PT

URLs actuais do portal dre.pt da forma:

```
https://dre.pt/dre/detalhe/decreto-lei/22-2026-XXXXXXXX
```

têm equivalente ELI-PT:

```
https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt
```

A INCM **deveria** publicar redireccionamentos HTTP 301 dos URLs legados
para os ELI-PT correspondentes, preservando rastreabilidade. O conversor de
referência (`eli-pt/conversion.py`) implementa a transformação bidirecional.

## 8.6 Compromissos de permanência

Resumo (detalhe em `eli-pt/permanence-policy.md`):

| Camada | Permanência |
|---|---|
| Work URI | Permanente — para sempre |
| Expression URI | Permanente — para sempre, mesmo após nova consolidação |
| Manifestation URI | Permanente em condições normais; pode ser regenerado com HTTP 301 se a representação binária mudar |

Compromissos institucionais:

- URI nunca é reatribuído a outro ato.
- Migração de domínio (e.g. de `eli.gov.pt` para `data.dre.pt`) **pode**
  ocorrer uma vez, sempre acompanhada de HTTP 301.
- Mudanças de URI são auditadas em relatório anual da INCM (ELI-PT §10).

## 8.7 Como o XSD valida URIs

O `EliPtUriType` (em `schema/xsd/akn-pt-types.xsd`) impõe a forma básica
via regex:

```
https?://[a-z0-9.\-]+/eli/pt(-\d{2})?/[a-z\-]+/\d{4}/\d+/[a-z]{2,3}(/\d{4}-\d{2}-\d{2})?(\.[a-z]{3,4})?(/!main)?(#[A-Za-z0-9_]+)?
```

O Schematron acrescenta verificações de coerência semântica:

- O segmento `/{type}/` na FRBRuri Work **deve** coincidir com o `<act @name>`.
- O FRBRuri Expression **deve** começar com o FRBRuri Work.
- O FRBRuri Manifestation **deve** começar com o FRBRuri Expression.

## 8.8 Erros comuns a evitar

| Erro | Sintoma | Correcção |
|---|---|---|
| URI sem `/eli/` | Não casa o padrão; XSD rejeita | Acrescentar `/eli/` antes da jurisdição |
| Maiúsculas no tipo | Não casa; XSD rejeita | Slug em minúsculas (`dec-lei`, não `Dec-Lei`) |
| Slug PT em vez de slug ELI (e.g. `decreto-lei` em vez de `dec-lei`) | XSD passa, Schematron falha por coerência name↔URI | Usar slug ELI canónico (cap. 5 ELI-PT) |
| eId com hífenes onde devia ser snake_case | Schematron incoerente | Manter convenção: snake_case para articulado, kebab-case só para TLC actors |
| FRBRcountry inconsistente com slug regional | Schematron falha | Para DLR/DRR, jurisdição na URI **e** FRBRcountry **devem** ser `pt-20` ou `pt-30` |
