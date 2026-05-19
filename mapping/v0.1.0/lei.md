# Mapping — Lei (Assembleia da República)

## Base constitucional e categorias

- **Base:** artigos 161.º, alíneas c) e seguintes, e 164.º (reserva absoluta) da CRP.
- **Categorias** (`<FRBRsubtype>`):
  - `lei-comum` — competência da alínea c) do artigo 161.º.
  - `lei-organica` — n.º 2 do artigo 166.º; matérias de reserva qualificada.
  - `lei-de-bases` — quando declarada como tal.
  - `lei-autorizacao` — autorização legislativa ao Governo (al. d) do art. 161.º).
  - `lei-de-revisao` — Lei de Revisão Constitucional.
- **Autoridade emanante:** Assembleia da República.
- **Promulgação:** Presidente da República (al. b) do art. 134.º).
- **Referenda:** PM, nos termos do art. 140.º.
- **Publicação:** Diário da República, 1.ª série.

## Identificação ELI-PT

```
https://eli.gov.pt/lei/{year}/{number}/pt[/{point-in-time}]
```

Lei orgânica: o tipo na URI é `lei`, distingue-se pelo `<FRBRsubtype>`.

## Estrutura típica

Igual ao Decreto-Lei (preâmbulo curto + articulado + conclusões). A diferença
estrutural está nas conclusões (assinatura do Presidente da AR antes da
promulgação) e na fórmula promulgatória.

```
Lei
├── <meta>
├── <preface>
├── <preamble>
│   ├── <recital>*           (frequentemente vazio ou curto)
│   └── <formula type="enacting">
├── <body>
│   └── <article>+
├── <conclusions>
│   ├── <formula>            "Aprovada em DD de MMM de YYYY."
│   ├── <signature role="signature">  Presidente da AR
│   ├── <formula type="promulgation">  "Promulgada em ..."
│   ├── <signature role="promulgation">  PR
│   ├── <formula>            "Referendada em ..."
│   └── <signature role="countersignature">  PM
└── <attachments>*
```

## Particularidades

- **Preâmbulo curto.** Leis da AR têm frequentemente preâmbulo mínimo — a
  exposição de motivos está no documento parlamentar prévio (proposta de lei /
  projecto de lei), não na lei publicada.
- **Assinatura do Presidente da AR.** Surge no `<conclusions>` antes da
  promulgação. Marcada com `<signature role="signature">` e `as="#presidente-ar"`.
- **Promulgação obrigatória.**
- **Referenda só pelo PM** (não pelos ministros) — art. 140.º CRP.
- **Fórmula promulgatória:** "A Assembleia da República decreta, nos termos da alínea c) do artigo 161.º da Constituição, o seguinte:"

## Mapeamento elemento-a-elemento

| Construto PT | AKN | Notas |
|---|---|---|
| Lei (raiz) | `<act name="lei">` | |
| Presidente da AR (assinatura) | `<signature role="signature"><person as="#presidente-ar"/></signature>` | dentro de `<conclusions>` |
| Referenda PM | `<signature role="countersignature"><person as="#primeiro-ministro"/></signature>` | única |
| Demais | ver [`_common-patterns.md`](_common-patterns.md) | |

## Schematron específico de Lei

| Regra | Severity |
|---|---|
| `<act name>` = `lei` | error |
| `<FRBRauthor>` deve ser `#ar` (Assembleia da República) | error |
| `<conclusions>` deve conter `<signature>` com `as="#presidente-ar"` | error |
| `<conclusions>` deve conter `<signature role="promulgation">` com `as="#presidente-republica"` | error |
| `<conclusions>` deve conter exactamente UMA `<signature role="countersignature">` (PM) — não múltiplas | error |
| Se `<FRBRsubtype>` = `lei-organica`, validar invariantes específicas da LO | warning |
