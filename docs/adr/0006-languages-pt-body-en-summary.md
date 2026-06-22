# ADR-0006 — Línguas: PT body, EN summary

- **Estado:** Accepted
- **Data:** 2026-05-19

## Contexto

O AKN-PT é nacional mas vive numa comunidade internacional (OASIS
LegalDocML, AKN4EU, parlamentos europeus). A documentação precisa de:

- Ser **utilizável por drafters PT** (juristas, técnicos legísticos) — exige
  PT-PT idiomático.
- Ser **revisível por especialistas internacionais** (Palmirani, Fitsilis,
  AKN4EU team) — exige EN técnico.

Modelos avaliados:

1. **PT only** — exclui revisores internacionais.
2. **EN only** — exclui utilizadores nacionais; perde nuance jurídica PT.
3. **Bilingue completo** — ideal mas duplica esforço de manutenção.
4. **PT body + EN summary** — corpo da spec em PT (autoridade), sumário
   executivo + technical overview + implementation guide em EN.

## Decisão

**Opção 4 — PT body + EN summary.**

| Componente | Língua |
|---|---|
| `docs/spec/pt/` (18 capítulos) | PT (autoridade) |
| `docs/spec/en/executive-summary.md` | EN |
| `docs/spec/en/technical-overview.md` | EN |
| `docs/spec/en/implementation-guide.md` | EN |
| `docs/adr/` | PT |
| `mapping/` | PT |
| README do projecto | PT (cabeçalho) com tradução EN no final |
| Validador (CLI messages) | i18n PT/EN via `--lang` |
| Editor (UI) | PT |

EN é **summary only** — não é uma tradução completa.

## Consequências

**Positivas:**

- Drafters PT têm spec completa na sua língua.
- Revisores internacionais têm material suficiente para feedback
  arquitectónico sem precisar de tradução completa.
- Esforço de manutenção concentrado no PT; EN actualiza apenas em milestones.

**Negativas:**

- Reviewers EN podem precisar de translation back para verificar pontos
  específicos.
- Risco de drift entre PT e EN — mitigado por restrição clara: EN documenta
  conceitos e exemplos, não regras detalhadas.

**Mitigação:** Cabeçalho explícito em cada documento EN indicando que o PT
é autoritativo. Hyperlink directo aos capítulos PT relevantes.
