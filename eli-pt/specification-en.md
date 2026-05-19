# ELI-PT Specification v0.1.0

**European Legislation Identifier — Portuguese National Profile**

Version: 0.1.0 (proposal) · Date: 2026-05-18 · Licence: EUPL-1.2

> Authoritative version: Portuguese (`specification-pt.md`). This translation is
> normative for international review and interoperability purposes. In case of
> divergence, the Portuguese version prevails.

---

## 1. Introduction

### 1.1 Purpose

ELI-PT defines the canonical URI identifier scheme for normative acts
published in Portugal, in alignment with the **European Legislation
Identifier (ELI)** standard established by Council Conclusions of 6
November 2017 (2017/C 441/05), maintained by the EU Publications Office.

ELI-PT is one of the three technical foundations of the AKN-PT project,
alongside the Akoma Ntoso customisation and the reference validator.

### 1.2 Audience

- Technical teams at SGGOV, INCM and AR responsible for publishing or
  consuming Portuguese legislation.
- Implementers of systems that produce, transform or index PT acts.
- The European ELI community, for review and interoperability.

### 1.3 Status

ELI-PT v0.1.0 is a **technical proposal** developed by DAPL/SGGOV as part of
the AKN-PT project. Institutional formalisation, including the final domain
choice (ADR-0009), depends on coordination with INCM.

### 1.4 Notation

The keywords **MUST**, **MUST NOT**, **SHOULD** and **MAY** are used per RFC
2119. URI examples use the placeholder `eli.gov.pt`; final form will be set by
INCM in coordination with SGGOV; the path structure is independent of the
chosen domain.

---

## 2. Principles

Every ELI-PT identifier **MUST** satisfy all of:

1. **Persistence** — once minted, the URI does not change. Technical
   reorganisations must guarantee continuity via HTTP 301 redirects.
2. **Resolvability** — the URI **SHOULD** resolve to an accessible
   representation (HTML, AKN-PT XML, PDF) by content negotiation.
3. **Compositionality** — the URI is built mechanically from act metadata
   (type, year, number, jurisdiction, language).
4. **Presentation independence** — the URI identifies the act, not its visual
   representation on the dre.pt portal.
5. **EU-ELI compatibility** — preserves the mandatory `/eli/` ELI fields with
   the exact semantics defined by PubOffice EU.
6. **FRBR granularity** — the URI expresses the Work / Expression /
   Manifestation layers; fragment URIs express internal subdivisions.

---

## 3. Canonical template

```
{domain}/eli/{jurisdiction}/{type}/{year}/{number}/{language}[/{point-in-time}][.{format}][#{fragment}]
```

| Segment | Cardinality | Description |
|---|---|---|
| `{domain}` | 1 | Authoritative domain. Placeholder: `eli.gov.pt`. Substantive recommendation: `data.dre.pt`. |
| `eli` | 1 | Literal ELI scheme marker (EU compatibility). |
| `{jurisdiction}` | 1 | Lowercase ISO 3166-1 alpha-2 + optional ISO 3166-2. See §4. |
| `{type}` | 1 | Act type slug. See §5. |
| `{year}` | 1 | Adoption year, four digits (`YYYY`). |
| `{number}` | 1 | Act number within year+type. |
| `{language}` | 1 | ISO 639-1 of the expression. Portugal: always `pt`. |
| `{point-in-time}` | 0..1 | Consolidated expression date (see §6). |
| `{format}` | 0..1 | Requested manifestation (`xml`, `html`, `pdf`). |
| `{fragment}` | 0..1 | Internal fragment (article, paragraph, point). See §7. |

### 3.1 Short vs full form

- **Work URI:** up to `{language}`. `https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt`
- **Expression URI:** adds `{point-in-time}`. `…/dec-lei/2026/22/pt/2027-01-15`
- **Manifestation URI:** adds `.{format}`. `…/2026/22/pt/2027-01-15.xml`
- **Fragment URI:** adds `#{fragment}`. `…/2026/22/pt#art_5__para_1__lit_a`

---

## 4. Jurisdiction

| Code | Meaning |
|---|---|
| `pt` | Portuguese Republic (national acts) |
| `pt-20` | Autonomous Region of the Azores |
| `pt-30` | Autonomous Region of Madeira |

Regional legislative and regulatory decrees **MUST** use `pt-20` or `pt-30`
depending on the issuing region.

---

## 5. Act types (v0.1.0 scope)

| Slug | PT type | Relevant `<FRBRsubtype>` values |
|---|---|---|
| `dec-lei` | Decreto-Lei (government decree-law) | ordinario, autorizado, parlamentar, transposicao, alterador |
| `lei` | Lei (parliamentary statute) | comum, organica, de-bases, autorizacao, revisao |
| `decreto-ar` | Parliamentary decree (e.g. treaty approval) | tratado, mandato, outros |
| `res-ar` | Parliamentary resolution | recomendacao, aprovacao, politica, cessacao-vigencia |
| `portaria` | Ministerial regulation | regulamentar, execucao, extensao |
| `res-cm` | Council of Ministers resolution | normativa, politica, administrativa |
| `despacho-normativo` | Normative dispatch | normativo, conjunto |
| `dlr` | Regional legislative decree | ordinario, autorizado |
| `drr` | Regional regulatory decree | execucao, regulamentar |

