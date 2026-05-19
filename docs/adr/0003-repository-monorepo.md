# ADR-0003 — Monorepo no GitHub

- **Estado:** Proposed
- **Data:** 2026-05-19

## Contexto

Os artefactos do AKN-PT são heterogéneos: especificação (Markdown + PDFs),
schemas (XSD + Schematron), mapping (Markdown), corpus (XML), validador
(Python), editor (HTML/JS). Cada um podia viver num repositório próprio.

Alternativas avaliadas:

1. **Multi-repo** — um repositório por componente. Vantagem: ciclos de vida
   independentes. Desvantagem: schemas e validador têm de manter cópias
   sincronizadas; releases atómicas tornam-se difíceis.
2. **Monorepo único** — tudo num só repositório, com pastas dedicadas.
   Vantagem: PR único pode cobrir mudança transversal (e.g. novo padrão
   Schematron + caso de teste no corpus + check no validador).
3. **Monorepo + submódulos** — corpus e validador como submódulos. Vantagem
   marginal sobre 2; desvantagem: complexidade operacional não trivial.

## Decisão

**Monorepo único no GitHub**, em `dapl-sggov/akn-pt`. Estrutura:

```
docs/        spec + ADRs
schema/      XSD + Schematron + testes
eli-pt/      perfil URI
mapping/     fichas de mapeamento por tipo
corpus/      diplomas marcados (10+ ficheiros)
validator/   CLI Python + lib + Docker
editor/      SPA HTML/JS sem servidor
tools/       scripts utilitários
release/     PDFs e artefactos de release
```

## Consequências

**Positivas:**

- PR único cobre mudança transversal (spec ↔ schema ↔ validador ↔ corpus).
- CI único valida tudo de uma vez.
- Releases atómicas — `v0.1.0` cobre todos os componentes.
- Issue tracker único.

**Negativas:**

- Repositório cresce com PDFs e XMLs do corpus (mitigado com Git LFS se
  necessário no futuro).
- Permissions granulares por pasta exigem GitHub teams + CODEOWNERS, não
  permissões nativas.

**Mitigação:** Releases por componente (`validator-0.2.0`) usam tags
prefixadas se for necessário ciclo de vida desacoplado mais tarde.
