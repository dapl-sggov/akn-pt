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

ELI-PT **v0.2** (2026-06-22) is aligned with INCM's **production template**.
Supporting research confirmed that **Portugal has been a registered ELI
implementer since 2016/2017**, operated by INCM at **`data.dre.pt`**. The
canonical ELI-PT template is therefore the **`data.dre.pt` template already in
production** (see ADR-0009, 2026-06-22 revision). DAPL's earlier form
(`eli.gov.pt`, year+number) is retained as a **proposed evolution** (§16).
Final confirmation (domain, type table, consolidated form, language code) is
deferred to the 2026-07-01 INCM meeting.

### 1.4 Notation

The keywords **MUST**, **MUST NOT**, **SHOULD** and **MAY** are used per RFC
2119. URI examples use the **canonical domain `data.dre.pt`** (in production);
where the earlier proposed form is illustrated, `eli.gov.pt` is used and
explicitly noted.

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

## 3. Canonical template (data.dre.pt — INCM production)

```
https://data.dre.pt/eli/{type}/{number}/{year}/{month}/{day}[/{p|point-in-time}/dre/{language}[/{format}]][#{fragment}]
```

Real resolvable example: `http://data.dre.pt/eli/dec-lei/83/2016/12/16/p/dre/pt/html`

| Segment | Cardinality | Description |
|---|---|---|
| `data.dre.pt` | 1 | Authoritative domain (INCM/DRE). |
| `eli` | 1 | Literal ELI scheme marker (EU compatibility). |
| `{type}` | 1 | Act type slug. See §5. **Precedes the number.** |
| `{number}` | 1 | Act number (suffix allowed, e.g. `205-B`). |
| `{year}/{month}/{day}` | 1 | **Publication date** in the DR. |
| `p` | 0..1 | "As published" version marker; replaced by `{point-in-time}` (ISO date) for consolidations. See §6. |
| `dre` | 0..1 | Agent (Diário da República). |
| `{language}` | 0..1 | `pt` (2-letter, INCM convention). `<FRBRlanguage>` uses `por`. |
| `{format}` | 0..1 | Manifestation as **segment** (`xml`, `html`, `pdf`) — not extension. |
| `{fragment}` | 0..1 | Internal fragment (= AKN-PT eId). See §7. |

> **No jurisdiction segment** (unlike the earlier proposed form). Jurisdiction
> (`pt-20`/`pt-30`) is carried in `<FRBRcountry>`. See §4.

### 3.1 FRBR layers

- **Work:** up to `{day}`. `https://data.dre.pt/eli/dec-lei/83/2016/12/16`
- **Expression (as published):** adds `/p/dre/pt`. `…/16/p/dre/pt`
- **Expression (consolidated):** `p` becomes `{point-in-time}`. `…/16/2024-01-01/dre/pt`
- **Manifestation:** adds `/{format}` (segment). `…/16/p/dre/pt/xml`
- **Fragment URI:** adds `#{fragment}`. `…/p/dre/pt#art_5__para_1__lit_a`

> **Constructibility note:** this template requires the full publication date
> (year/month/day). That date is present in the **complete Portuguese legistic
> citation** — e.g. "Decreto-Lei n.º 43-B/2024, de 2 de julho" — so the
> canonical URI **is constructible from a complete citation**: the parser
> simply extracts the "..., de {day} de {month} [de {year}]" component and maps
> the month name to its number. **Caveat:** an *abbreviated* citation ("DL
> 43-B/2024", lacking "de {day} de {month}") is insufficient — but that is an
> incomplete citation by legistic convention, not a flaw of the scheme. See §16
> (proposed form; its merits are explicit jurisdiction + EU aesthetics).

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

| FRBR layer | ELI-PT component (canonical) |
|---|---|
| Work | `https://data.dre.pt/eli/{type}/{number}/{year}/{month}/{day}` |
| Expression | Work + `/{p\|point-in-time}/dre/{language}` |
| Manifestation | Expression + `/{format}` |
| Item | No ELI URI (item is a physical instance) |

This mirrors AKN-PT `<meta>/<identification>`. Note the **publication date** is
part of the Work path; a new consolidation creates a new Expression (segment
`p` → date) while keeping the Work.

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

## 14. Open questions (to confirm at the 2026-07-01 INCM meeting)

1. Final domain — **decided (2026-06-22): `data.dre.pt`** (already in production); to be formally confirmed.
2. Consolidated form — confirm the exact consolidated-version segment (assumed `/{YYYY-MM-DD}/dre/pt`).
3. Language code — `pt` (in the URI) vs `por` (`<FRBRlanguage>`). Confirm.
4. Constructibility — the `data.dre.pt` template is constructible from a **complete legistic citation** (which includes "..., de {day} de {month}"). Confirm with INCM a canonical month-name → number table and, optionally, a resolver service (citation→ELI) for the **abbreviated-citation** case — not as a remedy for a scheme flaw.
5. EuroVoc indexing (`eli:is_about`) — proposed v0.2+.
6. Granularity below point (sentence, word) — out of scope today.
7. Transposed EU directives — via the EU ELI (`data.europa.eu/eli/dir/…`) directly.
8. Regional acts (DLR/DRR) — ELI resolution via regional journals (JORAA/JORAM) or data.dre.pt? To be coordinated.

---

## 15. References

- ELI Council Conclusions 2012/C 325/02 and 2017/C 441/05.
- ELI ontology v1.5 (2024), Publications Office EU.
- DRE — European Legislation Identifier (production template, data.dre.pt).
- OASIS Akoma Ntoso 1.0 LegalDocML — §10.
- AKN-PT mapping v0.1.0.
- ADR-0009 (ELI-PT domain — 2026-06-22 revision).

---

## 16. Earlier proposed form (DAPL) — proposed evolution to INCM

Before confirming Portugal already had ELI in production, DAPL designed a
cleaner, EU/France-aligned form:

```
https://eli.gov.pt/eli/{jurisdiction}/{type}/{year}/{number}/{language}[/{point-in-time}][.{format}][#{fragment}]
e.g. https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt
```

Advantages over the production `data.dre.pt` template:

- **Self-sufficient against abbreviated citations:** constructible even from an
  *abbreviated* citation (`Decreto-Lei n.º 22/2026`, lacking "de {day} de
  {month}"), whereas the `data.dre.pt` template requires the full date.
  **Frank note:** the *complete* legistic citation always carries the date
  ("Decreto-Lei n.º 22/2026, de {day} de {month}"), so `data.dre.pt` is equally
  constructible from it; this advantage of `eli.gov.pt` applies only to the
  abbreviated-citation case.
- **Explicit jurisdiction** (`pt-20`/`pt-30`) for regional acts.
- Aesthetic alignment with the EU **year+number** pattern
  (`data.europa.eu/eli/reg/2016/679/oj`).

This form is **not canonical** in v0.2 — it is recorded as a technical input for
the meeting. **Frank assessment:** INCM's form (type/number/date) is **not
wrong** — it is the Portuguese legistic tradition, where an act is cited by its
date; the `eli.gov.pt` (year+number) form is merely an EU-aligned aesthetic
alternative. The AKN-PT validator accepts both (tolerance, cf. `EliPtUriType`);
the converter (`conversion.py`) emits both.
