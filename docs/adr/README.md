# Architecture Decision Records (ADRs)

Decisões arquitectónicas do AKN-PT. Formato adaptado de
[Michael Nygard, 2011](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).

Cada ADR contém: **Contexto** (o problema e alternativas), **Decisão**
(o que ficou), **Consequências** (positivas, negativas, mitigações).

## Índice v0.1.0

| # | Decisão | Estado |
|---|---|---|
| [0000](0000-agenda-decisoes-conjuntas.md) | Agenda de decisões conjuntas SGGov–INCM (meta-ADR: índice sequenciado das 22 decisões) | Accepted |
| [0001](0001-project-governance.md) | Modelo de governação híbrido (DAPL → Comissão) | Accepted |
| [0002](0002-license-eupl.md) | Licença EUPL-1.2 | Accepted |
| [0003](0003-repository-monorepo.md) | Monorepo único no GitHub | Accepted |
| [0004](0004-conformance-phases.md) | 3 fases de conformidade (drafting/review/publication) | Accepted |
| [0005](0005-namespace-oasis-csd17.md) | Namespace OASIS CSD17 + perfil via `<FRBRformat>` | Accepted |
| [0006](0006-languages-pt-body-en-summary.md) | PT corpo, EN sumário | Accepted |
| [0007](0007-scope-9-types-v0.1.0.md) | Scope v0.1.0 — 9 tipos de actos | Accepted |
| [0008](0008-validator-stack-python-lxml.md) | Validador em Python 3.12+ com lxml | Accepted |
| [0009](0009-eli-pt-domain-placeholder.md) | Domínio ELI-PT placeholder até INCM | Accepted (superada → [0012](0012-eli-pt-incm-real-template.md)) |
| [0010](0010-external-review-milestone.md) | Revisão externa milestone-based | Accepted |
| [0011](0011-namespace-pt-extensions.md) | Namespace para extensões AKN-PT (`akn-pt:`) | Accepted |
| [0012](0012-eli-pt-incm-real-template.md) | ELI-PT = template real e em produção da INCM (`data.dre.pt`) | Accepted |

## Ciclo de vida

- **Proposed** — registada, sem validação institucional.
- **Accepted** — aprovada pela DAPL/SGGOV (autoridade normativa actual do perfil,
  [ADR-0001](0001-project-governance.md)); ratificação pela Comissão Técnica
  AKN-PT quando constituída.
- **Deprecated** — substituída por uma ADR posterior (com link).
- **Rejected** — explorada, descartada.

## Quando criar uma nova ADR

Sempre que uma decisão:

1. Tenha alternativas reais consideradas e descartadas.
2. Seja difícil de reverter mais tarde sem custo significativo.
3. Afecte mais que um componente (spec, schema, validador, editor).
4. Crie dependência externa (institucional ou técnica).

Decisões operacionais e fixes pontuais ficam em `decisions-log.md`, não
geram ADR.

## Numeração

Sequencial, sem reuso. ADR descartada continua a existir como ficheiro com
estado `Rejected` e link para a sua substituta.
