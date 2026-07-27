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

> **Nota:** o nosso tipo de escopo "Decreto da Assembleia da República"
> (`decreto-ar`) não tem entrada distinta na tabela INCM; mapeia para `dec`
> (Decreto) — **confirmado (2026-06-22)**.

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
| `decreto-ar` | `dec` |

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

> **Corrigido em 2026-07-23** por leitura directa do RDFa de 4 actos reais
> (`dec-lei/2/2018`, `lei/7/2020`, `port/208/2018`, `resolconsmin/53/2020`).
> As linhas marcadas ✅ foram verificadas nessa leitura.

- ✅ `uri_schema` = `https://diariodarepublica.pt/dr/geral/ligacoes-interesse/identificador-europeu-legislacao-eli`
  *(a forma curta `https://dre.pt/identificador-europeu-legislacao` que aqui constava não é a servida)*
- ✅ `publisher` = `INCM`; `publisher_agent` / `rightsholder_agent` = `http://data.dre.pt/eli/authority/legal-institution/incm`
- ✅ `type_document` = `http://data.dre.pt/eli/authority/resource-type/{slug}`
- ✅ `responsibility_of_agent` = `http://data.dre.pt/eli/authority/legal-agent/{código}` — vocabulário
  próprio da INCM (ex. `tsss` no DL 2/2018), **não** os nossos slugs de órgão
- ✅ `language` = `http://publications.europa.eu/resource/authority/language/**POR**`
  *(a indicação anterior de `PRT` estava ERRADA — os 4 actos servem `POR`)*
- ✅ `number` = o par nº/ano (`2/2018`, `xsd:string`); `id_local` = **ID interno numérico**
  da INCM (`114484243`) — não é o nº/ano
- ✅ `title` = designação do acto (`Decreto-Lei n.º 2/2018`); `description` = ementa
- ✅ `format` = **media-type da IANA** (`http://www.iana.org/assignments/media-types/text/html`),
  não a autoridade de file-type da UE
- ✅ Relações inversas emitidas pela INCM: `cited_by`, `amended_by`, `consolidated_by`,
  `realizes`, `embodies`, `published_in_format`, `licence`
- ⚠️ Os URIs de autoridade são servidos em `http://` (não `https://`)
- ⚠️ `legal_value` — a INCM serve `LegalValue-official` **e** `LegalValue-definitive`.
  O AKN-PT emite `LegalValue-unofficial` **por desenho**: o que o editor produz é
  um projecto, não a publicação oficial. Divergência intencional.
- `in_force` = `…/eli/ontology#InForce-{inForce|NotInForce|PartiallyInForce}`
