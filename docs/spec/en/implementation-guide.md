# AKN-PT — Implementation Guide

Companion document to the Executive Summary and Technical Overview. Targeted
at developers building producers (drafting tools, conversion pipelines) or
consumers (search engines, analysis platforms, legal AI) of AKN-PT documents.

> Authoritative source: Portuguese specification at `../pt/`. This guide
> synthesises implementation-relevant material in EN for international
> partners and contributors.

---

## 1. Quick start — validating an existing document

### Python (lxml)

```python
from lxml import etree, isoschematron

xsd = etree.XMLSchema(etree.parse("schema/xsd/akn-pt.xsd"))
sch = isoschematron.Schematron(
    etree.parse("schema/schematron/akn-pt-rules.sch"),
    store_report=True
)

doc = etree.parse("my-document.akn.xml")

# Step 1: XSD
if not xsd.validate(doc):
    for err in xsd.error_log:
        print(f"XSD: line {err.line}: {err.message}")
    raise SystemExit(1)

# Step 2: Schematron
if not sch.validate(doc):
    ns = "{http://purl.oclc.org/dsdl/svrl}"
    for failed in sch.validation_report.findall(f".//{ns}failed-assert"):
        msg = failed.find(f"{ns}text").text.strip()
        loc = failed.get("location", "?")
        print(f"Schematron: {loc}: {msg}")
    raise SystemExit(1)

print("Valid AKN-PT v0.1.0 document")
```

### Command-line (reference validator, once shipped)

```bash
pip install akn-pt                              # Artefacto 7 (CP5)
akn-pt validate path/to/doc.akn.xml --phase publication
akn-pt validate path/to/doc.akn.xml --phase publication --json
akn-pt validate path/to/doc.akn.xml --phase publication --lang en
```

### xmllint (XSD-only validation)

```bash
xmllint --noout --schema schema/xsd/akn-pt.xsd path/to/doc.akn.xml
```

xmllint does not run Schematron — for full validation use the Python pipeline
or the reference validator.

## 2. Quick start — producing an AKN-PT document

The minimum viable AKN-PT document for a Decree-Law has the following shape
(see `schema/tests/positive/dec-lei-minimal.akn.xml` for a complete example):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0/CSD17">
  <act name="dec-lei">
    <meta>
      <identification source="#dapl">
        <FRBRWork>...</FRBRWork>
        <FRBRExpression>...</FRBRExpression>
        <FRBRManifestation>...</FRBRManifestation>
      </identification>
      <references source="#dapl">
        <!-- TLC actors used by the document -->
      </references>
      <lifecycle source="#dapl">
        <!-- canonical events -->
      </lifecycle>
      <analysis source="#dapl">
        <activeModifications/>
        <passiveModifications/>
      </analysis>
      <!-- <workflow> required for acts published from 2026-07-27 -->
    </meta>
    <preface>
      <p class="docTitle"><docType>...</docType> <docNumber>...</docNumber></p>
      <p class="docDate"><date date="YYYY-MM-DD">...</date></p>
      <shortTitle>...</shortTitle>
    </preface>
    <preamble>
      <recital eId="rec_1"><p class="formula">Considerando que ...</p></recital>
      <formula type="enacting"><p>Assim: ...</p></formula>
    </preamble>
    <body>
      <article eId="art_1">
        <num>Artigo 1.º</num>
        <heading>Objeto</heading>
        <paragraph eId="art_1__para_1">
          <content><p>...</p></content>
        </paragraph>
      </article>
    </body>
    <conclusions>
      <formula type="conclusion"><p>...</p></formula>
      <signature role="countersignature"><person refersTo="#..." as="#..."/></signature>
      <formula type="promulgation"><p>...</p></formula>
      <signature role="promulgation"><person refersTo="#..." as="#..."/></signature>
    </conclusions>
  </act>
</akomaNtoso>
```

## 3. Common pitfalls and how to avoid them

### Pitfall: RCM/Res-AR using `<article>`

The most frequent marking error. RCM (Resolução do Conselho de Ministros)
and Resolução da AR **do not** use `<article>` — they use `<paragraph>`
directly inside `<body>`:

```xml
<!-- WRONG for RCM -->
<body>
  <article eId="art_1">...</article>
</body>

<!-- CORRECT for RCM -->
<body>
  <paragraph eId="para_1">
    <num>1 -</num>
    <content><p>Aprovar a Estratégia ...</p></content>
  </paragraph>
