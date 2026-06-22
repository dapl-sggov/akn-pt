# ELI-PT — referência oficial INCM (fonte única)

> Extraído da página oficial da INCM (HTML pré-renderizado para crawlers) e
> **verificado empiricamente** (resolução 301→200 + RDFa em todos os tipos,
> 1991→2022) em 2026-06-22:
> <https://diariodarepublica.pt/dr/geral/ligacoes-interesse/identificador-europeu-legislacao-eli>
>
> Esta é a **forma canónica real** do ELI-PT. Substitui quaisquer slugs/forma
> que tenhamos inventado. Vocabulários machine-readable:
> - Tipos de recurso: `https://files.dre.pt/eli/dre-incm-pt-resource-type.rdf`
> - Emissores (agentes): `https://files.dre.pt/eli/dre-incm-pt-legal-agent.rdf`
> - Assuntos (SKOS, ~70k conceitos): `https://files.diariodarepublica.pt/eli/dre-incm-pt-legal-subject.rdf`
> - Sitemap ELI: `https://files.diariodarepublica.pt/eli/sitemap/sitemap.xml`
> - Atom update feed (Pilar IV): `https://files.diariodarepublica.pt/eli/eli-update-feed.atom`

## 1. Gramática das três formas

Marcador de versão/território (o `p` é o slot 5 do path): **`p`** = principal/nacional,
**`a`** = Região Autónoma dos Açores, **`m`** = Região Autónoma da Madeira.
Língua no path = `pt`. Datas no path do ato com **zero-padding**; data de
consolidação **compacta** `AAAAMMDD`. Sufixo do número em **minúsculas** (`82-e`, `164-a`).

### Ato jurídico (publicado)
```
Work (LegalResource):        https://data.dre.pt/eli/{tipo}/{nº}/{ano}/{mês}/{dia}/{p|a|m}/dre
Expression (LegalExpression): … + /{lang}                         (ex. /pt)
Manifestation (LegalFormat):  … + /{formato}                      (ex. /html, /pdf)
```
Ex.: `https://data.dre.pt/eli/dec-lei/2/2018/01/09/p/dre/pt/html`

### Ato consolidado
```
Work:        https://data.dre.pt/eli/{tipo}/{nº}/{ano}/{p|a|m}/cons/{AAAAMMDD}
Expression:  … + /{lang}
Manifestation: … + /{formato}
```
Ex.: `https://data.dre.pt/eli/dec-lei/18/2008/p/cons/20210721/pt/pdf`
(`consolidates` aponta para a Expression original `.../01/29/p/dre/pt/html`; o
PDF gerado tem `media-type: application/pdf;type=generated`.)

### Diário da República (jornal)
```
Work:        https://data.dre.pt/eli/diario/{série}/{número}/{ano}/{suplemento}
Expression:  … + /{lang}
Manifestation: … + /{formato}
```
Ex.: `https://data.dre.pt/eli/diario/1/6/2018/0/pt/html`

## 2. Tabela completa Tipo → Acrónimo (slug ELI)

