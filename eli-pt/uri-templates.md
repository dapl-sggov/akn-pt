# ELI-PT URI templates — tabela de referência

> **v0.2 (2026-06-22):** o template **canónico** é o de produção da INCM
> (`data.dre.pt`), confirmado contra a fonte oficial. A forma anterior da DAPL
> (`eli.gov.pt`, ano+número) é mantida só como **evolução a propor** (ver fim).

Template canónico de um acto legal:

```
https://data.dre.pt/eli/{tipo}/{nº}/{ano}/{mês}/{dia}[/{p|data}/dre/{lang}[/{fmt}]][#{frag}]
```

| Segmento | Significado |
|---|---|
| `data.dre.pt` | Domínio autoritativo (INCM/DRE, em produção desde 2016). |
| `eli` | Marcador literal do esquema ELI. |
| `{tipo}` | Slug do tipo de acto (`dec-lei`, `lei`, …). |
| `{nº}` | Número do acto (aceita sufixo, ex. `205-B`, `442-A`). |
| `{ano}/{mês}/{dia}` | **Data de publicação** completa no DR. |
| `p` | Marcador de versão "como publicada" (ponto-no-tempo); substituído pela data de consolidação nas versões consolidadas. |
| `dre` | Agente (Diário da República). |
| `{lang}` | Língua, `pt` (2 letras — convenção INCM; o `<FRBRlanguage>` AKN usa `por`). |
| `{fmt}` | Formato como **segmento** (`xml`, `html`, `pdf`) — não extensão. |
| `{frag}` | Fragmento interno = eId AKN-PT (`#art_5__para_1`). |

## Camadas FRBR

| Camada | Forma | Exemplo |
|---|---|---|
| Work | `…/{tipo}/{nº}/{ano}/{mês}/{dia}` | `https://data.dre.pt/eli/dec-lei/83/2016/12/16` |
| Expression (como publicada) | Work + `/p/dre/pt` | `…/dec-lei/83/2016/12/16/p/dre/pt` |
| Expression (consolidada) | Work + `/{data}/dre/pt` | `…/dec-lei/83/2016/12/16/2024-01-01/dre/pt` |
| Manifestation | Expression + `/{fmt}` | `…/dec-lei/83/2016/12/16/p/dre/pt/xml` |
| Fragmento | qualquer + `#{eId}` | `…/p/dre/pt#art_5__para_1__lit_a` |

## Diário (jornal)

```
https://data.dre.pt/eli/diario/{série}/{número}/{ano}/{suplemento}/{lang}/{fmt}
```

## Tipos de acto (escopo v0.1.0 → v0.2)

| Tipo PT | Slug | Exemplo Work |
|---|---|---|
| Decreto-Lei | `dec-lei` | `https://data.dre.pt/eli/dec-lei/83/2016/12/16` |
| Lei (AR) | `lei` | `https://data.dre.pt/eli/lei/7/2020/04/10` |
| Decreto da AR | `decreto-ar` | `https://data.dre.pt/eli/decreto-ar/32/2021/04/23` |
| Resolução da AR | `res-ar` | `https://data.dre.pt/eli/res-ar/87/2026/05/02` |
| Portaria | `portaria` | `https://data.dre.pt/eli/portaria/249/2021/11/22` |
| Resolução do CM | `res-cm` | `https://data.dre.pt/eli/res-cm/53/2020/07/10` |
| Despacho normativo | `despacho-normativo` | `https://data.dre.pt/eli/despacho-normativo/1/2022/01/07` |
| Decreto Legislativo Regional | `dlr` | `https://data.dre.pt/eli/dlr/19/2020/06/30` |
| Decreto Regulamentar Regional | `drr` | `https://data.dre.pt/eli/drr/2/2026/03/04` |

> **Actos regionais (DLR/DRR):** o template `data.dre.pt` não tem segmento de
> jurisdição. Por decisão de 2026-06-22 usa-se a mesma forma para todos os
> actos; a região permanece em `<FRBRcountry>` (`pt-20`/`pt-30`). Nota: os
> diplomas regionais são publicados nos jornais oficiais regionais
> (JORAA/JORAM), não no DR série I — a resolução ELI regional fica a confirmar
> com a INCM e as Regiões.

## Construtibilidade e citações (a confirmar na reunião INCM)

O template `data.dre.pt` exige a data de publicação completa (ano/mês/dia).
Essa data consta da **citação legística completa** — ex. `Decreto-Lei
n.º 43-B/2024, de 2 de julho` — pelo que **o URI canónico é construível a
partir de uma citação completa**: o parser extrai "..., de {dia} de {mês}
[de {ano}]" e mapeia o nome do mês para o seu número.

**Casos insuficientes** (não por falha do esquema, mas por falta de dados na
origem):
- Citação **abreviada** (`Decreto-Lei n.º 22/2026`, sem "de {dia} de {mês}").
- URL de detalhe do portal (`.../detalhe/decreto-lei/22-2026-HASH`), que não
  expõe a data.

Nestes casos é preciso um lookup ao DRE ou um serviço de resolução. A forma
proposta abaixo (`eli.gov.pt`) cobre o caso da citação abreviada por desenho.

## Forma proposta anterior (DAPL) — evolução a propor

Mantida no projeto como alternativa e contributo técnico. É **auto-suficiente
perante citações abreviadas** (construível mesmo sem a componente de data),
ao passo que o template `data.dre.pt` exige a data completa — que, recorde-se,
está presente em qualquer citação legística *completa*:

```
https://eli.gov.pt/eli/{jur}/{tipo}/{ano}/{nº}/pt[/{pit}][.{fmt}][#{frag}]
ex.: https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt
```

O conversor de referência ([`conversion.py`](conversion.py)) produz ambas as
formas e converte de/para os URLs de detalhe do `dre.pt`.