</body>
```

### Pitfall: Wrong signature roles

| Role | Use for |
|---|---|
| `signature` | Neutral signature: PAR, ministers (Portaria/Despacho), PM (RCM), Regional Government President (DRR) |
| `countersignature` | Article 140.º CRP countersignature: PM + ministers in DL; PM only in Lei |
| `promulgation` | Promulgation: President of the Republic (or Representative of the Republic for DLR/DRR) |

Never use `role="promulgation"` for Portaria, RCM, Res-AR or Despacho
normativo — these acts have no promulgation, and Schematron rejects them.

### Pitfall: Inserted article naming

For an article inserted between 5.º and 6.º by an amending act, the PT
convention names it "Artigo 5.º-A". The eId uses underscore, not hyphen:

```xml
<article eId="art_5_a">     <!-- CORRECT: underscore -->
  <num>Artigo 5.º-A</num>
  ...
</article>
```

Hyphenated eId (`art_5-a`) is rejected by Schematron.

### Pitfall: Mixing slug styles in URIs

The act type slug in the ELI-PT URI must be the canonical slug, not the
human-friendly name:

```xml
<!-- WRONG (full PT type slug) -->
<FRBRuri value="https://data.dre.pt/eli/decreto-lei/22/2026/03/15"/>

<!-- CORRECT (ELI slug) -->
<FRBRuri value="https://data.dre.pt/eli/dec-lei/22/2026/03/15"/>
```

The slug catalogue is in §5 of the ELI-PT specification.

### Pitfall: Forgetting `<FRBRsubtype>`

`<FRBRsubtype>` is **mandatory** in AKN-PT (more restrictive than AKN base).
Schematron rejects acts without it.

### Pitfall: Regional acts with wrong jurisdiction

DLR and DRR **must** declare `pt-20` (Azores) or `pt-30` (Madeira) in both:

- `<FRBRcountry value="pt-20">` (or `pt-30`)
- ELI-PT URI segment (e.g. `eli/pt-20/dlr/2026/3/pt`)

And **must not** be promulgated by the President of the Republic — they are
signed by the Representative of the Republic for the respective region.

### Pitfall: Legislative footprint forgotten

For acts published on or after **27 July 2026**, the `<workflow>` block is
**mandatory** with minimum steps (initiative, approval, publication). The
`legislative-footprint` Schematron pattern, active in publication phase,
rejects acts without it.

## 4. Migrating from DOCX

Drafters who currently produce DOCX have several paths to AKN-PT:

### Path A: Manual marking (initial period)

For the first batches of corpus and edge cases, manual marking is acceptable.
The 10-document corpus in `corpus/` was produced this way.

### Path B: DOCX-to-AKN-PT converter (in development)

A converter from styled DOCX (using SmartLegis templates) to AKN-PT is on the
roadmap for v0.2. It will use heuristics on Word styles ("Artigo", "Número",
"Alínea") to produce candidate AKN-PT XML, which a human reviewer then
adjusts before publication.

### Path C: Native AKN-PT editor (target: SmartLegis 2027)

The structured editor in SmartLegis (planned for 2027) will produce AKN-PT
natively; DOCX becomes an export format, not a source.

## 5. Integration patterns

### Pattern: Validation in CI

```yaml
# .github/workflows/validate.yml
name: AKN-PT validation
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: {python-version: '3.12'}
      - run: pip install akn-pt
      - run: |
          for f in corpus/**/*.akn.xml; do
            akn-pt validate "$f" --phase publication
          done
