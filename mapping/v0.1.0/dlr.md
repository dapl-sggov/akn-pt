# Mapping — Decreto Legislativo Regional (Açores, Madeira)

## Base constitucional e categorias

- **Base:** alínea a) do n.º 1 do art. 227.º e n.º 1 do art. 232.º CRP; Estatutos Político-Administrativos das Regiões Autónomas.
- **Categorias** (`<FRBRsubtype>`):
  - `dlr-ordinario` — DLR no âmbito da competência regional.
  - `dlr-autorizado` — desenvolvimento de bases definidas por lei da AR.
- **Autoridade emanante:** Assembleia Legislativa da Região Autónoma (Açores ou Madeira).
- **Assinatura final:** Representante da República para a Região Autónoma (após assinatura do Presidente da Assembleia Legislativa Regional).
- **Promulgação/assinatura:** Representante da República (art. 233.º CRP).
- **Publicação:** DR, 1.ª série (e jornais oficiais regionais).

## Identificação ELI-PT

```
https://eli.gov.pt/dlr/{year}/{number}/pt-20[/{point-in-time}]   # Açores
https://eli.gov.pt/dlr/{year}/{number}/pt-30[/{point-in-time}]   # Madeira
```

A jurisdição regional vai no segmento `{language}`/`{jurisdiction}` (decisão
herdada de ADR-0009 + práxis ELI). Codificação ISO 3166-2:PT.

## Estrutura típica

Análoga ao DL nacional, com particularidades regionais nas assinaturas.

```
DLR
├── <meta>
│   └── FRBRcountry = "pt-20" ou "pt-30"
├── <preface>
├── <preamble>
│   ├── <recital>+
│   └── <formula type="enacting">  fórmula regional (ver _special-cases.md)
├── <body>
│   └── <article>+
├── <conclusions>
│   ├── <signature role="signature" as="#presidente-ar-regional">  PALR
│   ├── <formula type="promulgation">  "Assinado em Ponta Delgada/Funchal ..."
│   └── <signature role="promulgation" as="#representante-republica">
└── <attachments>*
```

## Particularidades

- **`<FRBRcountry>`** vale `pt-20` (Açores) ou `pt-30` (Madeira).
- **Assinatura do Presidente da Assembleia Legislativa Regional** antes da assinatura do Representante da República.
- **Sem PR a promulgar** — o Representante da República assina.
- **Sem referenda** de membros do Governo nacional.
- **Fórmula promulgatória cita os artigos da CRP e do Estatuto regional aplicável** — ver [_special-cases.md §Fórmulas](_special-cases.md#decreto-legislativo-regional).

## Mapeamento elemento-a-elemento

| Construto PT | AKN | Notas |
|---|---|---|
| DLR (raiz) | `<act name="dlr">` | |
| ALR (autor) | `<FRBRauthor href="#alra">` ou `#alrm` | Açores / Madeira |
| Presidente ALR (assinatura) | `<signature role="signature" as="#presidente-alra">` | |
| Representante da República | `<signature role="promulgation" as="#representante-republica-acores">` ou `-madeira` | |

## Schematron específico

| Regra | Severity |
|---|---|
| `<act name>` = `dlr` | error |
| `<FRBRcountry>` deve ser `pt-20` ou `pt-30` | error |
| `<FRBRauthor>` deve ser `#alra` (Açores) ou `#alrm` (Madeira) | error |
| `<conclusions>` deve conter `<signature>` com `as="#presidente-alra"` ou `as="#presidente-alrm"` | error |
| `<conclusions>` deve conter `<signature role="promulgation">` com `as="#representante-republica-acores"` ou `-madeira` | error |
| `<conclusions>` NÃO deve conter `<signature>` com `as="#presidente-republica"` | error |
