# AKN-PT — Executive Summary

**Portuguese National Profile of the Akoma Ntoso Standard (OASIS LegalDocML 1.0)**

Version: 0.1.0 (proposal) · Date: 2026-05-18 · Licence: EUPL-1.2
Authority: Legislative Process Support Division (DAPL) / Portuguese Government Secretariat-General (SGGOV)

> Authoritative version: Portuguese (`../pt/`). This summary is normative for
> international review purposes. In case of divergence, the Portuguese version
> prevails.

---

## 1. What AKN-PT is

AKN-PT is the **Portuguese national profile of the Akoma Ntoso 1.0 standard**
(OASIS LegalDocML), applied to the structured representation of normative
acts published in Portugal.

It is a single coherent body defining:

1. Which **act types** are covered (v0.1.0 catalogue).
2. Which **XML structure** each type must have (XSD + Schematron).
3. How **acts and their versions are identified** (ELI-PT scheme).
4. Which **metadata** accompany them (FRBR triple, actors, lifecycle).
5. How a **candidate document is validated** (three-phase validation).
6. How the result is **reused** (references, citations, conversions).

The XML namespace is the canonical OASIS one
(`http://docs.oasis-open.org/legaldocml/ns/akn/3.0/CSD17`); the national
profile is declared in `<FRBRformat>` as
`application/akn+xml; profile=akn-pt-1.0`. Generic Akoma Ntoso tools open
AKN-PT documents without modification; profile-aware tools enforce
additional invariants.

## 2. Why now

Three immediate Portuguese alignments make AKN-PT urgent:

- **SmartLegis**, the new legislative drafting platform, goes to production
  in 2026. Defining the canonical format now decides the rest.
- **Law 5-A/2026** makes the legislative footprint mandatory from 27 July
  2026. Its technical implementation requires structured text.
- The planned **Brussels mission** opens direct access to the Publications
  Office (AKN4EU) and DG REFORM's Technical Support Instrument.

Adoption now is **convergence with established practice**, not vanguard —
Italy (Senato della Repubblica), the EU (AKN4EU), Greece (Hellenic
Parliament), Spain (BOE), UK (National Archives) and Brazil (LexML) already
use Akoma Ntoso in production.

## 3. Scope of v0.1.0

**Full coverage** (mapping + schema + corpus example): Decreto-Lei,
Lei (AR), Portaria, Resolução do Conselho de Ministros.

**Skeleton coverage** (mapping + schema, corpus example in v0.1.x or v0.2):
Decreto da AR, Resolução da AR, Despacho normativo, Decreto Legislativo
Regional (Açores and Madeira), Decreto Regulamentar Regional.

**Out of scope** (deferred to later versions): case law (Akoma Ntoso has a
separate `<judgment>` model deserving its own artefact), administrative
acts, pre-1976 acts, budget acts, communications to the Constitutional
Court, notices from independent regulators (Banco de Portugal, CMVM).

## 4. Foundational decisions (ADRs)

Ten Architecture Decision Records frame the project. Summary:

| # | Decision | Status |
|---|---|---|
| 0001 | Governance: **hybrid model** — SG dispatch + EUPL + interinstitutional Technical Committee | Proposed |
| 0002 | Licence: **EUPL-1.2** (LEOS precedent) | Proposed |
| 0003 | Repository: **GitHub monorepo**, eventual mirror to code.europa.eu | Proposed |
| 0004 | Conformance: **three phases** — drafting / review / publication | Proposed |
| 0005 | Namespace: **canonical OASIS**; AKN-PT profile in `<FRBRformat>` | Proposed |
| 0006 | Languages: spec body PT + EN summary; ADRs EN; code/commits EN | Proposed |
| 0007 | Scope v0.1.0: 4 full + 5 skeleton types | Proposed |
| 0008 | Validator stack: **Python 3.12+ + lxml** | Proposed |
| 0009 | ELI-PT domain: placeholder `eli.gov.pt`; final negotiated with INCM | Proposed |
| 0010 | External review per milestone: Palmirani (M1, M3), Fitsilis (M1, M4), PT legistics specialist (ongoing), Publications Office EU (M3) | Proposed |

## 5. Architecture overview

```
akomaNtoso (OASIS namespace)
└── act (@name: dec-lei|lei|portaria|res-cm|decreto-ar|res-ar|despacho-normativo|dlr|drr)
    ├── meta
    │   ├── identification  (FRBR Work + Expression + Manifestation)
    │   ├── references      (TLC actors: Organization, Person, Role, ...)
    │   ├── lifecycle       (eventRefs)
    │   └── analysis        (empty in v0.1.0; populated by automated consolidation in v0.2+)
    ├── preface             (docType, docNumber, docDate, shortTitle)
    ├── preamble            (recitals + enacting formula)
    ├── body                (article+ OR paragraph+ depending on type)
    ├── conclusions         (formulas + signatures)
    └── attachments         (annexes)
```

