# AKN-PT Specification — English documents

> **The Portuguese version is authoritative.** This folder contains an
> English **summary**, not a full translation. The complete specification
> (18 chapters) lives at [`../pt/`](../pt/) and is the only authoritative
> source — see [ADR-0006](../../adr/0006-languages-pt-body-en-summary.md).

## What is here

| Document | Audience | Scope |
|---|---|---|
| [`executive-summary.md`](executive-summary.md) | Decision-makers, stakeholders | Why AKN-PT exists, what it covers, governance model. |
| [`technical-overview.md`](technical-overview.md) | Implementers, integrators | Architecture, namespaces, conformance phases, ELI-PT, key design choices. |
| [`implementation-guide.md`](implementation-guide.md) | Developers building on AKN-PT | How to validate, how to author, common patterns, pitfalls. |

## What is NOT here

The 18 chapters of the Portuguese specification — including detailed
mappings per act type, the controlled vocabulary for `<workflow>` steps,
the full Schematron rule catalogue, glossary, examples and changelog —
are not duplicated in English. To consult them:

- Read the [Portuguese spec](../pt/index.md) directly (Portuguese legal
  terminology is largely Latinate and accessible to lawyers familiar with
  EU legislation).
- Or open an issue on GitHub asking for English clarification on a
  specific chapter — we will respond inline and consider promoting the
  answer into one of the three EN documents above.

## When to extend the EN documents

Update the EN summaries when, and only when:

- A milestone (v0.2.0, v0.3.0) lands a significant new capability that
  changes the architecture.
- External reviewers (CIRSFID-Bologna, Hellenic Parliament, AKN4EU) ask
  recurrent questions answered by the PT spec.
- A presentation or outreach event surfaces a documentation gap.

Routine clarifications belong in the **PT spec** first, and may or may
not propagate to EN.

## Outreach

If you are referencing AKN-PT from outside Portugal, please open a
GitHub issue with the `eu-collaboration` label so we can coordinate.
