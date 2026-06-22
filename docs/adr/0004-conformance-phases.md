# ADR-0004 — Conformidade em 3 fases (drafting / review / publication)

- **Estado:** Accepted
- **Data:** 2026-05-19

## Contexto

Validar AKN-PT é mais complexo do que validar contra um único schema. Um
diploma em rascunho não tem ainda data de publicação, signatários, ou pegada
legislativa completa — mas isso não deve impedir a marcação parcial e
validação progressiva.

Modelos avaliados:

1. **Validação única, tudo-ou-nada** — simples, mas rejeita rascunhos.
2. **Camadas opcionais por flag** — pragmático, mas sem hierarquia clara.
3. **Fases nomeadas com Schematron `<phase>`** — modelo OASIS canónico,
   permite que o mesmo conjunto de regras se active por fase.

## Decisão

Três fases formais, definidas em `schema/schematron/akn-pt-rules.sch` via
`<phase id="...">`:

| Fase | Activa quando | Regras |
|---|---|---|
| **drafting** | Em redacção; ainda não submetido | Apenas estrutura, eIds únicos, FRBR mínimo. Permite campos vazios. |
| **review** | Submetido para parecer técnico/jurídico | Acresce: signatários por tipo de acto, fórmula promulgatória do catálogo, refs internas com alvo válido. |
| **publication** | Pronto para enviar a DRE | Acresce: data de publicação, pegada legislativa (se ≥ 2026-07-27), ELI-PT bem formado, lifecycle events. |

CLI: `akn-pt validate doc.akn.xml --phase publication` (default).

## Consequências

**Positivas:**

- Drafters não recebem erros sobre coisas que vão preencher depois.
- Pipeline editorial pode escolher a fase apropriada ao seu momento.
- Schematron `<phase>` é mecanismo padrão — ferramentas externas (Saxon,
  oNVDL) suportam-no nativamente.

**Negativas:**

- Utilizadores podem ficar confusos sobre qual fase usar — mitigado por
  default explícito (`publication`) e mensagem na ajuda do CLI.
- Mais ramos de teste — 43 casos no `schema/tests/` cobrem positives e
  negatives por fase.

## Notas para revisão externa

Pergunta para Palmirani: o uso de `<phase>` Schematron como conformance
levels é padrão na comunidade AKN, ou estamos a inventar?
