# ELI-PT v0.1.0

European Legislation Identifier — Portuguese profile.

## Estrutura desta pasta

- [`specification-pt.md`](specification-pt.md) — Especificação ELI-PT (versão PT autoritativa).
- [`specification-en.md`](specification-en.md) — Specification (English, bilingual delivery per ADR-0006 e decisão Q1.14).
- [`uri-templates.md`](uri-templates.md) — Templates URI por tipo de ato (tabela única, formato de referência).
- [`permanence-policy.md`](permanence-policy.md) — Política de permanência e versionamento de URIs.
- [`conversion.py`](conversion.py) — Conversor bidirecional `dre.pt` URL ↔ ELI-PT URI.
- [`tests/`](tests/) — Testes do conversor com amostras reais.
- [`meeting-incm-2026-07-01.md`](meeting-incm-2026-07-01.md) — **Kit de reunião INCM** (agenda, perguntas, pontos de decisão).
- [`research/`](research/) — Pesquisa de suporte:
  - [`eli-international-dossier.md`](research/eli-international-dossier.md) — Dossier de conhecimento ELI (standard, ontologia, implementações, estado PT).
  - [`eli-pt-gap-analysis.md`](research/eli-pt-gap-analysis.md) — Análise de lacunas da proposta v0.1.0 vs prática internacional.

## Estado

**v0.1.0 (proposal)** — desenvolvido na pendência de coordenação INCM (ADR-0009).
Domínio `eli.gov.pt` é placeholder. Recomendação substantiva à INCM é
`https://data.dre.pt/eli/...`.

> ⚠ **Achado da pesquisa de 2026-06-22:** Portugal **já é implementador ELI
> registado** desde 2016/2017 (operado pela INCM em `data.dre.pt`), mas terá
> **regredido** na migração do portal para OutSystems (URIs `/eli/` partidos,
> sem RDFa). O template em produção da INCM usa **data completa**
> (`dec-lei/83/2016/12/16/…`), divergindo da nossa proposta de ano+número.
> Ver o [dossier](research/eli-international-dossier.md) e a
> [análise de lacunas](research/eli-pt-gap-analysis.md).
