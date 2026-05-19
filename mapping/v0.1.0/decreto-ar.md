# Mapping — Decreto da Assembleia da República

## Base constitucional e categorias

- **Base:** n.º 5 do art. 166.º CRP; competência da AR para aprovar tratados internacionais e outras matérias específicas.
- **Categorias** (`<FRBRsubtype>`):
  - `decreto-ar-tratado` — aprovação de convenção / tratado internacional.
  - `decreto-ar-mandato` — declarações sobre exercício do mandato presidencial / declarações de guerra / etc.
  - `decreto-ar-outros` — outras matérias atribuídas pela CRP.
- **Autoridade emanante:** Assembleia da República.
- **Promulgação:** Presidente da República (art. 134.º al. b)).
- **Publicação:** DR, 1.ª série.

## Identificação ELI-PT

```
https://eli.gov.pt/decreto-ar/{year}/{number}/pt[/{point-in-time}]
```

## Estrutura típica

Variável conforme objecto. Decreto AR de aprovação de tratado:

```
Decreto AR (tratado)
├── <meta>
├── <preface>
├── <preamble>
│   ├── <recital>+
│   └── <formula type="enacting">
├── <body>
│   ├── <article eId="art_1">  "É aprovada a Convenção..."
│   └── <article eId="art_2">  "A Convenção entra em vigor..."
├── <conclusions>
│   ├── <signature role="signature" as="#presidente-ar">
│   ├── <formula type="promulgation">
│   └── <signature role="promulgation">
└── <attachments>
    └── <attachment eId="anx_1">  Texto integral do tratado (PT + língua original)
```

## Particularidades

- **Articulado curto** (1–3 artigos) em decretos AR de aprovação de tratado; mais longo em outros casos.
- **Anexo é frequentemente o objecto substantivo** (texto do tratado).
- **Promulgação obrigatória.**
- **Sem referenda ministerial.** Apenas o Presidente da AR no final do articulado e o PR na promulgação.

## Mapeamento elemento-a-elemento

| Construto PT | AKN | Notas |
|---|---|---|
| Decreto AR (raiz) | `<act name="decreto-ar">` | |
| Aprovação ("É aprovado/a...") | `<article>` com texto dispositivo | dentro de `<body>` |
| Texto do tratado em anexo | `<attachment>` → `<mainBody>` com estrutura própria | bilingual quando aplicável (PT + língua original) |
| Assinatura PAR | `<signature role="signature" as="#presidente-ar">` | |
| Promulgação | `<signature role="promulgation" as="#presidente-republica">` | |

## Schematron específico de Decreto AR

| Regra | Severity |
|---|---|
| `<act name>` = `decreto-ar` | error |
| `<FRBRauthor>` deve ser `#ar` | error |
| `<conclusions>` deve conter `<signature>` com `as="#presidente-ar"` | error |
| `<conclusions>` deve conter `<signature role="promulgation">` | error |
| Se subtipo = `decreto-ar-tratado`, deve existir `<attachment>` com texto do tratado | warning |
