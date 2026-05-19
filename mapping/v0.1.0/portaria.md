# Mapping — Portaria (v0.1.0)

> Supersede v0.0.1. Open questions Q1.6–Q1.8 resolvidas — ver [decisions-log](../../decisions-log.md).

## Base legal e categorias

- **Base:** ato regulamentar emanado por ministro(s); lei habilitante específica em cada caso (princípio da legalidade).
- **Categorias** (`<FRBRsubtype>`):
  - `portaria-regulamentar` — regulamento de execução de lei/DL.
  - `portaria-execucao` — mera execução (e.g. aprovação de modelo, tabela).
  - `portaria-extensao` — extensão de convenção coletiva (Direito do Trabalho).
- **Autoridade emanante:** Ministro(s) competente(s); ocasionalmente PM.
- **Promulgação:** não há.
- **Publicação:** Diário da República, 1.ª série (regra geral); 2.ª série em casos previstos.

## Identificação ELI-PT

```
https://eli.gov.pt/portaria/{year}/{number}/pt[/{point-in-time}]
```

## Estrutura típica

```
Portaria
├── <meta>
├── <preface>
├── <preamble>
│   ├── <recital>+           lei habilitante + breve fundamentação
│   └── <formula type="enacting">  "Manda o Governo, pelo Ministro de X, ..."
├── <body>
│   └── <article>+           tipicamente 3–10 artigos
├── <conclusions>
│   └── <signature role="signature">+  ministro(s)
└── <attachments>*           muito frequente (modelos, tabelas)
```

## Particularidades

- **Articulado curto.** Média 3–10 artigos.
- **Sem promulgação.**
- **Estrutura idêntica ao DL** no articulado; diferença está no cabeçalho, fórmula e conclusões.
- **Portarias conjuntas** — múltiplos `<FRBRauthor>` no Work (decisão Q1.6) e múltiplas `<signature role="signature">` no `<conclusions>`.
- **Modelos de impressos** — estruturados em `<blockList>` ou `<table>` (decisão Q1.7); facsimile só quando inevitável.
- **Subtipo distingue regulamentar de execução** (decisão Q1.8); não afecta estrutura.

## Mapeamento elemento-a-elemento

| Construto PT | AKN | Notas |
|---|---|---|
| Portaria (raiz) | `<act name="portaria">` | |
| Lei habilitante (preâmbulo) | `<ref href="ELI-URI">` dentro de `<recital>` | obrigatório (princípio da legalidade) |
| Fórmula "Manda o Governo…" | `<formula type="enacting">` | catálogo em [_special-cases.md §Fórmulas](_special-cases.md#fórmulas--catálogo-de-variantes) |
| Assinatura ministerial | `<signature role="signature">` | múltiplas em portarias conjuntas |
| Modelo de impresso (anexo) | `<attachment>` → `<mainBody>` → `<blockList>` ou `<table>` | preferível a facsimile |

## Schematron específico de Portaria

| Regra | Severity |
|---|---|
| `<act name>` = `portaria` | error |
| `<FRBRsubtype>` ∈ {regulamentar, execucao, extensao} | error |
| `<preamble>` deve conter pelo menos uma `<ref>` para uma lei ou DL (base habilitante) | error |
| `<conclusions>` NÃO deve conter `<signature role="promulgation">` | error |
| `<conclusions>` deve conter ≥1 `<signature role="signature">` (ministerial) | error |
| Fórmula promulgatória deve conter "Manda o Governo, pelo[s] Ministro[s]" | warning |
