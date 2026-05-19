# AKN-PT — Technical Overview (companion to Executive Summary)

This document complements the **Executive Summary** with technical depth
sufficient for an implementer or peer-reviewer to assess the AKN-PT v0.1.0
design without reading the full Portuguese specification.

For the full specification (~57 pages, in Portuguese), see `../pt/index.md`.

---

## 1. Conformance model

A document is AKN-PT v0.1.0 conformant if and only if all of the following hold:

1. Well-formed XML 1.0.
2. Root element `<akomaNtoso>` in the canonical OASIS namespace
   `http://docs.oasis-open.org/legaldocml/ns/akn/3.0/CSD17`.
3. Contains exactly one `<act>` with `@name` from the v0.1.0 catalogue
   (`dec-lei`, `lei`, `decreto-ar`, `res-ar`, `portaria`, `res-cm`,
   `despacho-normativo`, `dlr`, `drr`).
4. Validates against the AKN-PT v0.1.0 XSD (`schema/xsd/akn-pt.xsd`).
5. Validates against the AKN-PT v0.1.0 Schematron in the invoked phase
   (`drafting`, `review`, `publication`).
6. Declares in `<FRBRManifestation>/<FRBRformat>` the exact value
   `application/akn+xml; profile=akn-pt-1.0`.

The three Schematron phases reflect the lifecycle of a normative act:

- **`drafting`** — author composes; only structural and referential checks
  fire as errors; rest is warnings.
- **`review`** — reviewer assesses before submission; metadata, act-type
  coherence and legistics conventions become errors (warnings for the latter).
- **`publication`** — the strictest; all checks active, including lifecycle
  coherence and FRBR URI consistency.

## 2. Document anatomy

```
akomaNtoso
└── act (@name = "dec-lei"|"lei"|...)
    ├── meta
    │   ├── identification  (FRBRWork + FRBRExpression + FRBRManifestation)
    │   ├── references      (TLC actors: 6 types in v0.1.0)
    │   ├── lifecycle       (eventRefs)
    │   ├── workflow        (optional, v0.2+)
    │   └── analysis        (mandatory empty in v0.1.0; populated by consolidation in v0.2)
    ├── preface             (docType, docNumber, docDate, shortTitle)
    ├── preamble            (recital* + formula type="enacting")
    ├── body                (articulated)
    ├── conclusions         (formulas + signatures)
    └── attachments         (annexes, optional)
```

Two `<body>` styles are formally distinguished and enforced by Schematron:

- **Article-based body** — `<article>+` (typed `dec-lei`, `lei`, `portaria`,
  `decreto-ar`, `despacho-normativo`, `dlr`, `drr`).
- **Paragraph-based body** — `<paragraph>+` directly under `<body>`, without
  `<article>` (typed `res-cm`, `res-ar`).

This distinction reflects Portuguese legistics: Resolutions of the Council of
Ministers and Parliamentary Resolutions use numbered resolution points, not
articles. Misuse of `<article>` in such acts is the most common marking
error in comparable systems and is rejected by Schematron.

## 3. FRBR materialisation

Each document carries the full FRBR triple in `<meta>/<identification>`:

```xml
<identification source="#dapl">
  <FRBRWork>
    <FRBRthis    value="https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt/!main"/>
    <FRBRuri     value="https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt"/>
    <FRBRdate    date="2026-03-10" name="adoption"/>
    <FRBRauthor  href="#governo"/>
    <FRBRcountry value="pt"/>
    <FRBRsubtype value="dec-lei-ordinario"/>
    <FRBRnumber  value="22"/>
  </FRBRWork>
  <FRBRExpression>
    <FRBRthis     value=".../22/pt/2026-03-15/!main"/>
    <FRBRuri      value=".../22/pt/2026-03-15"/>
    <FRBRdate     date="2026-03-15" name="publication"/>
    <FRBRauthor   href="#governo"/>
    <FRBRlanguage language="por"/>
  </FRBRExpression>
  <FRBRManifestation>
    <FRBRthis   value=".../2026-03-15.xml/!main"/>
    <FRBRuri    value=".../2026-03-15.xml"/>
    <FRBRdate   date="2026-03-15" name="publication"/>
    <FRBRauthor href="#dre"/>
    <FRBRformat value="application/akn+xml; profile=akn-pt-1.0"/>
  </FRBRManifestation>
</identification>
```

When the act is amended, the Work URI does not change; a new Expression URI
is minted with a later `{point-in-time}`. The original Expression URI
remains permanently resolvable.

## 4. Actors and lifecycle — vocabulary

### TLC actors (`<references>`)