For each act type, the schema specifies invariants validated in two layers:

- **XSD** — structure, types, regex for identifiers, enums for slugs.
- **Schematron** — cross-element invariants, referential integrity, semantic
  coherence, legistics conventions; three phases with progressive strictness.

## 6. Identifiers — three layers

| Layer | Identifies | Example |
|---|---|---|
| `eId` | Internal fragments | `art_5__para_1__lit_a` |
| FRBR URI | Work / Expression / Manifestation | `https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt[/2027-01-15][.xml]` |
| ELI-PT | Institutional identifier (subset of FRBR URI following the canonical template) | (same form) |

ELI-PT follows the European Legislation Identifier template:

```
{domain}/eli/{jurisdiction}/{type}/{year}/{number}/{language}[/{point-in-time}][.{format}][#{fragment}]
```

Where `{jurisdiction}` is `pt` (national), `pt-20` (Azores) or `pt-30`
(Madeira). The `{domain}` is `eli.gov.pt` as placeholder; the substantive
recommendation to INCM is `data.dre.pt`. Granularity down to the `point`
(alínea) is mandatory in fragment URIs; sub-points are optional.

## 7. Differences from comparable profiles

- **AKN4EU**: AKN-PT is parallel, not derived. Same standard base; different
  identifiers (national vs. EU); different metadata vocabularies for actors.
  Interoperability via EU ELI URIs for transposed directives.
- **AKN-IT (Senato)**: AKN-PT is more permissive structurally but matches IT
  on strictness of semantic Schematron rules. AKN-PT adopts the three-phase
  conformance model, less strict than IT in drafting phase.
- **LegalDocML.de**: Similar in scope but distinct in vocabulary (act type
  catalogue reflects German constitutional architecture).

## 8. Tools delivered with v0.1.0

- **XSD modular schema** (4 files in `schema/xsd/`).
- **Schematron rule set** (1 file with 8 patterns, 3 phases).
- **Test suite**: 9 positive + 20 XSD-negative + 10 Schematron-negative = 39
  test cases.
- **Reference validator** (Python 3.12+, lxml-based; CLI + library + Docker).
- **Corpus** of 10 real Portuguese acts marked in AKN-PT.
- **ELI-PT URI converter** (`dre.pt` legacy URLs ↔ ELI-PT canonical URIs).

## 9. Project governance and timeline

Six-month plan (M0 → M6) from 2026-05:

| Phase | Months | Deliverable |
|---|---|---|
| Setup | M0 | Public repo; foundational ADRs |
| Foundation | M1–M2 | Mapping; ELI-PT v0.1; spec skeleton |
| Build | M3–M4 | XSD; Schematron; 3 corpus examples |
| Integration | M5–M6 | Validator; full 10-example corpus; external review; v0.1.0 release |

Long-term roadmap:

- **2027**: SmartLegis native AKN-PT in production; bridge to INCM.
- **2028**: AR adoption; end-to-end legislative footprint chain.
- **2029+**: Maturity; EUR-Lex interoperability; legal AI over AKN-PT.

## 10. How to engage

The project is open to external review and contribution. Specifically:

- **Comments on the spec or schemas**: open an issue in the public repo.
- **Test against your real Portuguese acts**: use the validator
  (`pip install akn-pt`) on your corpus and report mismatches.
- **National profile of Akoma Ntoso peer review**: structured review requests
  per ADR-0010 are open for Palmirani (Bologna), Fitsilis (Hellenic
  Parliament), Publications Office (AKN4EU team) and Portuguese legistics
  scholars.
- **Institutional liaison**: SGGOV/DAPL is the entry point (Bernardo Vidal,
  coordinator).

## 11. Where to find more

- Full Portuguese specification: `../pt/` (17 chapters).
- ELI-PT specification (bilingual PT/EN): `../../eli-pt/`.
- ADRs: `../../adr/` (10 architectural decisions with reasoning).
- Mapping: `../../mapping/v0.1.0/` (PT typology → AKN elements).
- Schemas and tests: `../../schema/`.
- Reference validator: `../../validator/`.
- Corpus of marked examples: `../../corpus/`.

## 12. Acknowledgements

This profile builds on the work of the OASIS LegalDocML TC (M. Palmirani,
F. Vitali et al.), the AKN4EU effort (Publications Office EU), the LEOS
project (European Commission), the Senato della Repubblica customisation,
LexML Brasil, the Hellenic Parliament LEOS reuse (F. Fitsilis et al.), and
Portuguese legistics scholarship (C. Blanco de Morais, R. Lanceiro and the
ICJP/FDUL community).
