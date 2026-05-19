# Mapping — Decreto Regulamentar Regional

## Base constitucional e categorias

- **Base:** alínea d) do n.º 1 do art. 227.º CRP; Estatutos Político-Administrativos.
- **Categorias** (`<FRBRsubtype>`):
  - `drr-execucao` — execução de DLR ou lei nacional.
  - `drr-regulamentar` — regulamentação autónoma no âmbito regional.
- **Autoridade emanante:** Governo Regional (Açores ou Madeira).
- **Assinatura:** Presidente do Governo Regional, eventualmente com membros do Governo Regional.
- **Aprovação final:** assinado pelo Representante da República (art. 233.º CRP, com adaptações).
- **Publicação:** DR, 1.ª série (e jornais oficiais regionais).

## Identificação ELI-PT

```
https://eli.gov.pt/drr/{year}/{number}/pt-20[/{point-in-time}]   # Açores
https://eli.gov.pt/drr/{year}/{number}/pt-30[/{point-in-time}]   # Madeira
```

## Estrutura típica

Análoga à Portaria nacional, no plano regional.

```
DRR
├── <meta>
│   └── FRBRcountry = "pt-20" ou "pt-30"
│   └── FRBRauthor = Governo Regional
├── <preface>
├── <preamble>
│   ├── <recital>+           DLR/lei habilitante
│   └── <formula type="enacting">  fórmula regional executiva
├── <body>
│   └── <article>+
├── <conclusions>
│   ├── <signature role="signature" as="#presidente-governo-regional">+
│   └── <signature role="promulgation" as="#representante-republica">
└── <attachments>*
```

## Particularidades

- **`<FRBRcountry>`** vale `pt-20` (Açores) ou `pt-30` (Madeira).
- **Lei/DLR habilitante obrigatória** no preâmbulo.
- **Assinatura do Representante da República** no final, após assinatura do Presidente do Governo Regional.

## Mapeamento elemento-a-elemento

| Construto PT | AKN | Notas |
|---|---|---|
| DRR (raiz) | `<act name="drr">` | |
| Governo Regional (autor) | `<FRBRauthor href="#gov-regional-acores">` ou `#gov-regional-madeira` | |
| Presidente Governo Regional | `<signature role="signature" as="#presidente-governo-regional-acores">` ou `-madeira` | |
| Representante da República | `<signature role="promulgation" as="#representante-republica-acores">` ou `-madeira` | |

## Schematron específico

| Regra | Severity |
|---|---|
| `<act name>` = `drr` | error |
| `<FRBRcountry>` deve ser `pt-20` ou `pt-30` | error |
| `<preamble>` deve conter `<ref>` para DLR ou lei (habilitante) | error |
| `<conclusions>` deve conter `<signature>` com `as="#presidente-governo-regional-..."` | error |
| `<conclusions>` deve conter `<signature role="promulgation">` com `as="#representante-republica-..."` | error |