| Designação do Ato Jurídico | slug | Nota |
|---|---|---|
| Acórdão | `ac` | |
| Acórdão do Supremo Tribunal Administrativo | `acsta` | |
| Acórdão do Supremo Tribunal de Justiça | `acstj` | |
| Acórdão do Tribunal Constitucional | `actconst` | |
| Acórdão do Tribunal de Contas | `actcont` | |
| Anúncio | `anun` | |
| Assento | `asst` | |
| Aviso | `av` | |
| Aviso do Banco de Portugal | `avbdp` | |
| Declaração | `decl` | |
| Declaração de Retificação | `declretif` | relação `corrects` |
| Decreto | `dec` | |
| Decreto-Lei | `dec-lei` | **escopo AKN-PT** |
| Decreto do Ministro da República | `decminrep` | |
| Decreto do Ministro da República para a R.A. Madeira | `decminrepram` | |
| Decreto do Ministro da República para a R.A. Açores | `decminrepraa` | |
| Decreto do Presidente da República | `decpresrep` | |
| Decreto do Representante da República para a R.A. Madeira | `decrepram` | território no slug; `p/dre` |
| Decreto do Representante da República para a R.A. Açores | `decrepraa` | território no slug; `p/dre` |
| Decreto Legislativo Regional | `declegreg` | território no slot: `a/dre` (Açores) / `m/dre` (Madeira) |
| Decreto Regulamentar | `decregul` | |
| Decreto Regulamentar Regional | `decregulreg` | território no slot: `a`/`m` |
| Despacho Normativo | `despnorm` | **escopo AKN-PT** |
| Edital | `ed` | |
| Instruções | `insts` | |
| Jurisprudência | `jurisprud` | |
| Lei | `lei` | **escopo AKN-PT** |
| Lei Constitucional | `leiconst` | |
| Lei Orgânica | `leiorg` | |
| Mapa Oficial | `mapofic` | |
| Moção | `moc` | |
| Moção de Confiança | `mocconf` | |
| Moção de Rejeição | `mocrej` | |
| Parecer do Conselho de Estado | `parconsest` | |
| Portaria | `port` | **escopo AKN-PT** |
| Regimento da Assembleia da República | `rgtassrep` | |
| Regimento do Conselho de Estado | `rgtconsest` | |
| Resolução | `resol` | |
| Resolução da Assembleia da República | `resolassrep` | **escopo AKN-PT** |
| Resolução da Assembleia Legislativa da R.A. Madeira | `resolalram` | |
| Resolução da Assembleia Legislativa da R.A. Açores | `resolalraa` | |
| Resolução da Assembleia Legislativa Regional | `resolalr` | (forma histórica) |
| Resolução da Assembleia Legislativa Regional dos Açores | `resolalra` | (forma histórica) |
| Resolução do Conselho de Ministros | `resolconsmin` | **escopo AKN-PT** |

> **Sem slug INCM exato:** o nosso tipo de escopo "Decreto da Assembleia da
> República" (`decreto-ar`) não tem entrada distinta na tabela; o mais próximo
> é `dec` (Decreto). **A confirmar com a INCM.**

## 3. Mapa de adoção (AKN-PT `<act name>` → slug ELI da INCM)

O `<act name>` do AKN-PT (legível) **mantém-se**; o slug INCM é usado apenas
ao construir URIs ELI.

| AKN-PT `<act name>` | slug ELI (INCM) |
|---|---|
| `dec-lei` | `dec-lei` |
| `lei` | `lei` |
| `portaria` | `port` |
| `res-cm` | `resolconsmin` |
| `res-ar` | `resolassrep` |
| `despacho-normativo` | `despnorm` |
| `dlr` | `declegreg` |
| `drr` | `decregulreg` |
| `decreto-ar` | `dec` *(a confirmar)* |

## 4. Relações ELI (propriedades) relevantes

| Propriedade | Uso |
|---|---|
| `based_on` | **habilitante** (ato autorizado por outro) — ex. Portaria `based_on` DL |
| `transposes` | transposição de directiva/regulamento UE |
| `amends` | introduz modificações legais noutro recurso |
| `corrects` | correção textual (Declaração de Retificação) |
| `cites` | citação no texto |
| `is_about` | assuntos/descritores (vocabulário nacional, não EuroVoc) |
| `related_to` | documento relacionado |

## 5. Constantes de metadados (RDFa/JSON-LD) da INCM

- `uri_schema` = `https://dre.pt/identificador-europeu-legislacao`
- `publisher` = `INCM`; `publisher_agent` / `rightsholder_agent` = `https://data.dre.pt/eli/authority/legal-institution/incm`
- `type_document` = `https://data.dre.pt/eli/authority/resource-type/{slug}`
- `responsibility_of_agent` = `https://data.dre.pt/eli/authority/legal-agent/{...}` (ex. `/dec-lei`, `/pcm`)
- `language` = `https://publications.europa.eu/resource/authority/language/PRT` *(INCM usa `PRT`, não `POR`)*
- `legal_value` = `https://data.europa.eu/eli/ontology#LegalValue-unofficial` *(o conteúdo do portal declara-se não-oficial; o oficial é o DR impresso)*
- `in_force` = `…/eli/ontology#InForce-{inForce|NotInForce|PartiallyInForce}`
