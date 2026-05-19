# Mapping — Despacho normativo

## Base legal e categorias

- **Base:** ato administrativo de natureza regulamentar emanado por membro do Governo, ao abrigo de lei habilitante.
- **Categorias** (`<FRBRsubtype>`):
  - `despacho-normativo` — regula matéria com natureza normativa.
  - `despacho-conjunto` — assinado por dois ou mais ministros.
- **Autoridade emanante:** Ministro(s).
- **Promulgação:** não há.
- **Publicação:** DR, 2.ª série (regra) ou 1.ª série (quando lei o exija).

> Despacho simples (não normativo, e.g. nomeação) não está no escopo do AKN-PT
> v0.1.0 — vai-se cobrir como subtipo administrativo na v0.2+ se justificar.

## Identificação ELI-PT

```
https://eli.gov.pt/despacho/{year}/{number}/pt[/{point-in-time}]
```

A numeração de despachos é frequentemente sequencial intra-série (e.g.
"Despacho normativo n.º 12/2026"). O número é o que aparece em DR.

## Estrutura típica

Análoga à Portaria — preâmbulo curto + articulado + assinatura.

```
Despacho normativo
├── <meta>
├── <preface>
├── <preamble>
│   ├── <recital>+           lei habilitante + breve fundamentação
│   └── <formula type="enacting">  "Manda o Governo, pelo Ministro de X, ..."
├── <body>
│   └── <article>+           tipicamente curto (1–8 artigos)
├── <conclusions>
│   └── <signature role="signature">+  ministro(s)
└── <attachments>*
```

## Particularidades

- **Articulado curto.**
- **Lei habilitante obrigatória no preâmbulo** (princípio da legalidade).
- **Sem promulgação.**
- **Despacho conjunto** marca-se com múltiplos `<FRBRauthor>` e múltiplas `<signature>`.

## Mapeamento elemento-a-elemento

| Construto PT | AKN | Notas |
|---|---|---|
| Despacho normativo (raiz) | `<act name="despacho-normativo">` | |
| Lei habilitante | `<ref href="ELI-URI">` em `<recital>` | obrigatório |
| Assinatura ministerial | `<signature role="signature">` | múltipla em conjunto |

## Schematron específico

| Regra | Severity |
|---|---|
| `<act name>` = `despacho-normativo` | error |
| `<preamble>` deve conter `<ref>` para lei ou DL (habilitante) | error |
| `<conclusions>` NÃO deve conter `<signature role="promulgation">` | error |
| `<conclusions>` deve conter ≥1 `<signature role="signature">` | error |
