# ELI-PT URI templates — tabela de referência

Templates URI por tipo de ato no escopo da v0.1.0.

Convenções:
- `{domain}` substitui-se por `eli.gov.pt` (placeholder) ou pela forma final acordada com INCM (recomendada: `data.dre.pt`).
- Parêntesis rectos `[ ]` marcam segmentos opcionais.
- `{point-in-time}` é uma data ISO 8601 (`YYYY-MM-DD`).

## Tipos nacionais

| Tipo | Template Work | Exemplo |
|---|---|---|
| Decreto-Lei | `{domain}/eli/pt/dec-lei/{year}/{number}/pt` | `https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt` |
| Lei (AR) | `{domain}/eli/pt/lei/{year}/{number}/pt` | `https://eli.gov.pt/eli/pt/lei/2026/12/pt` |
| Decreto da AR | `{domain}/eli/pt/decreto-ar/{year}/{number}/pt` | `https://eli.gov.pt/eli/pt/decreto-ar/2026/5/pt` |
| Resolução da AR | `{domain}/eli/pt/res-ar/{year}/{number}/pt` | `https://eli.gov.pt/eli/pt/res-ar/2026/87/pt` |
| Portaria | `{domain}/eli/pt/portaria/{year}/{number}/pt` | `https://eli.gov.pt/eli/pt/portaria/2026/87/pt` |
| Resolução do CM | `{domain}/eli/pt/res-cm/{year}/{number}/pt` | `https://eli.gov.pt/eli/pt/res-cm/2026/45/pt` |
| Despacho normativo | `{domain}/eli/pt/despacho-normativo/{year}/{number}/pt` | `https://eli.gov.pt/eli/pt/despacho-normativo/2026/12/pt` |

## Tipos regionais

| Tipo | Template Work | Exemplo |
|---|---|---|
| DLR Açores | `{domain}/eli/pt-20/dlr/{year}/{number}/pt` | `https://eli.gov.pt/eli/pt-20/dlr/2026/3/pt` |
| DLR Madeira | `{domain}/eli/pt-30/dlr/{year}/{number}/pt` | `https://eli.gov.pt/eli/pt-30/dlr/2026/4/pt` |
| DRR Açores | `{domain}/eli/pt-20/drr/{year}/{number}/pt` | `https://eli.gov.pt/eli/pt-20/drr/2026/2/pt` |
| DRR Madeira | `{domain}/eli/pt-30/drr/{year}/{number}/pt` | `https://eli.gov.pt/eli/pt-30/drr/2026/1/pt` |

## Expression (versão consolidada)

Acrescenta-se `/{point-in-time}` ao Work:

```
https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt/2027-01-15
```

## Manifestation (formato concreto)

Acrescenta-se `.{format}` ao Expression:

| Formato | Sufixo |
|---|---|
| AKN-PT XML | `.xml` |
| HTML legível | `.html` |
| JSON | `.json` |
| PDF facsimile | `.pdf` |

Exemplo:
```
https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt/2027-01-15.xml
```

## Fragmento interno

Acrescenta-se `#{eId}` em qualquer dos níveis acima:

```
https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt#art_5__para_1__lit_a
https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt/2027-01-15.xml#art_5__para_1__lit_a
```

## Mapeamentos `dre.pt` legacy ↔ ELI-PT

A INCM disponibiliza hoje URLs com a forma:

```
https://dre.pt/dre/detalhe/{type-slug}/{number}-{year}-{hash}
```

O conversor de referência (`conversion.py`) implementa a transformação:

| dre.pt legacy | ELI-PT |
|---|---|
| `https://dre.pt/dre/detalhe/decreto-lei/22-2026-100000000` | `https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt` |
| `https://dre.pt/dre/detalhe/lei/12-2026-200000000` | `https://eli.gov.pt/eli/pt/lei/2026/12/pt` |
| `https://dre.pt/dre/detalhe/portaria/87-2026-300000000` | `https://eli.gov.pt/eli/pt/portaria/2026/87/pt` |

O `{hash}` legado é descartado na conversão; é reconstruído por consulta
inversa quando necessário (a INCM mantém a tabela de equivalência canónica).
