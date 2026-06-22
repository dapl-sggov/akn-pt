# 8. Identificadores — eId, FRBR URI, ELI-PT

O AKN-PT distingue três famílias de identificadores, cada uma com finalidade
e regras próprias:

| Família | Identifica | Visibilidade | Exemplo |
|---|---|---|---|
| `eId` | Fragmentos internos do documento | Interno; estável por documento | `art_5__para_1__lit_a` |
| FRBR URI | A obra (Work), versão (Expression) ou ficheiro (Manifestation) | Global; resolúvel | `https://data.dre.pt/eli/dec-lei/83/2016/12/16` |
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
https://data.dre.pt/eli/dec-lei/83/2016/12/16
                                              ← FRBRWork/FRBRuri
https://data.dre.pt/eli/dec-lei/83/2016/12/16/!main
                                              ← FRBRWork/FRBRthis
```

A data `2016/12/16` é a **data de publicação** no DR — faz parte da identidade
do Work no template INCM.

### Expression (versão textual)

```
https://data.dre.pt/eli/dec-lei/83/2016/12/16/p/dre/pt
                                              ← FRBRExpression/FRBRuri (como publicada)
https://data.dre.pt/eli/dec-lei/83/2016/12/16/p/dre/pt/!main
                                              ← FRBRExpression/FRBRthis
```

O segmento `p` marca a versão "como publicada" (originária). Numa versão
**consolidada**, o `p` é substituído pela data de consolidação:
`…/16/2024-01-01/dre/pt`. Segue-se `/dre/` (agente) e `/pt` (língua).

### Manifestation (ficheiro)

```
https://data.dre.pt/eli/dec-lei/83/2016/12/16/p/dre/pt/xml
                                              ← FRBRManifestation/FRBRuri
https://data.dre.pt/eli/dec-lei/83/2016/12/16/p/dre/pt/xml/!main
                                              ← FRBRManifestation/FRBRthis
```

O formato é um **segmento** (`/xml`), não uma extensão. Formatos alternativos
(`/html`, `/pdf`) têm o seu próprio FRBR URI no mesmo padrão.

## 8.3 ELI-PT — o sub-conjunto institucional

ELI-PT é **a sub-forma de FRBR URI** que segue o template canónico de produção
da INCM (capítulo 3 da especificação ELI-PT). Todos os FRBR URIs em AKN-PT
**DEVEM** ser URIs ELI-PT bem formados, ou seja, satisfazer:

```
https://data.dre.pt/eli/{type}/{number}/{year}/{month}/{day}[/{p|point-in-time}/dre/{language}[/{format}]][/!main]
```

Onde:

- `data.dre.pt` — domínio autoritativo (INCM/DRE, em produção).
- `eli` — marcador literal (obrigatório por compatibilidade com ELI europeu).
- `{type}` — slug do tipo (`dec-lei`, `lei`, …), **antes do número**.
- `{number}` — número do ato (aceita sufixo, ex. `442-A`).
- `{year}/{month}/{day}` — **data de publicação** no DR.
- `p` — versão "como publicada"; data ISO nas consolidadas.
- `{language}` — `pt` no URI (convenção INCM).
- `{format}` — `xml`/`html`/`pdf` como segmento.

> O segmento de jurisdição **não existe** no template INCM (ao contrário da
> forma proposta anterior). DLR/DRR usam a mesma forma; a região fica em
> `<FRBRcountry>` (`pt-20`/`pt-30`). Ver ELI-PT §4 e §16.

## 8.4 Fragmento — referência a parte do ato

Para referenciar um fragmento de um ato (interno ou externo), acrescenta-se
`#{eId}` ao URI:

```
https://data.dre.pt/eli/dec-lei/83/2016/12/16/p/dre/pt#art_5__para_2__lit_a
```

A granularidade até à alínea é **obrigatória** (per ELI-PT §7). Subalínea é
opcional. Abaixo disso (palavra, frase) fica fora de escopo.

## 8.5 Conversão entre URLs legados (dre.pt) e ELI-PT

URLs actuais do portal dre.pt da forma:

```
https://dre.pt/dre/detalhe/decreto-lei/22-2026-XXXXXXXX
```

têm equivalente ELI-PT canónico:

```
https://data.dre.pt/eli/dec-lei/22/2026/MM/DD
```

