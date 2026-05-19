# Padrões comuns entre tipos de ato

Elementos estruturais que se repetem em vários tipos de ato. Esta ficha define-os
uma só vez; as fichas por tipo apenas indicam particularidades.

## `<preface>` — cabeçalho de identificação

Todos os tipos de ato têm `<preface>` antes de `<preamble>` ou `<body>`.

```xml
<preface>
  <p class="docTitle">
    <docType>Decreto-Lei</docType>
    <docNumber>n.º 75/2026</docNumber>
  </p>
  <p class="docDate"><date date="2026-05-15">de 15 de maio</date></p>
  <p class="shortTitle">Aprova o regime jurídico ...</p>
</preface>
```

| Sub-elemento | Conteúdo | Obrigatório |
|---|---|---|
| `<docType>` | "Decreto-Lei", "Lei", "Portaria", "Resolução do Conselho de Ministros", etc. — texto exacto | ✓ |
| `<docNumber>` | `n.º {numero}/{ano}` | ✓ |
| `<docDate>` | `de {dia} de {mês por extenso}` com `<date date="ISO">` interno | ✓ |
| `<shortTitle>` | Ementa do ato (frase curta) | ✓ |

## `<preamble>` — exposição de motivos

Estrutura comum: zero ou mais `<recital>` + uma `<formula type="enacting">`.

```xml
<preamble>
  <recital eId="rec_1">
    <p class="formula">Considerando que <i>...</i></p>
  </recital>
  <recital eId="rec_2">
    <p>O Programa do Governo prevê <i>...</i></p>
  </recital>
  <formula type="enacting">
    <p>Assim: Nos termos da alínea a) do n.º 1 do artigo 198.º da Constituição, o Governo decreta o seguinte:</p>
  </formula>
</preamble>
```

| Construto | AKN | Notas |
|---|---|---|
| Bloco preambular | `<preamble>` | Antes de `<body>` |
| Considerando | `<recital eId="rec_N">` | N indexado a partir de 1 |
| Frase "Considerando que…" | `<p class="formula">` interno | Schematron valida o pattern |
| Referência a tratado, diretiva, lei habilitante | `<ref href="ELI-URI">` | Pode ser interna (`#rec_2`) ou externa |
| Fórmula promulgatória/dispositiva ("Assim:…") | `<formula type="enacting">` | Catálogo de variantes em [_special-cases.md](_special-cases.md) |

RCMs e portarias têm preâmbulos curtos ou inexistentes; DL, Lei e DLR têm
preâmbulos densos.

## `<body>` vs. `<mainBody>`

O AKN distingue:
- **`<body>`** — articulado normativo (artigos numerados ou pontos resolutivos).
- **`<mainBody>`** — corpo de actos não articulados (e.g. anexo que é uma estratégia).

AKN-PT usa:
- `<body>` para todos os tipos com articulado (DL, Lei, Portaria, Despacho normativo, DLR, Decreto Regulamentar Regional, RCM, Decreto AR, Resolução AR).
- `<mainBody>` apenas dentro de `<attachment>` quando o anexo é normativo mas não estruturado em artigos (estratégias, programas, planos).

## Articulado — `<article>`, `<paragraph>`, `<list>`, `<point>`

```xml
<article eId="art_2">
  <num>Artigo 2.º</num>
  <heading>Definições</heading>
  <paragraph eId="art_2__para_1">
    <intro><p>Para efeitos do presente decreto-lei, entende-se por:</p></intro>
    <list>
      <point eId="art_2__para_1__lit_a">
        <num>a)</num>
        <content><p><b>«Autoridade competente»</b>, a entidade designada nos termos do <ref href="#art_3">artigo 3.º</ref>;</p></content>
      </point>
      <point eId="art_2__para_1__lit_b">
        <num>b)</num>
        <content><p><b>«Procedimento»</b>, ...</p></content>
      </point>
    </list>
  </paragraph>
  <paragraph eId="art_2__para_2">
    <num>2 -</num>
    <content><p>Para efeitos do número anterior ...</p></content>
  </paragraph>
</article>
```

