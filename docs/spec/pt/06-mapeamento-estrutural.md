# 6. Mapeamento estrutural por tipo

Este capítulo sintetiza as particularidades estruturais de cada tipo no
escopo da v0.1.0. O detalhe canónico vive em `mapping/v0.1.0/{tipo}.md` no
repositório; aqui consolida-se o essencial para uma leitura única.

## 6.1 Decreto-Lei

```
<act name="dec-lei">
  meta
  preface          → docType "Decreto-Lei"; docNumber; docDate; shortTitle
  preamble         → recital+ (frequentemente denso); formula type="enacting"
  body             → article+ (eventualmente com chapter/section)
  conclusions      → formula conclusion + signature countersignature (PM)
                   + formula promulgation + signature promulgation (PR)
                   + signature countersignature+ (ministros)
  attachments?     → anexos numerados em romano
```

| Detalhe | Valor |
|---|---|
| `<FRBRauthor>` | `#governo` |
| `<FRBRcountry>` | `pt` |
| `<FRBRsubtype>` obrigatório | dec-lei-ordinario / autorizado / parlamentar / transposicao (cumulativo: alterador) |
| Promulgação | Sim, pelo PR |
| Referenda | PM (obrigatório) + ministros competentes |
| Schematron específico | Conclusions deve ter signature promulgation + countersignature; se autorizado, preâmbulo deve referenciar lei de autorização; se transposicao, preâmbulo deve referenciar directiva (URI ELI europeu) |

**Fórmula promulgatória por subtipo** (Schematron emite warning se desvia do
catálogo):

- `dec-lei-ordinario`: "Assim: Nos termos da alínea a) do n.º 1 do artigo 198.º da Constituição, o Governo decreta o seguinte:"
- `dec-lei-autorizado`: "Assim: No uso da autorização legislativa concedida pela Lei n.º X/YYYY, de DD de MM, e nos termos da alínea b) do n.º 1 do artigo 198.º da Constituição, o Governo decreta o seguinte:"
- `dec-lei-parlamentar`: "Assim: Nos termos das alíneas a) e c) do n.º 1 do artigo 198.º da Constituição, o Governo decreta o seguinte:"
- `dec-lei-transposicao`: (igual ao ordinário, com menção à directiva no preâmbulo)

## 6.2 Lei (AR)

```
<act name="lei">
  meta
  preface          → docType "Lei"; docNumber; docDate; shortTitle
  preamble         → recital* (frequentemente vazio ou curto); formula enacting
  body             → article+
  conclusions      → formula conclusion + signature signature (PAR)
                   + formula promulgation + signature promulgation (PR)
                   + formula conclusion + signature countersignature (PM, único)
  attachments?
```

| Detalhe | Valor |
|---|---|
| `<FRBRauthor>` | `#ar` (Assembleia da República) |
| `<FRBRcountry>` | `pt` |
| `<FRBRsubtype>` | lei-comum / lei-organica / lei-de-bases / lei-autorizacao / lei-de-revisao |
| Promulgação | Sim, pelo PR |
| Referenda | **Apenas PM** (não há ministros — art. 140.º CRP) |
| Schematron específico | Conclusions deve ter signature com `@as="#presidente-ar"`; signature promulgation; signature countersignature **única** (PM) |

A diferença de fundo face ao DL: a Lei tem assinatura do Presidente da AR
antes da promulgação, e não tem referenda ministerial.

**Fórmula promulgatória**:
"A Assembleia da República decreta, nos termos da alínea c) do artigo 161.º da Constituição, o seguinte:"

## 6.3 Portaria

```
<act name="portaria">
  meta
  preface          → docType "Portaria"; docNumber; docDate; shortTitle
  preamble         → recital+ (lei habilitante obrigatória); formula enacting
  body             → article+ (3-10 artigos típicos)
  conclusions      → signature signature+ (ministerial, 1+ em portarias conjuntas)
  attachments?     → frequente (modelos de impresso, tabelas)
```

| Detalhe | Valor |
|---|---|
| `<FRBRauthor>` | Ministro(s) — `#ministro-X`. Múltiplos em portarias conjuntas. |
| `<FRBRcountry>` | `pt` |
| `<FRBRsubtype>` | portaria-regulamentar / execucao / extensao |
| Promulgação | **Não** (Schematron rejeita signature role="promulgation") |
| Referenda | N/A |
| Schematron específico | Preâmbulo **deve** conter `<ref>` a lei ou DL habilitante (princípio da legalidade); conclusions deve ter signature signature (sem promulgation) |

**Fórmula promulgatória**:
"Manda o Governo, pelo Ministro de X, ao abrigo do disposto no [base legal habilitante], o seguinte:"

Em portarias conjuntas: "Manda o Governo, pelos Ministros de X e Y, …".

## 6.4 Resolução do Conselho de Ministros

```
<act name="res-cm">
  meta
  preface          → docType "Resolução do Conselho de Ministros"; docNumber; shortTitle
  preamble         → recital+ (curtos)
  body             → paragraph+ (SEM article)
  conclusions      → formula conclusion + signature signature (PM, único)
  attachments?     → frequentes (estratégias, planos, programas)
```

| Detalhe | Valor |
|---|---|
| `<FRBRauthor>` | `#cm` (Conselho de Ministros) |
| `<FRBRcountry>` | `pt` |
| `<FRBRsubtype>` | res-cm-normativa / politica / administrativa |
| Promulgação | **Não** (Schematron rejeita) |
| Assinatura | Apenas o PM |
| Schematron específico | `<body>` **não** deve conter `<article>` (erro mais frequente); body deve ter `<paragraph>` com `<num>`; conclusions **única** signature |

