# Mapping — Resolução do Conselho de Ministros (v0.1.0)

> Supersede v0.0.1. Open questions Q1.9–Q1.11 resolvidas — ver [decisions-log](../../decisions-log.md).

## Base legal e categorias

- **Base:** competência originária do CM; art. 200.º CRP; Lei Orgânica do Governo em vigor.
- **Categorias** (`<FRBRsubtype>`):
  - `res-cm-normativa` — RCM com normatividade (aprova plano, estratégia vinculativa).
  - `res-cm-politica` — RCM puramente política (declaração, posição).
  - `res-cm-administrativa` — RCM com efeito interno (criação de grupo de trabalho, autorização de despesa).
- **Autoridade emanante:** Conselho de Ministros.
- **Promulgação:** não há.
- **Assinatura:** Primeiro-Ministro.
- **Publicação:** DR, 1.ª série.

## Identificação ELI-PT

```
https://eli.gov.pt/res-cm/{year}/{number}/pt[/{point-in-time}]
```

## Estrutura típica

```
RCM
├── <meta>
├── <preface>
├── <preamble>
│   └── <recital>+           considerandos curtos
├── <body>
│   └── <paragraph eId="para_N">+   pontos resolutivos (NÃO <article>)
├── <conclusions>
│   ├── <formula>            "Presidência do Conselho de Ministros, ..."
│   └── <signature role="signature">  Primeiro-Ministro
└── <attachments>*           muito frequente (estratégias, planos, programas)
```

## Particularidades — atenção!

- **Sem articulado clássico.** A RCM **não usa `<article>`** — usa `<paragraph eId="para_N">` numerados directamente em `<body>`. Confundir isto é o erro de marcação mais frequente.
- **Pontos resolutivos** começam tipicamente com verbo no infinitivo: "Aprovar...", "Determinar...", "Encarregar...".
- **Anexos extensos.** Frequentemente a RCM tem 1 página de resolutivos + 60 páginas de anexo. O conteúdo substantivo está no anexo.
- **Sem promulgação.**
- **Sem referenda ministerial.** Apenas o PM assina.

## Mapeamento elemento-a-elemento

| Construto PT | AKN | Notas |
|---|---|---|
| RCM (raiz) | `<act name="res-cm">` | |
| Resolutivo numerado | `<paragraph eId="para_N">` com `<num>N -</num>` | dentro de `<body>` directamente |
| Sub-ponto (alínea a, b, c) | `<point eId="para_N__lit_X">` dentro de `<list>` interna ao `<paragraph>` | |
| Anexo com plano/estratégia normativa | `<attachment>` → `<mainBody>` → estrutura interna livre | conteúdo vinculativo (decisão Q1.10) |
| Assinatura PM | `<signature role="signature">` | único |

## Exemplo (fragmento)

```xml
<act name="res-cm">
  <meta>
    <identification source="#dapl">
      <FRBRWork>
        <FRBRthis value="https://eli.gov.pt/res-cm/2026/45/pt/!main"/>
        <FRBRuri value="https://eli.gov.pt/res-cm/2026/45/pt"/>
        <FRBRdate date="2026-04-20" name="adoption"/>
        <FRBRauthor href="#cm"/>
        <FRBRcountry value="pt"/>
        <FRBRsubtype value="res-cm-normativa"/>
        <FRBRnumber value="45"/>
      </FRBRWork>
      <!-- Expression, Manifestation análogos -->
    </identification>
    <references source="#dapl">
      <TLCOrganization eId="cm" href="/akn/ontology/organization/pt/cm" showAs="Conselho de Ministros"/>
      <TLCRole eId="primeiro-ministro" href="/akn/ontology/role/pt/primeiro-ministro" showAs="Primeiro-Ministro"/>
    </references>
  </meta>
  <preface>
    <p class="docTitle"><docType>Resolução do Conselho de Ministros</docType> <docNumber>n.º 45/2026</docNumber></p>
    <p class="shortTitle">Aprova a Estratégia Nacional para ...</p>
  </preface>
  <preamble>
    <recital eId="rec_1"><p class="formula">Considerando que <i>...</i></p></recital>
  </preamble>
  <body>
    <paragraph eId="para_1">
      <num>1 -</num>
      <content><p>Aprovar a Estratégia Nacional para ..., constante do anexo I à presente resolução.</p></content>
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
  <conclusions>
    <formula type="conclusion"><p>Presidência do Conselho de Ministros, <date date="2026-04-20">20 de abril de 2026</date>.</p></formula>
    <p class="signatureBlock"><signature role="signature"><person refersTo="#pessoa-pm-2026-04" as="#primeiro-ministro"/></signature></p>
  </conclusions>
  <attachments>
    <attachment eId="anx_1">
      <heading>Anexo I</heading>
      <subheading>Estratégia Nacional para ...</subheading>
      <mainBody><!-- conteúdo --></mainBody>
    </attachment>
  </attachments>
</act>
```

## Schematron específico de RCM

| Regra | Severity |
|---|---|
| `<act name>` = `res-cm` | error |
| `<body>` NÃO deve conter `<article>` | error (erro mais comum) |
| `<body>` deve conter ≥1 `<paragraph>` com `<num>` | error |
| `<conclusions>` NÃO deve conter `<signature role="promulgation">` | error |
| `<conclusions>` deve conter exactamente UMA `<signature role="signature">` (PM) | error |
| Sub-pontos (`<point>`) usam `<list>` dentro de `<paragraph>`, não no `<body>` directo | error |