| Construto PT | AKN | eId pattern |
|---|---|---|
| Artigo | `<article>` | `art_N` (N = arábico) |
| Número de artigo único | `<paragraph>` sem `<num>` ou com `<num>1 -</num>` consoante prática | `art_N__para_1` |
| Número (parágrafo numerado) | `<paragraph>` com `<num>N -</num>` | `art_N__para_M` |
| Alínea | `<point>` dentro de `<list>` | `art_N__para_M__lit_X` |
| Subalínea (i, ii, iii…) | `<point>` aninhado | `art_N__para_M__lit_X__sublit_Y` |
| Capítulo | `<chapter>` | `cap_N` (romano legível, arábico no eId) |
| Secção | `<section>` | `cap_N__sec_M` |
| Subsecção | `<subsection>` | `cap_N__sec_M__ssec_K` |
| Título (divisão acima de capítulo) | `<title>` (AKN element) | `tit_N` |
| Parte | `<part>` | `prt_N` |
| Livro | `<book>` | `lvr_N` |

Hierarquia AKN-PT canónica (do maior para o menor):
`<book>` → `<part>` → `<title>` → `<chapter>` → `<section>` → `<subsection>` → `<article>` → `<paragraph>` → `<list>` → `<point>`

Não é obrigatório usar todos. Em DL típicos só aparecem `<article>` e `<paragraph>`; em códigos extensos usa-se até `<book>`.

### Subalíneas — `<point>` aninhado em `<list>` recursiva

Quando uma alínea tem subdivisões (subalíneas em romano minúsculo: i), ii),
iii)…), o `<point>` contém uma `<list>` que por sua vez contém `<point>`s.
A estrutura é recursiva — o mesmo padrão pode descer indefinidamente, mas em
AKN-PT v0.1.0 só se documenta até subalínea (1 nível de aninhamento).

```xml
<paragraph eId="art_2__para_1">
  <intro><p>Para efeitos do presente diploma, entende-se por:</p></intro>
  <list>
    <point eId="art_2__para_1__lit_a">
      <num>a)</num>
      <content><p>«Termo A», definição;</p></content>
    </point>
    <point eId="art_2__para_1__lit_b">
      <num>b)</num>
      <intro><p>«Termo B», definição, designadamente:</p></intro>
      <list>
        <point eId="art_2__para_1__lit_b__sublit_i">
          <num>i)</num>
          <content><p>sub-condição 1;</p></content>
        </point>
        <point eId="art_2__para_1__lit_b__sublit_ii">
          <num>ii)</num>
          <content><p>sub-condição 2;</p></content>
        </point>
        <point eId="art_2__para_1__lit_b__sublit_iii">
          <num>iii)</num>
          <content><p>sub-condição 3.</p></content>
        </point>
      </list>
    </point>
    <point eId="art_2__para_1__lit_c">
      <num>c)</num>
      <content><p>«Termo C», definição.</p></content>
    </point>
  </list>
</paragraph>
```

Convenções de eId:
- Alíneas: `..._lit_a`, `..._lit_b`, … (letra minúscula latina, sequencial).
- Subalíneas: `..._lit_X__sublit_i`, `..._lit_X__sublit_ii`, … (romano minúsculo: i, ii, iii, iv, v, vi, vii, viii, ix, x, xi, xii, …).

Convenções textuais do `<num>`:
- Alínea: `a)`, `b)`, `c)`, … (letra + parêntese de fecho).
- Subalínea: `i)`, `ii)`, `iii)`, `iv)`, … (romano minúsculo + parêntese de fecho).

### Parágrafo sem `<num>` — intro + lista de alíneas

Padrão frequente em definições, princípios e enumerações: o parágrafo não
tem `<num>` (texto direto após `<heading>` do artigo) e contém apenas
`<intro>` + `<list>`.

```xml
<article eId="art_3">
  <num>Artigo 3.º</num>
  <heading>Princípios</heading>
  <paragraph eId="art_3__para_1">
    <intro><p>A actuação rege-se pelos seguintes princípios:</p></intro>
    <list>
      <point eId="art_3__para_1__lit_a"><num>a)</num><content><p>Legalidade;</p></content></point>
      <point eId="art_3__para_1__lit_b"><num>b)</num><content><p>Proporcionalidade;</p></content></point>
      <point eId="art_3__para_1__lit_c"><num>c)</num><content><p>Transparência.</p></content></point>
    </list>
  </paragraph>
</article>
```

