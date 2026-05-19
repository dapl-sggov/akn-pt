# Mapping — Decreto-Lei (v0.1.0)

> Supersede v0.0.1. Todas as open questions do v0.0.1 foram resolvidas — ver
> [decisions-log Q1.1–Q1.5](../../decisions-log.md).

## Base constitucional e categorias

- **Base:** artigo 198.º, n.º 1 da Constituição da República Portuguesa.
- **Categorias** (`<FRBRsubtype>`):
  - `dec-lei-ordinario` — al. a) — matéria não reservada à AR.
  - `dec-lei-autorizado` — al. b) — uso de autorização legislativa da AR.
  - `dec-lei-parlamentar` — al. c) — desenvolvimento de princípios ou bases gerais.
  - `dec-lei-transposicao` — DL que transpõe directiva da UE (subtipo cumulativo).
  - `dec-lei-alterador` — DL cujo objeto é alterar diploma anterior (cumulativo).
- **Autoridade emanante:** Governo, em Conselho de Ministros.
- **Promulgação:** Presidente da República (art. 134.º, al. b) CRP).
- **Referenda:** Primeiro-Ministro e ministro(s) competente(s).
- **Publicação:** Diário da República, 1.ª série.

## Identificação ELI-PT

```
https://eli.gov.pt/dec-lei/{year}/{number}/pt[/{point-in-time}]
```

Exemplos:
- `https://eli.gov.pt/dec-lei/2026/22/pt` — versão originária.
- `https://eli.gov.pt/dec-lei/2026/22/pt/2027-01-15` — versão consolidada a 15-01-2027.

## Estrutura típica

```
Decreto-Lei
├── <meta>                    (ver _metadata.md)
├── <preface>                 (ver _common-patterns.md §preface)
├── <preamble>
│   ├── <recital>+            considerandos
│   ├── (ref à lei de autorização, se autorizado)
│   └── <formula type="enacting">  fórmula promulgatória
├── <body>
│   ├── <chapter>*, <section>* opcionais
│   └── <article>+
│       ├── <num>
│       ├── <heading>
│       └── <paragraph>+
│           ├── <list>+ ← <point>+
├── <conclusions>
│   ├── <formula type="conclusion">  "Visto e aprovado em CM de..."
│   ├── <signature role="countersignature">  PM
│   ├── <formula type="promulgation">  "Promulgado em..."
│   ├── <signature role="promulgation">  PR
│   ├── <formula type="conclusion">  "Referendado em..."
│   └── <signature role="countersignature">+  Ministros
└── <attachments>*
    └── <attachment>+         Anexos I, II, III…
```

## Mapeamento elemento-a-elemento

### Raiz

| Construto PT | AKN | Notas |
|---|---|---|
| Decreto-Lei | `<act name="dec-lei">` | Atributo `contains` se alterador |

### Particularidades vs. padrões comuns

A maior parte da estrutura segue [`_common-patterns.md`](_common-patterns.md).
Particularidades do DL:

