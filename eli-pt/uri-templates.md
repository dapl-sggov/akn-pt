# ELI-PT URI templates — tabela de referência

> **v0.2 (2026-06-22):** o template **canónico** é o de produção da INCM
> (`data.dre.pt`), confirmado contra a fonte oficial. A forma anterior da DAPL
> (`eli.gov.pt`, ano+número) é mantida só como **evolução a propor** (ver fim).

> **Forma verificada (ver [`incm-eli-reference.md`](incm-eli-reference.md)).**
> O Work termina em `/{p|a|m}/dre`; a Expression acrescenta `/pt`. Sufixo do
> número em **minúsculas**. Território: `p` (nacional), `a` (Açores), `m` (Madeira).

Template canónico de um acto legal (publicado):

```
https://data.dre.pt/eli/{tipo}/{nº}/{ano}/{mês}/{dia}/{p|a|m}/dre[/{lang}[/{fmt}]][#{frag}]
```

Consolidado:

```
https://data.dre.pt/eli/{tipo}/{nº}/{ano}/{p|a|m}/cons/{AAAAMMDD}[/{lang}[/{fmt}]]
```

| Segmento | Significado |
|---|---|
| `data.dre.pt` | Domínio autoritativo (INCM/DRE, em produção desde 2016). |
| `eli` | Marcador literal do esquema ELI. |
| `{tipo}` | Slug ELI real da INCM (`dec-lei`, `lei`, `port`, `resolconsmin`, …). |
| `{nº}` | Número do acto (sufixo em minúsculas, ex. `82-e`, `442-a`). |
| `{ano}/{mês}/{dia}` | **Data de publicação** completa no DR (publicado). |
| `{p\|a\|m}` | Território: `p` nacional, `a` Açores, `m` Madeira. |
| `dre` / `cons/{AAAAMMDD}` | Agente DRE (publicado) / consolidação na data (compacta). |
| `{lang}` | Língua, `pt` (2 letras — INCM; o `<FRBRlanguage>` AKN usa `por`). |
| `{fmt}` | Formato como **segmento** (`xml`, `html`, `pdf`) — não extensão. |
| `{frag}` | Fragmento interno = eId AKN-PT (`#art_5__para_1`). |

## Camadas FRBR

| Camada | Forma | Exemplo |
|---|---|---|
| Work (publicado) | `…/{ano}/{mês}/{dia}/{p\|a\|m}/dre` | `https://data.dre.pt/eli/dec-lei/83/2016/12/16/p/dre` |
| Work (consolidado) | `…/{ano}/{p\|a\|m}/cons/{AAAAMMDD}` | `…/dec-lei/18/2008/p/cons/20210721` |
| Expression | Work + `/{lang}` | `…/dec-lei/83/2016/12/16/p/dre/pt` |
| Manifestation | Expression + `/{fmt}` | `…/dec-lei/83/2016/12/16/p/dre/pt/xml` |
| Fragmento | qualquer + `#{eId}` | `…/p/dre/pt#art_5__para_1__lit_a` |
| Regional (ex. DLR Açores) | `a` no slot do `p` | `…/declegreg/12/2022/05/25/a/dre/pt` |

## Diário (jornal)

```
https://data.dre.pt/eli/diario/{série}/{número}/{ano}/{suplemento}/{lang}/{fmt}
```

## Tipos de acto (escopo v0.1.0 → v0.2)

| Tipo PT (`<act name>`) | Slug ELI real (INCM) | Exemplo Work |
|---|---|---|
| Decreto-Lei | `dec-lei` | `https://data.dre.pt/eli/dec-lei/18/2008/01/29/p/dre` |
| Lei (AR) | `lei` | `https://data.dre.pt/eli/lei/7/2009/02/12/p/dre` |
| Decreto da AR | `dec` | `https://data.dre.pt/eli/dec/1/2018/01/11/p/dre` |
| Resolução da AR | `resolassrep` | `https://data.dre.pt/eli/resolassrep/28/2022/06/24/p/dre` |
| Portaria | `port` | `https://data.dre.pt/eli/port/164-a/2022/06/24/p/dre` |
| Resolução do CM | `resolconsmin` | `https://data.dre.pt/eli/resolconsmin/67/2022/07/25/p/dre` |
| Despacho normativo | `despnorm` | `https://data.dre.pt/eli/despnorm/36/2006/06/26/p/dre` |
| Decreto Legislativo Regional | `declegreg` | `https://data.dre.pt/eli/declegreg/12/2022/05/25/a/dre` (Açores) |
| Decreto Regulamentar Regional | `decregulreg` | `https://data.dre.pt/eli/decregulreg/10/2022/07/22/a/dre` (Açores) |

> O `<act name>` AKN-PT mantém o nome legível; o **slug ELI real da INCM** aparece
> no URI (ver [`incm-eli-reference.md`](incm-eli-reference.md)). Os exemplos acima
> são diplomas **reais** cujo ELI resolve no DR.

> **Actos regionais (DLR/DRR):** o território está **no URI**, no slot do `p`:
> `a` (Açores) ou `m` (Madeira) — ex. `…/declegreg/12/2022/05/25/a/dre`. O
> `<FRBRcountry>` acompanha (`pt-20`/`pt-30`). Alguns tipos têm ainda slug
> regional próprio (`decrepraa`/`decrepram`, `resolalraa`/`resolalram`). A
> articulação com os jornais regionais (JORAA/JORAM) fica a confirmar com a INCM.

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
