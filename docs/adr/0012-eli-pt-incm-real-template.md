# ADR-0012 — Adotar o template ELI real e em produção da INCM

- **Estado:** Accepted
- **Data:** 2026-06-22
- **Relacionada:** revê e concretiza a [ADR-0009](0009-eli-pt-domain-placeholder.md).

## Contexto

A ADR-0009 fixara `eli.gov.pt` como **placeholder** e uma forma proposta pela
DAPL (`/eli/{jur}/{tipo}/{ano}/{nº}/pt`, ano+número, jurisdição-first). A
pesquisa de suporte à reunião INCM (2026-06-22) e a **verificação empírica**
(resolução 301→200 + RDFa em 14 tipos de ato, 1991→2022) estabeleceram que:

1. **Portugal é implementador ELI maduro**, operado pela INCM em `data.dre.pt`,
   com os quatro Pilares ativos (pioneiro europeu do Pilar IV). A premissa de
   "regressão" era falsa.
2. O **template real** difere do nosso em quatro eixos: slugs próprios da INCM
   (não os que inventámos), Work termina em `/{p|a|m}/dre`, consolidadas em
   `/{ano}/{p|a|m}/cons/{AAAAMMDD}`, sufixo do número em minúsculas.
3. A **citação legística completa** (com "de {dia} de {mês}") torna o template
   da INCM construível — a "construtibilidade" não é argumento contra ele.

## Decisão

**O ELI-PT canónico é o template real de produção da INCM (`data.dre.pt`).**
A forma proposta `eli.gov.pt` é rebaixada a contributo/evolução a propor.

Template (ver fonte única [`eli-pt/incm-eli-reference.md`](../../eli-pt/incm-eli-reference.md)):

```
Ato publicado: data.dre.pt/eli/{slug}/{nº}/{ano}/{mês}/{dia}/{p|a|m}/dre[/{lang}[/{fmt}]]
Consolidado:   data.dre.pt/eli/{slug}/{nº}/{ano}/{p|a|m}/cons/{AAAAMMDD}[/{lang}[/{fmt}]]
Diário:        data.dre.pt/eli/diario/{série}/{nº}/{ano}/{supl}/{lang}/{fmt}
```

- **Slugs reais da INCM** (44 tipos na referência). Mapa do escopo: `dec-lei`,
  `lei` (iguais); `portaria→port`, `res-cm→resolconsmin`, `res-ar→resolassrep`,
  `despacho-normativo→despnorm`, `dlr→declegreg`, `drr→decregulreg`,
  `decreto-ar→dec`. O `<act name>` AKN-PT mantém o nome legível; o slug entra só no URI.
- **Território** `p` (nacional) / `a` (Açores, `FRBRcountry` pt-20) / `m` (Madeira, pt-30).
- **Relações:** habilitante → `eli:based_on`; transposição → `eli:transposes`.
- **Língua:** `pt` no path; `PRT` na autoridade de metadados; `por` no `<FRBRlanguage>` AKN.

## Consequências

- `EliPtUriType` (XSD) aceita a forma canónica INCM + a proposta (tolerância);
  Schematron `FRBR-0001` aceita o `act/@name` ou o slug INCM.
- Editor, conversor e corpus (8 diplomas reais verificados) emitem/usam a forma real.
- A forma proposta fica documentada como evolução (§16 da spec) — argumentos:
  jurisdição explícita no URI e alinhamento estético UE; **não** construtibilidade.

## A confirmar na reunião INCM (2026-07-01)

`decreto-ar→dec`; data da citação = data do path; consolidadas/língua; lacuna
pré-1991 (1.ª série); cobertura da 2.ª série; mapeamento AKN-PT ↔ XML interno da INCM.
