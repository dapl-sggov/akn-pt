# ELI-PT v0.2

European Legislation Identifier — Portuguese profile.

> **Canónico = `data.dre.pt`** (template de produção da INCM). Exemplo:
> `https://data.dre.pt/eli/dec-lei/83/2016/12/16/p/dre/pt/html`.

## Estrutura desta pasta

- [`specification-pt.md`](specification-pt.md) — Especificação ELI-PT (versão PT autoritativa).
- [`specification-en.md`](specification-en.md) — Specification (English, bilingual delivery per ADR-0006 e decisão Q1.14).
- [`uri-templates.md`](uri-templates.md) — Templates URI por tipo de ato (tabela única, formato de referência).
- [`permanence-policy.md`](permanence-policy.md) — Política de permanência e versionamento de URIs.
- [`conversion.py`](conversion.py) — Conversor de identificadores (`dre.pt` URL ↔ ELI-PT, forma canónica e proposta).
- [`tests/`](tests/) — Testes do conversor com amostras reais.
- [`meeting-incm-2026-07-01.md`](meeting-incm-2026-07-01.md) — **Kit de reunião INCM** (agenda, perguntas, pontos de decisão).
- [`research/`](research/) — Pesquisa de suporte:
  - [`eli-international-dossier.md`](research/eli-international-dossier.md) — Dossier de conhecimento ELI (standard, ontologia, implementações, estado PT).
  - [`eli-pt-gap-analysis.md`](research/eli-pt-gap-analysis.md) — Análise de lacunas da proposta v0.1.0 vs prática internacional.

## Estado

**v0.2 (2026-06-22)** — alinhado com o **template de produção da INCM**. Por
decisão da DAPL, o ELI-PT canónico passou a ser o `data.dre.pt` que Portugal já
tem implementado (ADR-0009, revisão 2026-06-22). A forma anterior da DAPL
(`eli.gov.pt`, ano+número) mantém-se documentada como **evolução a propor**
(ver §16 da especificação) — é **auto-suficiente** (construível a partir de uma
citação), ao contrário do template `data.dre.pt`, que exige a data de publicação.

> ⚠ **Achado da pesquisa de 2026-06-22:** Portugal **já é implementador ELI
> registado** desde 2016/2017 (operado pela INCM em `data.dre.pt`), mas terá
> **regredido** na migração do portal para OutSystems (URIs `/eli/` partidos,
> sem RDFa). Confirmação final (domínio, tipos, consolidadas, língua) na reunião
> INCM de **2026-07-01**. Ver o [dossier](research/eli-international-dossier.md)
> e a [análise de lacunas](research/eli-pt-gap-analysis.md).