| TLC | Typical eId examples |
|---|---|
| `TLCOrganization` | `governo`, `ar`, `cm`, `dre`, `dapl`, `ministerio-financas`, `alra`, `alrm`, `gov-regional-acores`, `gov-regional-madeira` |
| `TLCRole` | `primeiro-ministro`, `presidente-republica`, `presidente-ar`, `presidente-alra`, `representante-republica-acores`, `ministro-X` |
| `TLCPerson` | `pessoa-{role}-{YYYY-MM}` — disambiguated by office and month |
| `TLCConcept` | snake_case PT for concepts defined within the act |
| `TLCLocation` | `pt`, `pt-20`, `pt-30`, `lisboa`, `ponta-delgada` |
| `TLCEvent` | `approval-cm`, `approval-ar`, `promulgation`, `signature`, `countersignature`, `publication`, `entry-into-force` |

Each TLC carries `@eId`, `@href` (URI in `/akn/ontology/{type}/{country}/{slug}`)
and `@showAs` (Portuguese display name).

### Lifecycle events

Canonical events in chronological order for a typical Decreto-Lei:

```xml
<lifecycle source="#dapl">
  <eventRef eId="e1" date="2026-03-10" source="#governo" type="generation" refersTo="#approval-cm"/>
  <eventRef eId="e2" date="2026-03-12" source="#governo" type="generation" refersTo="#promulgation"/>
  <eventRef eId="e3" date="2026-03-15" source="#dre"     type="generation" refersTo="#publication"/>
  <eventRef eId="e4" date="2026-04-14" source="#governo" type="generation" refersTo="#entry-into-force"/>
</lifecycle>
```

Schematron (publication phase) enforces that the publication date is on or
after the adoption date.

## 5. ELI-PT identifier scheme

ELI-PT follows the European Legislation Identifier (ELI) template, adapted to
Portugal:

```
{domain}/eli/{jurisdiction}/{type}/{year}/{number}/{language}[/{point-in-time}][.{format}][#{fragment}]
```

- `{domain}` — `eli.gov.pt` (placeholder); recommended final form to be
  negotiated with INCM: `data.dre.pt`.
- `{jurisdiction}` — `pt` for the national level; `pt-20` for the Azores;
  `pt-30` for Madeira.
- `{type}` — act type slug (`dec-lei`, `lei`, `portaria`, etc.).
- `{year}` — four-digit adoption year.
- `{number}` — act number within year+type.
- `{language}` — always `pt` for Portugal.
- `{point-in-time}` — ISO date of consolidated version; absent for original.
- `{format}` — `xml`, `html`, `json`, `pdf`.
- `{fragment}` — internal `eId` (e.g. `#art_5__para_2__lit_a`).

Granularity down to the `point` (alínea) is **mandatory** in fragment URIs.

### Permanence

| Layer | Permanence guarantee |
|---|---|
| Work URI | Forever; never reassigned |
| Expression URI | Forever, even after new consolidations |
| Manifestation URI | Permanent in normal conditions; may be regenerated with HTTP 301 if binary representation changes |

Domain migration (e.g. from `eli.gov.pt` to `data.dre.pt`) is allowed once,
with HTTP 301 from the old domain.

## 6. Legacy URL conversion

The reference converter (`eli-pt/conversion.py`) implements bidirectional
mapping between current `dre.pt` URLs and ELI-PT canonical URIs:

```
https://dre.pt/dre/detalhe/decreto-lei/22-2026-XXXXXXXX
   ↔
https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt
```

The legacy `{hash}` segment is not recoverable from ELI-PT without the INCM
mapping table (a constraint to be addressed in coordination with INCM).

## 6.5 Legislative footprint (Law 5-A/2026)

Portugal's Law 5-A/2026 mandates a structured **legislative footprint** for
all normative acts published from **27 July 2026** onwards. AKN-PT v0.1.0
materialises this requirement through an enriched `<workflow>` block in
`<meta>`:

```xml
<workflow source="#dapl">
  <step eId="step_iniciativa" date="2026-04-15"
        refersTo="#iniciativa" source="#governo">
    <description><p>Government decision to start drafting.</p></description>
  </step>
  <step eId="step_consulta_publica" date="2026-06-01"
        refersTo="#consulta-publica" source="#dapl">
    <description><p>Public consultation, 30 days.</p></description>
    <input eId="input_cip" date="2026-06-15"
           source="#org-cip" type="contributo-consulta-publica">
      <description><p>CIP comments on article 8.</p></description>
      <affects href="#art_8"/>
    </input>
  </step>
  <step eId="step_aprovacao_cm" date="2026-08-01"
        refersTo="#aprovacao-cm" source="#cm"/>
  <step eId="step_publicacao" date="2026-08-15"
        refersTo="#publicacao" source="#dre"/>
</workflow>
```