**Particularidade crítica**: a RCM não tem articulado em "Artigo N.º". Os
pontos resolutivos são `<paragraph eId="para_N">` directos em `<body>`,
tipicamente começando por verbo no infinitivo ("Aprovar...", "Determinar...",
"Encarregar..."). Confundir isto é o erro de marcação mais frequente em
sistemas comparáveis.

## 6.5 Decreto da AR

```
<act name="decreto-ar">
  meta
  preface          → docType "Decreto da Assembleia da República"; docNumber; shortTitle
  preamble         → formula enacting
  body             → article+ (frequentemente curto)
  conclusions      → signature signature (PAR) + formula promulgation + signature promulgation (PR)
  attachments?     → frequente (texto integral do tratado, bilingual)
```

| Detalhe | Valor |
|---|---|
| `<FRBRauthor>` | `#ar` |
| `<FRBRsubtype>` | decreto-ar-tratado / mandato / outros |
| Promulgação | Sim, pelo PR |
| Referenda | Não |
| Schematron específico | Conclusions com signature PAR e promulgation; se subtipo tratado, deve existir `<attachment>` |

## 6.6 Resolução da AR

```
<act name="res-ar">
  meta
  preface          → docType "Resolução da Assembleia da República"; docNumber; shortTitle
  preamble         → recital* (opcional)
  body             → paragraph+ (SEM article — estrutura tipo RCM)
  conclusions      → signature signature (PAR, único)
  attachments?
```

| Detalhe | Valor |
|---|---|
| `<FRBRauthor>` | `#ar` |
| `<FRBRsubtype>` | res-ar-recomendacao / aprovacao / politica / cessacao-vigencia |
| Promulgação | Não |
| Schematron específico | Body sem `<article>`; conclusions única signature; se cessacao-vigencia, preâmbulo deve referenciar DL alvo |

## 6.7 Despacho normativo

```
<act name="despacho-normativo">
  meta
  preface          → docType "Despacho normativo"; docNumber; shortTitle
  preamble         → recital+ (habilitante obrigatória); formula enacting
  body             → article+ (curto, 1-8 artigos)
  conclusions      → signature signature+ (ministerial; múltiplas em despacho conjunto)
  attachments?
```

| Detalhe | Valor |
|---|---|
| `<FRBRauthor>` | Ministro(s) |
| `<FRBRsubtype>` | despacho-normativo / despacho-conjunto |
| Promulgação | Não |
| Schematron específico | Preâmbulo deve conter `<ref>` a lei/DL habilitante; conclusions sem promulgation |

## 6.8 Decreto Legislativo Regional

```
<act name="dlr">
  meta             → FRBRcountry pt-20 (Açores) ou pt-30 (Madeira); FRBRauthor #alra ou #alrm
  preface          → docType "Decreto Legislativo Regional"; docNumber inclui sufixo /A ou /M
  preamble         → formula enacting (cita arts. 227 e 232 CRP + Estatuto regional)
  body             → article+
  conclusions      → signature signature (PALR) + formula promulgation + signature promulgation (RR)
  attachments?
```

| Detalhe | Valor |
|---|---|
| `<FRBRauthor>` | `#alra` (Assembleia Legislativa Açores) ou `#alrm` (Madeira) |
| `<FRBRcountry>` | `pt-20` ou `pt-30` |
| `<FRBRsubtype>` | dlr-ordinario / dlr-autorizado |
| Promulgação | **Pelo Representante da República**, não pelo PR |
| Schematron específico | FRBRcountry deve ser pt-20 ou pt-30; conclusions **não** deve ter signature com `@as="#presidente-republica"` (erro frequente); deve ter signature promulgation com `@as="#representante-republica-acores"` ou `-madeira` |

**Fórmula promulgatória** (Açores):
"A Assembleia Legislativa da Região Autónoma dos Açores decreta, nos termos da alínea a) do n.º 1 do artigo 227.º e do n.º 1 do artigo 232.º da Constituição da República Portuguesa, e da alínea c) do n.º 1 do artigo 31.º do Estatuto Político-Administrativo da Região Autónoma dos Açores, o seguinte:"

(Madeira: substituir "Açores" pelo equivalente.)

## 6.9 Decreto Regulamentar Regional

```
<act name="drr">
  meta             → FRBRcountry pt-20 ou pt-30; FRBRauthor #gov-regional-{acores|madeira}
  preface          → docType "Decreto Regulamentar Regional"; docNumber sufixo /A ou /M
  preamble         → recital+ (DLR habilitante obrigatória); formula enacting
  body             → article+
  conclusions      → signature signature (Pres. GR) + formula promulgation + signature promulgation (RR)
  attachments?
```

| Detalhe | Valor |
|---|---|
| `<FRBRauthor>` | `#gov-regional-acores` ou `#gov-regional-madeira` |
| `<FRBRcountry>` | `pt-20` ou `pt-30` |
| `<FRBRsubtype>` | drr-execucao / drr-regulamentar |
| Schematron específico | Preâmbulo deve referenciar DLR ou lei habilitante; conclusions deve ter signature do Presidente do Governo Regional + promulgação pelo Representante da República |

## 6.10 Tabela comparativa rápida

| Tipo | Body | Promulgação | Referenda | Anexos típicos |
|---|---|---|---|---|
| DL | article | PR | PM + ministros | ocasionais |
| Lei | article | PR | PM único | ocasionais |
| Decreto AR | article (curto) | PR | — | frequentes (tratado) |
| Res AR | paragraph | — | — | ocasionais |
| Portaria | article (curto) | — | — | frequentes (modelos) |
| RCM | paragraph | — | — | muito frequentes (estratégias) |
| Despacho normativo | article (curto) | — | — | ocasionais |
| DLR | article | RR | — | ocasionais |
| DRR | article | RR | — | ocasionais |