**Atenção:** o URL de detalhe do portal dre.pt só contém número-ano (não a
data completa); a partir DESSE URL, construir o URI canónico exige a **data de
publicação** (mês/dia), que aí não consta. Note-se, porém, que a **citação
legística completa** em português inclui sempre a data — ex. "Decreto-Lei
n.º 43-B/2024, de 2 de julho" —, fornecendo tipo, número, ano, dia e mês; a
partir de uma citação completa o template canónico `data.dre.pt`
(`/eli/{tipo}/{nº}/{ano}/{mês}/{dia}/p/dre/pt`) **é construível**, bastando o
parser extrair a componente "..., de {dia} de {mês} [de {ano}]". O conversor de
referência (`eli-pt/conversion.py`), quando parte do URL de detalhe sem data,
devolve a forma proposta `eli.gov.pt` (ano+número); quando dispõe da data —
seja da citação, seja da tabela INCM — devolve a forma canónica `data.dre.pt`.
A INCM **deveria** publicar redireccionamentos HTTP 301 dos URLs legados para
os ELI-PT correspondentes. Caveat: uma citação ABREVIADA ("DL 43-B/2024", sem
"de {dia} de {mês}") é insuficiente para construir o URI canónico — mas isso é
citação incompleta por padrão legístico, não uma falha do esquema da INCM.

## 8.6 Compromissos de permanência

Resumo (detalhe em `eli-pt/permanence-policy.md`):

| Camada | Permanência |
|---|---|
| Work URI | Permanente — para sempre |
| Expression URI | Permanente — para sempre, mesmo após nova consolidação |
| Manifestation URI | Permanente em condições normais; pode ser regenerado com HTTP 301 se a representação binária mudar |

Compromissos institucionais:

- URI nunca é reatribuído a outro ato.
- O domínio canónico é `data.dre.pt` (produção INCM); qualquer migração futura
  **deve** ser acompanhada de HTTP 301.
- Mudanças de URI são auditadas em relatório anual da INCM (ELI-PT §10).

## 8.7 Como o XSD valida URIs

O `EliPtUriType` (em `schema/xsd/akn-pt-types.xsd`) aceita **ambas** as formas
(canónica data.dre.pt + proposta eli.gov.pt) via alternância:

```
https?://[a-z0-9.\-]+/eli/(
   pt(-\d{2})?/[a-z\-]+/\d{4}/\d+(-[A-Za-z0-9]+)?/[a-z]{2,3}(/\d{4}-\d{2}-\d{2})?(\.[a-z]{3,4})?(/!main)?      # proposta
 | [a-z\-]+/\d+(-[A-Za-z0-9]+)?/\d{4}/\d{2}/\d{2}(/(p|\d{4}-\d{2}-\d{2})/dre/[a-z]{2,3}(/[a-z]{3,4})?)?(/!main)?  # canónica data.dre.pt
)(#[A-Za-z0-9_]+)?
```

O Schematron acrescenta verificações de coerência semântica (válidas para a
forma canónica, em que o `/{type}/` precede o número):

- O segmento `/{type}/` na FRBRuri Work **deve** coincidir com o `<act @name>`.
- O FRBRuri Expression **deve** começar com o FRBRuri Work.
- O FRBRuri Manifestation **deve** começar com o FRBRuri Expression.

## 8.8 Erros comuns a evitar

| Erro | Sintoma | Correcção |
|---|---|---|
| URI sem `/eli/` | Não casa o padrão; XSD rejeita | Acrescentar `/eli/` a seguir ao domínio |
| Data de publicação em falta | URI canónico incompleto / não casa | O template data.dre.pt usa `/{ano}/{mês}/{dia}` — extrair a data da citação completa ("..., de {dia} de {mês} [de {ano}]") ou usar a data de publicação no DR |
| Formato como extensão (`.xml`) na forma canónica | Schematron de coerência falha | Na forma canónica o formato é segmento (`/xml`), não extensão |
| Maiúsculas no tipo | Não casa; XSD rejeita | Slug em minúsculas (`dec-lei`, não `Dec-Lei`) |
| Slug PT em vez de slug ELI (e.g. `decreto-lei` em vez de `dec-lei`) | XSD passa, Schematron falha por coerência name↔URI | Usar slug ELI canónico (cap. 5 ELI-PT) |
| eId com hífenes onde devia ser snake_case | Schematron incoerente | Manter convenção: snake_case para articulado, kebab-case só para TLC actors |
| FRBRcountry incoerente em acto regional | Schematron falha | Para DLR/DRR, `<FRBRcountry>` **deve** ser `pt-20` (Açores) ou `pt-30` (Madeira) — o URI canónico não tem segmento de jurisdição |