### Controlled vocabularies

The `<step @refersTo>` attribute uses the `WorkflowStepTarget` enum:

- `#iniciativa` — drafting decision
- `#anteprojeto` — preliminary draft
- `#consulta-publica` / `#consulta-aberta` — formal/informal consultation
- `#consultas-obrigatorias` — mandatory institutional consultations
- `#discussao-na-generalidade` / `#discussao-na-especialidade` — parliamentary discussion
- `#audicao-publica` — parliamentary public hearing
- `#votacao-final-global` — final overall vote
- `#aprovacao-cm` / `#aprovacao-ar` — adoption (CM or AR)
- `#promulgacao` / `#assinatura` — promulgation/signature
- `#publicacao` — publication in Official Journal

The `<input @type>` attribute uses the `ContributionType` enum, including
`representacao-interesse` (registered interest representation / lobbying),
which is specific to the Law 5-A/2026 compliance regime.

### Schematron rule

In the `publication` phase, the `legislative-footprint` pattern enforces:

- Acts with `<FRBRdate name="publication" date >= 2026-07-27">` **must** have
  a `<workflow>` block.
- The workflow must include at least: one `#iniciativa` step, one approval
  step (`#aprovacao-cm`, `#aprovacao-ar` or `#assinatura`), and one
  `#publicacao` step.
- Each `<input>/@source` must resolve to a TLC actor in `<references>`.
- Input dates posterior to the parent step date emit a warning.

### Integration with `<lifecycle>`

`<workflow>` and `<lifecycle>` are complementary, not redundant:

- `<lifecycle>` records the canonical institutional events (adoption,
  promulgation, publication, entry into force) — required for all acts.
- `<workflow>` adds the *process detail*: who initiated, who was consulted,
  who contributed, what amendments were proposed. Required for footprint
  compliance from 27 July 2026.

The dates in the two blocks should be consistent (Schematron emits warnings
on mismatches), but no structural link is enforced — they are independent
records validated for coherence.

## 7. Schema architecture

The XSD is modular, with four files:

- `akn-pt.xsd` — entry point (`<akomaNtoso>` → `<act>`).
- `akn-pt-types.xsd` — regex patterns, enumerations, inline elements.
- `akn-pt-metadata.xsd` — `<meta>` block.
- `akn-pt-structure.xsd` — preface, preamble, body, conclusions, attachments.

The XSD is **self-contained** in v0.1.0 (does not import the OASIS AKN base
schema), enabling validation with any XML parser without external
dependencies. Migration to `xs:import + xs:restriction` is planned for v0.2.

The Schematron has **8 patterns** activated by phase:

| Pattern | drafting | review | publication |
|---|---|---|---|
| structural-integrity | ✓ | ✓ | ✓ |
| referential-integrity | ✓ | ✓ | ✓ |
| metadata-completeness | — | ✓ | ✓ |
| act-type-coherence | — | ✓ | ✓ |
| subtype-coherence | — | ✓ | ✓ |
| legistica-conventions | — | ✓ (warnings) | ✓ (warnings) |
| lifecycle-coherence | — | — | ✓ |
| frbr-uri-consistency | — | — | ✓ |

Specific rules per act type include (selected, illustrative):

- DL must have `<signature role="promulgation">` and `<signature role="countersignature">` in conclusions.
- RCM must not contain `<article>` in body (uses `<paragraph>+`); must have exactly one `<signature>` (PM).
- Portaria must reference enabling law/DL in preamble; must not have `<signature role="promulgation">`.
- DLR must have `<FRBRcountry>` value `pt-20` or `pt-30`; must not be promulgated by the President of the Republic (it is signed by the Representative of the Republic).
- DL of EU directive transposition must reference the directive by its European ELI URI in the preamble.

## 8. Special construct treatment

### Inserted article (Artigo 5.º-A)

```xml
<article eId="art_5_a">
  <num>Artigo 5.º-A</num>
  <heading>Disposição inserida</heading>
  ...
</article>
```

eId uses underscore (`art_5_a`), not hyphen. Position is immediately after
`art_5`, before `art_6`.

### Amendment with quoted text

```xml
<paragraph eId="art_2__para_1">
  <intro>
    <p>São alterados os artigos 3.º e 5.º do <ref href="https://eli.gov.pt/eli/pt/dec-lei/2025/22/pt">Decreto-Lei n.º 22/2025</ref>, que passam a ter a seguinte redação:</p>
  </intro>
  <quotedStructure>
    <article eId="quoted__art_3">
      ...
    </article>
  </quotedStructure>
</paragraph>
```