- **Considerandos densos.** DLs têm tipicamente 4–12 considerandos discursivos.
- **Promulgação obrigatória.** O `<conclusions>` tem sempre `<formula type="promulgation">` + `<signature role="promulgation">`.
- **Referenda PM + ministros.** Múltiplas `<signature role="countersignature">`, primeira é sempre o PM.
- **Fórmula promulgatória varia por subtipo** — ver [_special-cases.md §Fórmulas](_special-cases.md#fórmulas--catálogo-de-variantes).

### Casos especiais aplicáveis

- Artigo X.º-A — [_special-cases.md §Artigo X.º-A](_special-cases.md#artigo-xº-a--inserção-entre-artigos).
- DL alterador / republicação técnica — [_special-cases.md §Alteração](_special-cases.md#alteração-de-diploma-anterior) e §Republicação.
- DL autorizado — [_special-cases.md §DL autorizado](_special-cases.md#decreto-lei-autorizado).
- DL de transposição — [_special-cases.md §DL transposição](_special-cases.md#decreto-lei-de-transposição).

## Exemplo (fragmento mínimo)

```xml
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0/CSD17">
  <act name="dec-lei">
    <meta>
      <identification source="#dapl">
        <FRBRWork>
          <FRBRthis value="https://eli.gov.pt/dec-lei/2026/22/pt/!main"/>
          <FRBRuri value="https://eli.gov.pt/dec-lei/2026/22/pt"/>
          <FRBRdate date="2026-03-10" name="adoption"/>
          <FRBRauthor href="#governo"/>
          <FRBRcountry value="pt"/>
          <FRBRsubtype value="dec-lei-ordinario"/>
          <FRBRnumber value="22"/>
        </FRBRWork>
        <FRBRExpression>
          <FRBRthis value="https://eli.gov.pt/dec-lei/2026/22/pt@2026-03-15/!main"/>
          <FRBRuri value="https://eli.gov.pt/dec-lei/2026/22/pt@2026-03-15"/>
          <FRBRdate date="2026-03-15" name="publication"/>
          <FRBRauthor href="#governo"/>
          <FRBRlanguage language="por"/>
        </FRBRExpression>
        <FRBRManifestation>
          <FRBRthis value="https://eli.gov.pt/dec-lei/2026/22/pt@2026-03-15/!main.xml"/>
          <FRBRuri value="https://eli.gov.pt/dec-lei/2026/22/pt@2026-03-15.xml"/>
          <FRBRdate date="2026-03-15" name="publication"/>
          <FRBRauthor href="#dre"/>
          <FRBRformat value="application/akn+xml; profile=akn-pt-1.0"/>
        </FRBRManifestation>
      </identification>
      <references source="#dapl">
        <TLCOrganization eId="governo" href="/akn/ontology/organization/pt/governo" showAs="Governo da República Portuguesa"/>
        <TLCOrganization eId="dre" href="/akn/ontology/organization/pt/dre" showAs="Diário da República"/>
        <TLCOrganization eId="dapl" href="/akn/ontology/organization/pt/dapl" showAs="Divisão de Apoio ao Processo Legislativo / SGGOV"/>
        <TLCRole eId="primeiro-ministro" href="/akn/ontology/role/pt/primeiro-ministro" showAs="Primeiro-Ministro"/>
        <TLCRole eId="presidente-republica" href="/akn/ontology/role/pt/presidente-republica" showAs="Presidente da República"/>
      </references>
      <lifecycle source="#dapl">
        <eventRef eId="e1" date="2026-03-10" source="#governo" type="generation" refersTo="#approval-cm"/>
        <eventRef eId="e2" date="2026-03-12" source="#governo" type="generation" refersTo="#promulgation"/>
        <eventRef eId="e3" date="2026-03-15" source="#dre" type="generation" refersTo="#publication"/>
      </lifecycle>
      <analysis source="#dapl"><activeModifications/><passiveModifications/></analysis>
    </meta>
    <preface>
      <p class="docTitle"><docType>Decreto-Lei</docType> <docNumber>n.º 22/2026</docNumber></p>
      <p class="docDate"><date date="2026-03-15">de 15 de março</date></p>
      <p class="shortTitle">Estabelece o regime jurídico ...</p>
    </preface>
    <preamble>
      <recital eId="rec_1"><p class="formula">Considerando que <i>...</i></p></recital>
      <formula type="enacting">
        <p>Assim: Nos termos da alínea a) do n.º 1 do artigo 198.º da Constituição, o Governo decreta o seguinte:</p>
      </formula>
    </preamble>
    <body>
      <article eId="art_1">
        <num>Artigo 1.º</num>
        <heading>Objeto</heading>
        <paragraph eId="art_1__para_1">
          <content><p>O presente decreto-lei estabelece ...</p></content>
        </paragraph>
      </article>
    </body>
    <conclusions>
      <formula type="conclusion"><p>Visto e aprovado em Conselho de Ministros de <date date="2026-03-10">10 de março de 2026</date>.</p></formula>
      <p class="signatureBlock"><signature role="countersignature"><person refersTo="#pessoa-pm-2026-03" as="#primeiro-ministro"/></signature></p>
      <formula type="promulgation"><p>Promulgado em <date date="2026-03-12">12 de março de 2026</date>.</p></formula>
      <p class="signatureBlock"><signature role="promulgation"><person refersTo="#pessoa-pr-2026-03" as="#presidente-republica"/></signature></p>
    </conclusions>
  </act>
</akomaNtoso>
```

## Schematron específico de Decreto-Lei

| Regra | Severity |
|---|---|
| `<act name>` deve ser `dec-lei` | error |
| `<FRBRsubtype>` obrigatório e ∈ {ordinario, autorizado, parlamentar, transposicao} | error |
| `<conclusions>` deve conter ≥1 `<signature role="promulgation">` | error |
| `<conclusions>` deve conter ≥1 `<signature role="countersignature">` (PM) | error |
| Fórmula promulgatória deve coincidir com o catálogo do subtipo | warning |
| Se subtipo = autorizado, preâmbulo deve conter `<ref>` para uma lei | error |
| Se subtipo = transposicao, preâmbulo deve conter `<ref>` para directiva UE (URI `data.europa.eu`) | error |