Out-of-scope types (case law, administrative acts, pre-1976 acts, budget
acts) are reserved for v0.2+ and **MUST NOT** be identified under these slugs.

---

## 6. Point-in-time (consolidated version)

`{point-in-time}` is the date from which the expression produces effects —
i.e. the date of the last in-force amendment incorporated in that version.

- Format: ISO 8601 (`YYYY-MM-DD`).
- Absence: the URI refers to the original version.
- Recommended: omit segment for the original version, for conciseness.

Examples: `…/dec-lei/2026/22/pt` (original), `…/dec-lei/2026/22/pt/2027-01-15` (consolidated at 2027-01-15).

---

## 7. Internal fragments

Fragments correspond literally to the AKN-PT `eId`, after `#`.

| Granularity | Fragment |
|---|---|
| Article | `#art_5` |
| Article paragraph | `#art_5__para_2` |
| Point (alínea) | `#art_5__para_2__lit_a` |
| Sub-point (subalínea) | `#art_5__para_2__lit_a__sublit_i` |
| Chapter | `#cap_2` |
| Annex | `#anx_1` |
| Recital | `#rec_3` |

Granularity down to the point (alínea) is **MANDATORY**. Sub-points are
optional. Below that (word, sentence) is out of scope.

---

## 8. FRBR ↔ ELI-PT mapping

| FRBR layer | ELI-PT component |
|---|---|
| Work | `{domain}/eli/{jurisdiction}/{type}/{year}/{number}` |
| Expression | Work + `/{language}[/{point-in-time}]` |
| Manifestation | Expression + `.{format}` |
| Item | No ELI URI (item is a physical instance) |

This mirrors AKN-PT `<meta>/<identification>`.

---

## 9. Mandatory ELI metadata

When the HTML/data representation of an act is served, the following ELI
metadata **MUST** be present in RDFa, Schema.org or JSON-LD:

| ELI property | AKN-PT source |
|---|---|
| `eli:type_document` | `<FRBRsubtype>` or `<act name>` |
| `eli:date_document` | `<FRBRWork>/<FRBRdate name="adoption">` |
| `eli:date_publication` | `<FRBRExpression>/<FRBRdate name="publication">` |
| `eli:date_entry_in_force` | `<lifecycle>` event `entry-into-force` |
| `eli:date_no_longer_in_force` | (if repealed, v0.2+) |
| `eli:passed_by` | `<FRBRauthor>` |
| `eli:title` | `<preface>/<shortTitle>` |
| `eli:id_local` | `<FRBRnumber>` |
| `eli:language` | `<FRBRlanguage>` |
| `eli:is_about` | EuroVoc classification when available |

---

## 10. Permanence and versioning

See `permanence-policy.md`. Summary:

- Work URIs are permanent forever.
- Expression URIs are permanent forever, even after new consolidations.
- Manifestation URIs **may** be regenerated if the binary representation
  changes (e.g. XML correction); the new manifestation **MUST** be
  semantically equivalent.
- Any URI change **MUST** be accompanied by an HTTP 301 permanent redirect.

---

## 11. Content negotiation

Implementations **SHOULD** support HTTP content negotiation:

| `Accept` header | Returns |
|---|---|
| `application/akn+xml; profile=akn-pt-1.0` | AKN-PT XML |
| `application/xml` | AKN-PT XML (fallback) |
| `application/json` | Structured JSON with ELI metadata + simplified body |
| `application/pdf` | Facsimile PDF |
| `text/html` | Human-readable HTML |

When no representation is available in the requested format, return HTTP 406
with the list of available representations.

---

## 12. Legacy URL compatibility (dre.pt)

Current portal URLs of the form
`https://dre.pt/dre/detalhe/decreto-lei/22-2026-XXXXXXXX` are recognised but
not normative. INCM **SHOULD** publish canonical mappings and HTTP 301
redirects from legacy URLs to corresponding ELI-PT URIs, preserving
traceability. The reference converter (`conversion.py`) provides bidirectional
operation.

---

## 13. Conformance

An implementation **conforms** to ELI-PT v0.1.0 if it:

1. Produces URIs with the structure of §3.
2. Maintains permanence per §10.
3. Supports the mandatory ELI metadata of §9.
4. Respects the constraints in §§4–7.

An implementation is **strict conformant** if it additionally:

5. Supports content negotiation (§11).
6. Publishes legacy URL mappings (§12).

---

## 14. Open questions

1. Final domain — `data.dre.pt`, `eli.gov.pt`, `dados.gov.pt/eli`, etc.
2. When to introduce EuroVoc indexing — proposed v0.2.
3. Granularity below point (sentence, word) — out of scope today.
4. Referencing transposed EU directives — using ELI EU (`data.europa.eu/eli/dir/…`) directly.

---

## 15. References

- ELI Council Conclusions 2017/C 441/05.
- W3C ELI Implementation Methodology, PubOffice EU.
- OASIS Akoma Ntoso 1.0 LegalDocML — §10.
- Constitution of the Portuguese Republic.
- AKN-PT mapping v0.1.0.
- ADR-0009 (ELI-PT domain strategy).
