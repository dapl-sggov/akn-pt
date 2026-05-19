# 5. Estrutura geral do documento

Este capítulo descreve os blocos estruturais comuns a todos os tipos de ato.
As particularidades por tipo estão no [capítulo 6](06-mapeamento-estrutural.md).

## 5.1 Esqueleto canónico

```xml
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0/CSD17">
  <act name="...">
    <meta>          <!-- ver cap. 3 e cap. 9 -->
    </meta>
    <preface>       <!-- cabeçalho -->
    </preface>
    <preamble>      <!-- considerandos + fórmula promulgatória — opcional para alguns tipos -->
    </preamble>
    <body>          <!-- articulado -->
    </body>
    <conclusions>   <!-- assinaturas + fórmulas de promulgação/referenda -->
    </conclusions>
    <attachments>   <!-- anexos — opcional -->
    </attachments>
  </act>
</akomaNtoso>
```

A ordem é fixa. `<meta>`, `<preface>` e `<body>` são **obrigatórios** em todos
os tipos. `<preamble>`, `<conclusions>` e `<attachments>` são obrigatórios
consoante o tipo (ver cap. 6).

## 5.2 `<preface>` — cabeçalho de identificação

```xml
<preface>
  <p class="docTitle">
    <docType>Decreto-Lei</docType>
    <docNumber>n.º 22/2026</docNumber>
  </p>
  <p class="docDate"><date date="2026-03-15">de 15 de março</date></p>
  <shortTitle>Estabelece o regime jurídico de X.</shortTitle>
</preface>
```

Elementos:

- `<docType>` — texto exacto do tipo do ato em PT: "Decreto-Lei", "Lei",
  "Portaria", "Resolução do Conselho de Ministros", "Decreto Legislativo
  Regional", etc.
- `<docNumber>` — `n.º {número}/{ano}`. Os DLR acrescentam sufixo regional
  (`/A` para Açores, `/M` para Madeira).
- `<docDate>` — wrapper `<p class="docDate">` com `<date date="YYYY-MM-DD">de DD de MMMM</date>`.
- `<shortTitle>` — ementa do diploma, em frase curta.

O Schematron impõe a presença de `<docType>`, `<docNumber>` e `<shortTitle>`
em todas as fases. Os wrappers `<p class>` são facultativos (são display
hints), mas recomendados para alinhamento com a renderização habitual.

## 5.3 `<preamble>` — exposição de motivos

Bloco com zero ou mais `<recital>` e tipicamente uma `<formula type="enacting">`:

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

Regras:

- Cada `<recital>` tem `@eId` (`rec_N`, N indexado a partir de 1).
- A frase canónica "Considerando que…" é marcada com `<p class="formula">` ou
  apenas `<p>` — o Schematron emite warning quando o primeiro `<p>` de um
  `<recital>` não começa por "Considerando".
- A `<formula type="enacting">` contém a fórmula promulgatória. As variantes
  catalogadas por tipo/subtipo estão no mapping (`mapping/v0.1.0/_special-cases.md`).
- DL e Lei têm tipicamente preâmbulo denso (4–12 considerandos discursivos);
  RCM, Portaria e Despacho normativo têm preâmbulos curtos (1–3 considerandos
  + fórmula); algumas Resoluções da AR têm preâmbulo vazio.

## 5.4 `<body>` — articulado

A escolha estrutural mais importante do `<body>` é entre:

- **Articulado com `<article>`** — para DL, Lei, Portaria, Decreto AR,
  Despacho normativo, DLR, DRR;
- **Pontos resolutivos com `<paragraph>`** — para RCM e Resolução da AR.

Esta distinção não é decorativa — é validada pelo Schematron e a confusão
entre os dois modelos é o erro de marcação mais frequente em sistemas
comparáveis.

### Articulado com `<article>`

```xml
<body>
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
          <content><p>...</p></content>
        </point>
      </list>
    </paragraph>
  </article>
</body>
```

Containers hierárquicos acima de `<article>` (opcionais; usados em diplomas
extensos como códigos):

```
<book>      lvr_N
└── <part>  prt_N
    └── <title>  tit_N
        └── <chapter>  cap_N
            └── <section>  cap_N__sec_M
                └── <subsection>  cap_N__sec_M__ssec_K
                    └── <article>  art_N
```

Não é obrigatório usar nenhum nível intermédio. Em DLs típicos só aparecem
`<article>` directamente em `<body>`.

### Subalíneas (i), ii), iii)) — `<point>` aninhado

Quando uma alínea tem subdivisões, o `<point>` da alínea contém uma
`<list>` interna com novos `<point>`. A estrutura é recursiva no schema —
basta usar o mesmo padrão `<list>+<point>`.

Convenção PT: subalíneas em romano minúsculo (`i)`, `ii)`, `iii)`, `iv)`, …).
eId: prefixo `__sublit_` em romano minúsculo.

```xml
<paragraph eId="art_2__para_1">
  <intro><p>Para efeitos do presente diploma, entende-se por:</p></intro>
  <list>
    <point eId="art_2__para_1__lit_a">
      <num>a)</num>
      <content><p>«Termo A», definição simples;</p></content>
    </point>
    <point eId="art_2__para_1__lit_b">
      <num>b)</num>
      <intro><p>«Termo B», definição que se desdobra em:</p></intro>
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
      <content><p>«Termo C», definição final.</p></content>
    </point>
  </list>
</paragraph>
```

### Parágrafo sem `<num>` — convenção legística PT