```

### Pattern: Serving an AKN-PT document via HTTP

Implementations exposing AKN-PT URIs should support content negotiation:

| `Accept` header | Return |
|---|---|
| `application/akn+xml; profile=akn-pt-1.0` | AKN-PT XML (canonical) |
| `application/xml` | AKN-PT XML (fallback) |
| `application/json` | JSON with structured metadata + simplified body |
| `text/html` | Rendered HTML |
| `application/pdf` | Facsimile PDF |

Plus RDFa or JSON-LD metadata embedded in the HTML representation, exposing
ELI properties (`eli:type_document`, `eli:date_publication`, etc.).

### Pattern: Indexing for search

Recommended index fields for an AKN-PT-aware search engine:

- `act_type` from `<act @name>`
- `subtype` from `<FRBRsubtype @value>`
- `number` from `<FRBRnumber @value>`
- `year` parsed from `<FRBRWork>/<FRBRuri>`
- `adoption_date` from `<FRBRWork>/<FRBRdate name="adoption">`
- `publication_date` from `<FRBRExpression>/<FRBRdate name="publication">`
- `language` from `<FRBRlanguage>`
- `jurisdiction` from `<FRBRcountry>`
- `short_title` from `<preface>/<shortTitle>`
- `body_text` (extracted plain text from `<body>` for full-text search)
- `references_internal` (eIds referenced by `<ref>`)
- `references_external` (ELI-PT and ELI-EU URIs referenced by `<ref>`)
- `signers` (TLCPerson @eIds referenced by `<signature>`)
- `contributors` (TLCOrganization/TLCPerson @eIds from `<workflow>/<input>/@source`)

### Pattern: Building a consolidation engine

The consolidation engine (v0.2+) takes:

- The original Expression of act B (with its eIds);
- Each amending act (each `<act>` with subtype ending in `-alterador`), with
  `<quotedStructure>` elements describing the replacements;

and produces:

- A new Expression of act B with `{point-in-time}` equal to the entry-into-force
  date of the latest applied amendment;
- An `<analysis>/<passiveModifications>` block recording all changes received;
- An `<analysis>/<activeModifications>` block on the amending acts mirroring
  the corresponding additions.

The eIds of unchanged elements are preserved across Expressions, allowing
stable URI fragments for citations.

## 6. Performance characteristics

Expected validation times with `lxml` + `isoschematron` on Python 3.12 on a
2024-vintage laptop:

| Document size | XSD time | Schematron time | Total |
|---|---|---|---|
| Small DL (10 KB, ~5 articles) | < 50 ms | < 200 ms | < 300 ms |
| Medium Lei (100 KB, ~30 articles) | < 100 ms | < 500 ms | < 700 ms |
| Large code (1 MB, 200+ articles) | < 500 ms | 2–5 s | < 6 s |
| RCM with extensive annex (500 KB) | < 200 ms | < 1 s | < 1.5 s |

For high-throughput environments (production pipeline at INCM), the reference
validator can be configured to use Saxon-HE/EE for XSLT 3.0 Schematron, which
is roughly 5–10× faster than `isoschematron` on large documents.

## 7. Internationalisation (i18n) of validator messages

Default message language is Portuguese. English messages are available via
`--lang en`. The translation mechanism is a flat lookup file
(`validator/src/akn_pt/i18n/en.po` and `pt.po`); each Schematron message has
a stable key.

Adding a new language requires:

1. Copying `pt.po` to `{lang}.po` (e.g. `fr.po`, `es.po`).
2. Translating each `msgstr`.
3. Optionally contributing back via PR.

The validator falls back to the Portuguese message if no translation is found
for a given key.

## 8. Versioning model in practice

Producers and consumers should be aware of the version they target:

| Component | Version source |
|---|---|
| AKN-PT profile version | `<FRBRformat value="application/akn+xml; profile=akn-pt-1.0">` |
| XSD version | Path of the XSD file: `schema/xsd/v0.1.0/akn-pt.xsd` (in future major versions) |
| Schematron version | Header comment in the `.sch` file |
| Validator version | `akn-pt --version` |

The reference validator supports validating against multiple schema versions
in the same install (forward-compatible). A producer in v0.1.0 should
continue to be valid against v0.2.0 schemas.

## 9. Frequently asked questions

**Q: Can I extend AKN-PT with my own elements?**

A: Not in v0.1.0. Custom elements break tooling. If you have a use case
requiring extension, open an issue in the public repo with a concrete
example; the Comissão Técnica AKN-PT (governance body) decides on inclusion
in subsequent versions.

**Q: Can I reuse the same ELI-PT URI for different acts?**

A: Never. Work URIs are forever uniquely associated with their act. See
ELI-PT permanence policy (`eli-pt/permanence-policy.md`).

**Q: How do I reference an EU directive in a transposition DL?**

A: Use the European ELI URI for the directive:
`http://data.europa.eu/eli/dir/2024/123/oj`. Schematron in the publication
phase requires this for acts with `<FRBRsubtype value="dec-lei-transposicao">`.

**Q: What happens to my AKN-PT documents when the standard moves to v1.0?**

A: They remain valid against v0.1.0 schemas (which are preserved at their
version path). Migration to v1.0 is optional and documented as a separate
guide when v1.0 is released.

**Q: Is there a graphical editor?**

A: Not in v0.1.0. The SmartLegis editor (separate project, target 2027) will
produce AKN-PT natively. In the meantime, any XML-aware editor (oXygen, VS
Code with XML extensions) works.

**Q: What is the legal status of AKN-PT v0.1.0?**

A: Technical proposal by DAPL/SGGOV, awaiting (a) formal sanction by a
Secretary-General dispatch (per ADR-0001), and (b) external review per
ADR-0010. The schemas, validator and corpus are production-quality, but
institutional adoption is conditional on the above.

## 10. Where to ask, contribute, report

| Topic | Channel |
|---|---|
| Bug in schema, validator or corpus | GitHub issue in the public repo |
| Proposed extension or new tool | GitHub issue with proposal template |
| Question about interpretation | GitHub Discussions |
| Institutional partnership | bernardo.vidal@... (SGGOV/DAPL coordinator) |
| Press / general comms | SGGOV Press Office |

The public repository, governance committee composition, and contact
addresses are formalised after the Secretary-General dispatch enters force
(target: M0 of the work plan).
