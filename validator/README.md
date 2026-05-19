# akn-pt — AKN-PT reference validator

[![License: EUPL 1.2](https://img.shields.io/badge/license-EUPL--1.2-blue.svg)](https://eupl.eu)
![Python: 3.12+](https://img.shields.io/badge/python-3.12%2B-blue.svg)
![Tests: 50/50](https://img.shields.io/badge/tests-50%2F50-brightgreen.svg)

Reference Python validator and library for the **AKN-PT** profile
(Portuguese national customisation of the OASIS Akoma Ntoso 1.0 standard for
legal documents).

## Features

- **Two-stage validation**: XSD (W3C XML Schema) + Schematron (ISO).
- **Three phases**: `drafting`, `review`, `publication`.
- **Bilingual** (PT default, `--lang en`).
- **Multiple outputs**: text (human), JSON (machine), SVRL (Schematron-native).
- **Footprint summary**: when `<workflow>` is present, the validator
  summarises the legislative footprint (Lei n.º 5-A/2026).
- **Library + CLI + Docker**: use programmatically, via command line, or in
  a containerised pipeline.

## Install

```bash
pip install akn-pt
```

Or, from source:

```bash
git clone https://github.com/dapl-sggov/akn-pt
cd akn-pt/validator
pip install -e .[dev]
```

## CLI usage

### Validate a single document

```bash
akn-pt validate path/to/document.akn.xml
akn-pt validate path/to/document.akn.xml --phase drafting
akn-pt validate path/to/document.akn.xml --phase review --lang en
akn-pt validate path/to/document.akn.xml --json
akn-pt validate path/to/document.akn.xml -v          # verbose
akn-pt validate path/to/document.akn.xml --quiet     # only OK / FAIL
```

### Batch validation of a directory

```bash
akn-pt batch corpus/
akn-pt batch corpus/ --phase publication --pattern "*.akn.xml"
```

### Inspect bundled schemas

```bash
akn-pt schema-path           # prints path to bundled XSD/Schematron files
```

> **Schema canónica vs. cópia distribuída.** A única source-of-truth dos
> XSD e Schematron é `schema/` na raiz do monorepo. `validator/src/akn_pt/data/`
> contém uma **cópia** distribuída com o pacote pip (necessário porque é
> carregada via `importlib.resources`). Para sincronizar após editar o canónico:
>
> ```bash
> python tools/sync_schemas.py           # copia schema/ → validator/data/
> python tools/sync_schemas.py --check   # falha se houver drift (uso em CI)
> ```

### Version

```bash
akn-pt --version
```

## Library usage

```python
from akn_pt import validate, Phase

report = validate("path/to/doc.akn.xml", phase="publication", lang="pt")

if report.valid:
    print(f"OK — {report.act_type} n.º {report.doc_number}")
else:
    for err in report.errors:
        print(f"  {err.location}: {err.message}")

# Export as dict / JSON
import json
print(json.dumps(report.to_dict(), ensure_ascii=False, indent=2))
```

## Docker

```bash
docker build -t akn-pt:0.1.0 -f Dockerfile .
docker run --rm -v "$(pwd):/work" akn-pt:0.1.0 validate /work/doc.akn.xml
docker run --rm -v "$(pwd):/work" akn-pt:0.1.0 batch /work/corpus
```

Production image is published at `ghcr.io/sggoverno/akn-pt:0.1.0` after each
release tag.

## What the validator checks

### XSD (`schema/xsd/akn-pt.xsd`)

- Structural well-formedness against the AKN-PT modular schema (4 files).
- Identifier patterns (eId, ELI-PT URI, ontology URI).
- Controlled enums: `<act @name>`, `<FRBRsubtype>`, `<FRBRcountry>`,
  `<FRBRlanguage>`, signature roles, formula types, lifecycle event targets,
  workflow step types, contribution types.

### Schematron (`schema/schematron/akn-pt-rules.sch`)

9 patterns, activated by phase:

| Pattern | Drafting | Review | Publication |
|---|:-:|:-:|:-:|
| `structural-integrity` | ✓ | ✓ | ✓ |
| `referential-integrity` | ✓ | ✓ | ✓ |
| `metadata-completeness` | | ✓ | ✓ |
| `act-type-coherence` | | ✓ | ✓ |
| `subtype-coherence` | | ✓ | ✓ |
| `legistica-conventions` | | ✓ | ✓ |
| `lifecycle-coherence` | | | ✓ |
| `frbr-uri-consistency` | | | ✓ |
| `legislative-footprint` | | | ✓ |

The `legislative-footprint` pattern enforces, for acts published on or after
**27 July 2026**, the presence of a `<workflow>` block with minimum steps
(initiative, approval, publication), per Law 5-A/2026.

## API surface

| Symbol | Purpose |
|---|---|
| `akn_pt.validate(xml, phase, lang)` | Main entry point; returns `ValidationReport` |
| `akn_pt.ValidationReport` | Structured result (errors, warnings, metadata, footprint summary) |
| `akn_pt.Phase` | Enum-like values: `DRAFTING`, `REVIEW`, `PUBLICATION` |
| `akn_pt.set_language(lang)` | Set i18n language for labels |

## Testing

```bash
pytest                          # 50 tests (unit + integration + CLI)
pytest tests/test_core.py       # core engine only
pytest tests/test_integration_corpus.py    # full corpus validation
```

## Performance

Expected timings (Python 3.12 + lxml on a modern laptop):

| Document size | XSD | Schematron | Total |
|---|---|---|---|
| Small DL (10 KB) | < 50 ms | < 200 ms | < 300 ms |
| Medium Lei (100 KB) | < 100 ms | < 500 ms | < 700 ms |
| Large code (1 MB) | < 500 ms | 2–5 s | < 6 s |

For high-throughput environments, replace `isoschematron` with Saxon-HE
(XSLT 3.0) — typically 5–10× faster on large documents.

## Limitations (v0.1.0)

1. **Schematron messages are PT-only** — `--lang en` translates validator
   labels (headers, summary) but **not** assertion text. Full message
   translation planned for v0.1.1 via stable message ids.
2. **Schematron uses XSLT 1.0** (for `lxml.isoschematron` compatibility) —
   the `matches()` regex used in some rules is simplified to `starts-with`.
   Migration to XSLT 2.0 with Saxon is documented in
   `schema/schematron/akn-pt-rules.sch`.
3. **Phase filtering is post-hoc** — the Schematron is invoked unfiltered
   and pattern issues are filtered by name. In production, recompile per
   phase for performance.

## Licence

EUPL-1.2. See [LICENSE](https://eupl.eu).

## See also

- [Specification (PT)](../docs/spec/pt/index.md) — 18 chapters, ~63 pages
- [Specification (EN)](../docs/spec/en/) — executive summary + technical overview + implementation guide
- [Schemas](../schema/) — XSD modular + Schematron + tests
- [Corpus](../corpus/) — 10 real Portuguese diplomas marked in AKN-PT
- [ELI-PT specification](../eli-pt/) — Portuguese ELI profile (bilingual PT/EN)
- [ADRs](../docs/adr/) — 10 architectural decision records

## Contact

`bernardo.vidal@sg.gov.pt` (DAPL / SGGOV — project coordinator)