Quando um artigo tem **um único** parágrafo, a convenção legística PT é
omitir o `<num>` — não há "1 -" se não há "2 -". O parágrafo passa
directamente ao `<content>` ou `<intro>+<list>` se houver alíneas:

```xml
<article eId="art_4">
  <num>Artigo 4.º</num>
  <heading>Princípios</heading>
  <paragraph eId="art_4__para_1">
    <intro><p>A actuação rege-se pelos seguintes princípios:</p></intro>
    <list>
      <point eId="art_4__para_1__lit_a"><num>a)</num><content><p>Legalidade;</p></content></point>
      <point eId="art_4__para_1__lit_b"><num>b)</num><content><p>Proporcionalidade;</p></content></point>
    </list>
  </paragraph>
</article>
```

Quando o artigo passa a ter mais que um parágrafo (em revisão posterior ou
em diplomas alteradores que aditem números), **todos** os parágrafos ganham
número (`1 -`, `2 -`, …). O editor de referência faz auto-numeração ao
adicionar o segundo parágrafo, promovendo o primeiro de `""` para `1 -`.

### Pontos resolutivos com `<paragraph>`

```xml
<body>
  <paragraph eId="para_1">
    <num>1 -</num>
    <content><p>Aprovar a Estratégia Nacional para X, constante do anexo I à presente resolução.</p></content>
  </paragraph>
  <paragraph eId="para_2">
    <num>2 -</num>
    <intro><p>Determinar que:</p></intro>
    <list>
      <point eId="para_2__lit_a">
        <num>a)</num>
        <content><p>O acompanhamento da Estratégia ...</p></content>
      </point>
    </list>
  </paragraph>
</body>
```

Particularidades:

- `<paragraph>` é filho directo de `<body>` (não dentro de `<article>`).
- A convenção PT é `<num>N -</num>` (não "Artigo N").
- Sub-pontos (alíneas) vão em `<list>` dentro do `<paragraph>`.

## 5.5 `<conclusions>` — assinaturas e fórmulas finais

A composição varia significativamente por tipo. Padrão para DL:

```xml
<conclusions>
  <formula type="conclusion">
    <p>Visto e aprovado em Conselho de Ministros de <date date="2026-03-10">10 de março de 2026</date>.</p>
  </formula>
  <signature role="countersignature">
    <person refersTo="#pessoa-pm-2026-03" as="#primeiro-ministro"/>
  </signature>
  <formula type="promulgation">
    <p>Promulgado em <date date="2026-03-12">12 de março de 2026</date>.</p>
  </formula>
  <signature role="promulgation">
    <person refersTo="#pessoa-pr-2026-03" as="#presidente-republica"/>
  </signature>
  <formula type="conclusion">
    <p>Referendado em <date date="2026-03-13">13 de março de 2026</date>.</p>
  </formula>
  <signature role="countersignature">
    <person refersTo="#pessoa-min-ciencia" as="#ministro-ciencia"/>
  </signature>
</conclusions>
```

Atributo `@role` da `<signature>`:

| `@role` | Significado |
|---|---|
| `signature` | Assinatura "neutra" — Presidente da AR, ministro de Portaria/Despacho, PM em RCM, Presidente do Governo Regional em DRR |
| `countersignature` | Referenda do PM e/ou ministros, ao abrigo do art. 140.º CRP |
| `promulgation` | Promulgação pelo Presidente da República (ou pelo Representante da República nos diplomas regionais) |

A `<formula type>` que precede uma `<signature>` indica o que está a ser
formalizado: `conclusion` é genérico (aprovação, referenda), `promulgation`
é especificamente para a fórmula que precede a assinatura do PR.

## 5.6 `<attachments>` — anexos

```xml
<attachments>
  <attachment eId="anx_1">
    <heading>Anexo I</heading>
    <subheading>Estratégia Nacional para X</subheading>
    <mainBody>
      <!-- conteúdo normativo livre, estrutura interna própria -->
      <p>...</p>
    </mainBody>
  </attachment>
  <attachment eId="anx_2">
    <heading>Anexo II</heading>
    <subheading>Modelo de declaração</subheading>
    <mainBody>
      <blockList>
        <item><p>Campo 1: ___________</p></item>
        <item><p>Campo 2: ___________</p></item>
      </blockList>
    </mainBody>
  </attachment>
</attachments>
```

Convenções:

- Numeração visível em algarismo romano (Anexo I, II, III…);
- `@eId` em arábico (`anx_1`, `anx_2`, …).

Quatro variantes de conteúdo de anexo:

1. **Articulado próprio** — `<mainBody>` contém `<article>`s.
2. **Tabela única** — `<mainBody>` contém um `<table>`.
3. **Modelo de formulário** — `<mainBody>` contém `<blockList>` ou `<table>`.
4. **Texto livre estruturado** (estratégia, programa) — `<mainBody>` contém
   `<p>` com `<heading>` interna se necessário.

Excepcionalmente, anexos puramente facsímile (imagem) usam `<img src="..."/>`
dentro do `<mainBody>`. A norma é preferir conteúdo estruturado (ver
[cap. 14 §14.4](14-extensoes-proibicoes.md)).

## 5.7 Como o XML é tipicamente serializado

- Indentação 2 espaços, codificação UTF-8 obrigatória.
- Quebras de linha entre elementos block-level.
- Inline elements (`<b>`, `<i>`, `<ref>`, `<date>`) ficam in-line sem espaço
  adicional.
- Atributos na ordem: `@eId`, depois ordem alfabética dos restantes.

Estas são convenções para legibilidade humana — não afectam validação. O
validador (cap. 13) **não** falha por estilo de serialização.