eIds inside `<quotedStructure>` use `quoted__` prefix to avoid collision.

### Technical republication in annex

```xml
<attachment eId="anx_1">
  <heading>Anexo (a que se refere o n.º 1 do artigo 5.º)</heading>
  <subheading>Decreto-Lei n.º 22/2025, de 5 de novembro (Republicação)</subheading>
  <mainBody>
    <article eId="rep__art_1">...</article>
    <article eId="rep__art_2">...</article>
    <!-- full republished act, with rep__ prefixed eIds -->
  </mainBody>
</attachment>
```

## 9. Validator implementation

The reference validator (Artefacto 7) is implemented in Python 3.12+ with
`lxml`. It provides:

- **CLI**: `akn-pt validate path/to/doc.akn.xml --phase publication`
- **Python library**: `from akn_pt import validate`
- **Web UI**: minimal drag-and-drop FastAPI app
- **JSON output**: `--json` for machine consumption
- **i18n**: PT messages by default; `--lang en` for English

The Schematron uses `queryBinding="xslt"` (XSLT 1.0) for compatibility with
`lxml.isoschematron`. Migration to `xslt2` with Saxon-HE/EE is straightforward
for production environments where `matches()` regex is required.

## 10. Test suite

The schema test suite verifies 39 scenarios:

- **9 positive tests** (one per act type): must pass XSD and Schematron.
- **20 XSD-negative tests**: deliberate errors that must fail XSD.
- **10 Schematron-negative tests**: pass XSD but must fail Schematron.

Run with:
```
python schema/tests/run_tests.py [-v]
```

All 39 tests pass in the v0.1.0 release. The corpus (10 real Portuguese acts
marked in AKN-PT) is validated in CI on every commit.

## 11. Interoperability with AKN4EU

AKN-PT is a peer profile to AKN4EU, not derived. Three interoperability
guarantees:

1. **Namespace alignment**: both profiles declare the canonical OASIS
   namespace as their root namespace.
2. **EU directive references**: DLs of transposition reference the directive
   by its European ELI URI (`http://data.europa.eu/eli/dir/YYYY/N/oj`),
   which is the URI AKN4EU itself uses.
3. **HTTP content negotiation**: both profiles produce RDFa or JSON-LD
   metadata using the ELI vocabulary.

There is no automatic mapping between AKN-PT and AKN4EU document structures —
they describe different things (PT national acts vs. EU institutional
documents).

## 12. Open questions and future evolution

Recorded in `decisions-log.md` and chapter 17 of the PT specification.
Headline items:

- Final ELI-PT domain — to be negotiated with INCM (target M3).
- EuroVoc classification — planned mandatory in v0.2.
- Automated consolidation engine populating `<analysis>` — v0.2+.
- Structured legislative footprint (Law 5-A/2026 compliance) — v0.2.
- Case law artefact with `<judgment>` model — v0.3 (separate project).
- Migration to `xs:import + xs:restriction` of OASIS AKN base — v0.2.

External peer review per ADR-0010:

- Monica Palmirani (Bologna) — M1, M3.
- Fotis Fitsilis (Hellenic Parliament) — M1, M4.
- Publications Office EU (AKN4EU team) — M3.
- Portuguese legistics scholar (Blanco de Morais, Lanceiro, or ICJP senior
  jurist) — ongoing monthly review.

## 13. Where to find everything

```
02. Artefactos AKN-PT v0.1.0/
├── README.md
├── decisions-log.md
├── docs/
│   ├── spec/
│   │   ├── pt/ (17 chapters, ~57pp)
│   │   └── en/ (executive-summary + this technical-overview)
│   └── adr/ (10 ADRs — proposed)
├── mapping/v0.1.0/ (12 files: README, _common-patterns, _metadata, _special-cases, 9 act-type fiches)
├── eli-pt/
│   ├── specification-pt.md / specification-en.md (bilingual ELI-PT spec)
│   ├── uri-templates.md
│   ├── permanence-policy.md
│   ├── conversion.py + tests
├── schema/
│   ├── xsd/ (4 modules)
│   ├── schematron/akn-pt-rules.sch
│   └── tests/ (positive + negative; runner)
├── corpus/ (10 real Portuguese acts marked in AKN-PT)
└── validator/ (Python reference implementation, v0.1.0 forthcoming)
```

The Portuguese version is authoritative. This English material is provided
for international peer review.