O XSD aceita `<paragraph>` sem `<num>` quando seguido por `<intro>+<list>`.
Quando o artigo tem **um único** parágrafo, omitir o `<num>` é a convenção
legística PT (não há "1 - " quando não há "2 -").

Quando o artigo passa a ter mais que um parágrafo, **todos** ganham número
(`1 -`, `2 -`, …) — o editor faz auto-numeração ao adicionar o segundo.

## Referências cruzadas — `<ref>` e `<rref>`

| Tipo de ref | Elemento | href |
|---|---|---|
| Interna (mesmo documento) | `<ref>` | `#art_3`, `#art_3__para_1__lit_a` |
| Externa a ato concreto | `<ref>` | ELI-PT URI completo |
| Range interno (do art. 3.º ao 5.º) | `<rref>` | `from="#art_3" upTo="#art_5"` |
| Citação informal sem identificador (jurisprudência genérica) | `<authorialNote>` | n/a |

## `<conclusions>` — assinaturas e datas finais

```xml
<conclusions>
  <formula type="conclusion">
    <p>Visto e aprovado em Conselho de Ministros de <date date="2026-05-12">12 de maio de 2026</date>.</p>
  </formula>
  <p class="signatureBlock">
    <signature role="countersignature">
      <person refersTo="#pessoa-pm-2026-05" as="#primeiro-ministro"/>
    </signature>
  </p>
  <formula type="promulgation">
    <p>Promulgado em <date date="2026-05-15">15 de maio de 2026</date>.</p>
  </formula>
  <p class="signatureBlock">
    <signature role="promulgation">
      <person refersTo="#pessoa-pr-2026-05" as="#presidente-republica"/>
    </signature>
  </p>
  <formula type="conclusion">
    <p>Referendado em <date date="2026-05-16">16 de maio de 2026</date>.</p>
  </formula>
  <p class="signatureBlock">
    <signature role="countersignature">
      <person refersTo="#pessoa-min-ciencia" as="#ministro-ciencia"/>
    </signature>
  </p>
</conclusions>
```

| Construto | AKN | role attribute |
|---|---|---|
| Fórmula de aprovação em CM | `<formula type="conclusion">` | n/a |
| Fórmula de promulgação | `<formula type="promulgation">` | n/a |
| Assinatura do Presidente | `<signature>` | `promulgation` |
| Assinatura do PM | `<signature>` | `countersignature` (DL/Lei) ou `signature` (RCM) |
| Assinatura ministerial | `<signature>` | `countersignature` (DL referenda) ou `signature` (Portaria, Despacho) |

## Anexos — `<attachments>` e `<attachment>`

```xml
<attachments>
  <attachment eId="anx_1">
    <heading>Anexo I</heading>
    <subheading>Estratégia Nacional para X</subheading>
    <mainBody>
      <!-- Conteúdo normativo livre, com estrutura própria -->
    </mainBody>
  </attachment>
  <attachment eId="anx_2">
    <heading>Anexo II</heading>
    <subheading>Modelo de declaração</subheading>
    <mainBody>
      <blockList>...</blockList>
    </mainBody>
  </attachment>
</attachments>
```

| Variante | Marcação |
|---|---|
| Anexo com articulado próprio | `<attachment>` → `<mainBody>` → `<article>`s |
| Anexo com tabela única | `<attachment>` → `<mainBody>` → `<table>` |
| Anexo com modelo de formulário | `<attachment>` → `<mainBody>` → `<blockList>` ou `<table>` |
| Anexo facsimile (imagem) | `<attachment>` → `<mainBody>` → `<img src="files/anx_1.png" alt="..."/>` |
| Anexo textual livre (estratégia, programa) | `<attachment>` → `<mainBody>` → `<p>`s com `<heading>` interna se necessário |

Numeração: Anexo I, II, III… (algarismos romanos legíveis); eId em arábico
(`anx_1`, `anx_2`).
