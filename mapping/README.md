# Mapping — PT act typology to Akoma Ntoso (v0.1.0)

Catálogo do mapeamento estrutural entre cada tipo de ato normativo português
no escopo da v0.1.0 e os elementos Akoma Ntoso 1.0 (OASIS LegalDocML).
É a fundação conceitual dos artefactos 2 (XSD), 3 (Schematron) e 1 (spec).

## Versão

**v0.1.0** — supersede o draft `mapping/v0.0.1/`. Todas as open questions desse
draft foram resolvidas e registadas em [`../decisions-log.md`](../decisions-log.md).

## Convenções

- Termos PT em português; elementos AKN com o seu nome canónico inglês — NÃO
  traduzir (quebraria tooling).
- Exemplos usam ELI-PT placeholder `https://eli.gov.pt/...` (ADR-0009).
- eIds em snake_case com `__` separador (`art_5__para_1__lit_a`).
- Cada ficha de tipo segue a mesma estrutura: base legal · ELI-PT · estrutura
  típica · mapeamento elemento-a-elemento · particularidades · exemplo.

## Ficheiros transversais

- [`_metadata.md`](_metadata.md) — bloco `<meta>` canónico (FRBR triple,
  `<references>`, `<lifecycle>`, `<analysis>`).
- [`_common-patterns.md`](_common-patterns.md) — preface, preamble, formula,
  signatures, references — padrões iguais entre tipos.
- [`_special-cases.md`](_special-cases.md) — Artigo X.º-A, republicação técnica,
  alteração, retificação, vacatio legis, fórmulas catalogadas.
- [`_legislative-footprint.md`](_legislative-footprint.md) — pegada legislativa
  (Lei n.º 5-A/2026): `<workflow>`, `<step>`, `<input>`, vocabulário controlado e obrigatoriedade.

## Tipos cobertos (v0.1.0)

### Cobertura completa (mapping + corpus)

- [`decreto-lei.md`](decreto-lei.md) — Decreto-Lei (ordinário, autorizado, parlamentar, transposição)
- [`lei.md`](lei.md) — Lei (AR)
- [`portaria.md`](portaria.md) — Portaria
- [`res-cm.md`](res-cm.md) — Resolução do Conselho de Ministros

### Cobertura skeleton (mapping + XSD, sem corpus)

- [`decreto-ar.md`](decreto-ar.md) — Decreto da Assembleia da República
- [`res-ar.md`](res-ar.md) — Resolução da Assembleia da República
- [`despacho-normativo.md`](despacho-normativo.md) — Despacho normativo
- [`dlr.md`](dlr.md) — Decreto Legislativo Regional (Açores, Madeira)
- [`decreto-regulamentar-regional.md`](decreto-regulamentar-regional.md) — Decreto Regulamentar Regional

## Excluído (per ADR-0007)

Jurisprudência, atos administrativos, atos pré-1976, atos orçamentais,
comunicações ao TC, avisos BdP/CMVM. Não estão neste catálogo nem no XSD.
