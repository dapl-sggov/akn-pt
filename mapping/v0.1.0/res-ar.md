# Mapping — Resolução da Assembleia da República

## Base constitucional e categorias

- **Base:** n.º 5 do art. 166.º CRP; matérias da competência política e legislativa da AR.
- **Categorias** (`<FRBRsubtype>`):
  - `res-ar-recomendacao` — recomendação ao Governo.
  - `res-ar-aprovacao` — aprovação de documento (regimento, programa).
  - `res-ar-politica` — declarações, votos, posições.
  - `res-ar-cessacao-vigencia` — cessação de vigência de DL autorizado (art. 169.º CRP).
- **Autoridade emanante:** Assembleia da República.
- **Promulgação:** não há (publicação directa).
- **Assinatura:** Presidente da AR.
- **Publicação:** DR, 1.ª série.

## Identificação ELI-PT

```
https://eli.gov.pt/res-ar/{year}/{number}/pt[/{point-in-time}]
```

## Estrutura típica

Análoga à RCM — pontos resolutivos, não articulado.

```
Resolução AR
├── <meta>
├── <preface>
├── <preamble>
│   └── <recital>*
├── <body>
│   └── <paragraph>+         pontos resolutivos numerados
├── <conclusions>
│   └── <signature role="signature">  Presidente da AR
└── <attachments>*
```

## Particularidades

- **Estrutura tipo RCM** — sem `<article>`, com `<paragraph eId="para_N">` em `<body>`.
- **Sem promulgação.**
- **Assinatura única do PAR.**
- **Resolução de cessação de vigência** (art. 169.º) tem efeito sobre DL autorizado — relaciona-se via `<analysis>/<passiveModifications>` no DL alvo (v0.2+).

## Mapeamento elemento-a-elemento

| Construto PT | AKN | Notas |
|---|---|---|
| Resolução AR (raiz) | `<act name="res-ar">` | |
| Resolutivo numerado | `<paragraph eId="para_N">` com `<num>N -</num>` | sem `<article>` |
| Assinatura PAR | `<signature role="signature" as="#presidente-ar">` | único |

## Schematron específico

| Regra | Severity |
|---|---|
| `<act name>` = `res-ar` | error |
| `<body>` NÃO deve conter `<article>` | error |
| `<FRBRauthor>` deve ser `#ar` | error |
| `<conclusions>` deve conter apenas UMA `<signature>` (PAR) | error |
| `<conclusions>` NÃO deve conter `<signature role="promulgation">` | error |
| Se subtipo = `res-ar-cessacao-vigencia`, preâmbulo deve conter `<ref>` para o DL alvo | error |
