# Dossier de Conhecimento ELI — European Legislation Identifier

**DAPL/SGGOV · Preparação da reunião com a INCM · 1 de julho de 2026**

*Documento de conhecimento. Não contém recomendações (objecto de documento
autónomo — ver [`eli-pt-gap-analysis.md`](eli-pt-gap-analysis.md) e
[`../meeting-incm-2026-07-01.md`](../meeting-incm-2026-07-01.md)).*

> **Proveniência:** produzido a 2026-06-22 por pesquisa multi-ângulo
> (7 dimensões + 4 verificações em fontes primárias, 109 fontes). Pontos
> marcados *confidence: medium* devem ser confirmados antes de citação formal.

---

## 1. O que é o ELI

O **European Legislation Identifier (ELI)** é um standard europeu de
identificação e descrição de legislação, nascido em 2010 no **European Forum
of Official Gazettes** (Roma) e formalizado por **Conclusões do Conselho da UE**:

- **2012/C 325/02** — *"Council conclusions inviting the introduction of the
  European Legislation Identifier (ELI)"*, adoptadas em **10 de outubro de
  2012**, JO C 325 de 26.10.2012, pp. 3-11 (CELEX 52012XG1026(01)). Convidam,
  em base **voluntária**, Estados-Membros e instituições a adoptar um
  identificador comum.
- **2017/C 441/05** — *"Council conclusions of 6 November 2017 on the European
  Legislation Identifier"*, JO C 441 de 22.12.2017, pp. 8-12 (CELEX
  52017XG1222(02)). Reforçam o uso da ontologia ELI como modelo semântico
  comum e alargam o âmbito para além dos actos legislativos.
- Seguiu-se uma **terceira ronda em 2019 (2019/C 360/01)**.

**Três pilares técnicos** (originais):

1. **URIs persistentes** para recursos legais, via *URI Templates* (RFC 6570);
2. **Metadados estruturados** descritos pela **ontologia ELI** (OWL/RDF);
3. **Serialização embebida** dos metadados nas páginas web (RDFa ou JSON-LD).

A 3.ª edição das guidelines (2024) acrescentou um **Pilar IV** —
sincronização/*advertising* de novos ELIs via **feeds Atom / sitemaps** para
*harvesting*.

**Estado da ontologia:** versão corrente **v1.5**, publicada em **2024-03-21**
no EU Vocabularies (Publications Office), a fonte canónica. Histórico: v1.0
(2014), v1.1 (set. 2016, introduziu `LegalResourceSubdivision`). *Confidence
medium:* o portal Joinup ainda exibe v1.3 (last update 16.02.2024) —
divergência face à EU Vocabularies, que prevalece. Namespace canónico:
`http://data.europa.eu/eli/ontology`.

---

## 2. Como funciona tecnicamente

**URI template (RFC 6570).** Cada jurisdição declara o seu próprio template
parametrizável. Componentes típicos: `jurisdiction`, `agent`, `sub-agent`,
`year`, `month`, `day`, `type` (typedoc), `natural identifier`,
`level/subdivision`, `point-in-time`, `version`, `language`, `format`. Os
componentes são **opcionais e a ordem não é fixa** entre jurisdições.

**Metadados (RDFa/JSON-LD).** A serialização preferida pela maioria dos países
é **RDFa embebido no HTML**; JSON-LD é a alternativa moderna; existem ainda
RDF/XML e ELI/XML (XSD). Markup usa `about/typeof/property/resource/content/
datatype` com namespace `http://data.europa.eu/eli/ontology#` (ex.:
`typeof="eli:LegalResource"`).

**ELI ↔ FRBR.** A ontologia assenta em **FRBR/FRBRoo + CIDOC-CRM**, com três
classes-espinha-dorsal:

- `LegalResource` ≈ **Work** (obra abstracta, sem língua) — `is_realized_by` →
- `LegalExpression` ≈ **Expression** (versão/língua) — `is_embodied_by` →
- `Format` ≈ **Manifestation** (PDF/HTML/XML).

**6 propriedades obrigatórias** no núcleo: `type_document`, `date_publication`,
`passed_by`, `title`, `language` e a relação `is_realized_by/realizes`
(*confidence: medium*). Recomendadas frequentes: `is_about` (assunto, com
**EuroVoc**), `date_document`, `first_date_entry_in_force`, `in_force`, e
relações jurídicas (`amends/amended_by`, `repeals/repealed_by`,
`consolidates/consolidated_by`, `transposes`, `cites`).

**Consolidação (point-in-time).** A versão consolidada substitui o sufixo de
"tal como publicado" por uma **data ISO** no URI. Na UE: ato original termina
em `/oj`; a consolidação usa a data de entrada em vigor da última alteração.
Ex.: `http://data.europa.eu/eli/dec/2009/496/2012-07-12`. Modela-se via
`consolidates/consolidated_by`.

**Fragmentos (subdivisões).** Modelados por `LegalResourceSubdivision`, com
`is_part_of/has_part`, `type_subdivision` e `number`. Referência normativa:
*Specifications for the identification of subdivisions in EU legislation (v2)*
da Publications Office. *Nota:* na prática da UE, estes URIs ainda resolvem
para o ato completo (resolução granular planeada).

**Content negotiation.** Por cabeçalho `Accept` (`text/turtle`,
`application/ld+json`, `application/rdf+xml`) e/ou por extensão no URI; padrão
Linked Data **303 See Other**. O BOE negoceia por sufixo
(`/spa/html|xml|pdf|epub`).

---

## 3. Governação e adesão

**Natureza jurídica:** o ELI é uma **recomendação** via Conclusões do Conselho
— **adoção voluntária, gradual e opcional**, sem efeito vinculativo nem
sanção. As Conclusões "convidam" (*invite*).

**Coordenador nacional.** Para aderir, um Estado-Membro deve (a) **nomear um
coordenador nacional ELI** (ponto de contacto que declara o template de URI e
mantém a informação actualizada) e (b) **partilhar a informação da sua
implementação**, publicada no ELI register em EUR-Lex.

**Estrutura de governação:**

- **ELI Task Force** (criada em dez. 2012 pelo eLaw Working Party do Conselho)
  — define e mantém as especificações; ~21 países + Publications Office;
  **presidência do Luxemburgo**.
- **Publications Office da UE** — aloja e mantém o **ELI register**
  (`eur-lex.europa.eu/eli`), o registo de coordenadores nacionais e a
  ontologia; é também ele próprio implementador.

**ELI register (situação ~1 jan. 2023, 21 implementadores):** Albânia, Áustria,
Bélgica, Croácia, Dinamarca, EU-Publications Office, Finlândia, França,
Hungria, Irlanda, Itália, Luxemburgo, Malta, Noruega, Polónia, **Portugal**,
Sérvia, Eslovénia, Espanha, Suíça, Reino Unido. A inclusão de não-membros e do
RU confirma a adesão aberta. *Confidence medium:* números pós-2023 são
estimativas de síntese.

**Passos para aderir:** desenhar o template de URI nacional → mapear metadados
para a ontologia ELI → embeber metadados nas páginas (RDFa/JSON-LD) → declarar
a implementação ao Publications Office. Existem a *ELI Implementation
Methodology* e o *Technical Implementation Guide* (ELI Task Force) — *texto
integral não obtido (HTTP 403); detalhe inferido de descrições secundárias.*

---

## 4. Panorama de implementações

Existe uma **divisão de filosofia de design**: URIs "parlantes" por data
completa (LU/FR/IT/PT, espelham a citação jurídica nacional) vs. minimalistas
por ano+número (UE).

| Jurisdição / Operador | Padrão de URI | Exemplo real | Notas |
|---|---|---|---|
| **UE** — Publications Office (CELLAR/CDM) | `http://data.europa.eu/eli/{typedoc}/{year}/{number}/oj` | `http://data.europa.eu/eli/reg/2016/679/oj` (RGPD; 307→EUR-Lex, verificado) | Minimalista; sem data completa. Consolidada: `.../{start-date}` |
| **Luxemburgo** — SCL (Legilux), pioneiro | `/eli/etat/leg/{tipo}/{ano}/{mês}/{dia}/{id}/jo` | `legilux.public.lu/eli/etat/leg/rgd/2023/09/25/a622/jo` | Consolidação: `.../consolide/{AAAAMMDD}`; sem `/jo` → consolidação mais recente |
| **França** — DILA (Légifrance), 2014 | `/eli/{type}/{ano}/{mês}/{dia}/{id-natural}/{version}/{level}` | `legifrance.gouv.fr/eli/decret/2014/11/3/EINI1418507D/jo/texte` (verificado) | Datas **sem zeros à esquerda**. **Granularidade ao artigo** (`/article_N`) |
| **Espanha** — AEBOE (BOE), 2018 | `/eli/{jur}/{type}/{ano}/{mês}/{dia}/{number}/...` | `boe.es/eli/es/lo/2013/12/20/9` | Jurisdição explícita. **Governação federada** (Grupo de Trabajo ELI ≠ operação). Feed Atom + sitemap |
| **Irlanda** — Office of the AG | `/eli/{ano}/{type}/{number}[/section/{n}]/{version}/{lang}/{format}` | `irishstatutebook.ie/eli/2015/act/53/enacted/en/html` | **Ano antes do tipo**. Nível `/section/N` |
| **Itália** — IPZS (Normattiva) | `/eli/stato/{TIPO}/{ano}/{mês}/{dia}/{nº}/{ORIGINAL\|CONSOLIDATED}[/{AAAAMMDD}]` | `normattiva.it/eli/stato/LEGGE/2006/12/27/296/CONSOLIDATED/` | Point-in-time explícito (*time-travel*). Coexiste com URN-NIR |
| **Noruega** — Lovdata (coord. 2015) | `lovdata.no/{tipo}/{AAAA-MM-DD-NR}` | `lovdata.no/forskrift/2011-12-16-1258` | 3 pilares + RDFa |
| **Polónia** | domínio dedicado `eli.gov.pl` | `eli.gov.pl/` | Portal nacional ELI próprio |

**Lições:** (1) o tratamento de consolidação com point-in-time no path (LU
`/consolide/{data}`, IT `/CONSOLIDATED/{data}`) é o padrão maduro; (2) a
granularidade ao artigo (FR `/article_N`, IE `/section/N`) liga directamente
aos eIds; (3) o modelo espanhol separa quem **opera** (AEBOE) de quem define a
**norma** (Grupo de Trabajo) — análogo mais próximo de um modelo híbrido; (4)
a UE separa o ELI estável do identificador interno (CELLAR), validando uma
camada pública sobre o sistema de produção.

---

## 5. Estado em Portugal

> **Achado central:** Portugal **NÃO** parte do zero — **é implementador ELI
> registado** e tem um ELI-PT em produção desde 2016. Mas há sinais de
> **regressão** após a migração do portal para OutSystems.

**Portugal É implementador registado** no ELI register de EUR-Lex (página
`portugal.html`), operado pelo **Diário da República Eletrónico (DRE)**,
editado pela **INCM**.

- **Pilar I** desde **19 de dezembro de 2016** (primeiro URI
  `http://data.dre.pt/eli/diario/241/2016/0/pt/html`).
- **Pilar II** desde **27 de julho de 2017**, ao nível do diário e dos actos,
  conforme **ontologia ELI v1.1**.
- **Âmbito:** todos os actos da **1.ª série** do DR desde **2 de janeiro de
  1991** (a 2.ª série **não** está coberta).
- **Três tipos de URI:** diário, ato legal, legislação consolidada. Padrão do
  ato: `https://data.dre.pt/eli/{tipo}/{nº}/{ano}/{mês}/{dia}/{p}/{dre}/
  {língua}/{formato}` (ex.: `http://data.dre.pt/eli/dec-lei/83/2016/12/16/p/
  dre/pt/html`; `p`=ponto-no-tempo/publicação, `dre`=agente).

**Contradição crítica registo vs. prática actual (verificado 2026-06-22,
*confidence: medium*):**

- O URI `https://data.dre.pt/eli/lei/74/1998/11/11/p/dre/pt/html` **resolveu
  (HTTP 200)**. **Mas** outras tentativas redireccionaram para **`/dr/home`**
  — não resolveram o ato.
- O portal `diariodarepublica.pt` é uma **SPA OutSystems**: o HTML servido
  (~2346 bytes) **não contém RDFa nem JSON-LD ELI** (contagem do literal
  "eli" = 0). O ELI existe como **dado** (renderizado client-side via
  endpoints JSON internos), mas **não como marcação machine-readable na
  página** — o Pilar II em sentido estrito parece ter **regredido na
  migração** para OutSystems.

**Base legal:**

- **Lei n.º 74/98, de 11 de novembro** ("lei formulário") — publicação,
  identificação e formulário dos diplomas; **art. 1.º, n.º 5** confere à
  edição eletrónica **fé plena** e valor para todos os efeitos legais.
- **DL n.º 83/2016, de 16 de dezembro** — serviço público de acesso universal
  e gratuito ao DR; formatos abertos reutilizáveis.
- **DL n.º 235/2015, de 14 de outubro** — atribui à INCM, **em exclusivo**, a
  edição eletrónica do DR; superintendência do Primeiro-Ministro.

**Outros factos:** novo **Sistema de Submissão de Atos (SSA)** em operação
desde **5 de janeiro de 2026** (*confidence: medium*); **não** existe API
REST/SPARQL pública formal da INCM (acesso de terceiros via *scraping* dos
endpoints OutSystems); **não há LeXML-PT nem Akoma Ntoso oficial português** —
lacuna que o AKN-PT visa preencher.

---

## 6. ELI × Akoma Ntoso

ELI e Akoma Ntoso operam em **camadas distintas e complementares, não
concorrentes**:

- **ELI** = camada de **identificação + metadados** (URI persistente +
  ontologia RDF/OWL);
- **Akoma Ntoso** = camada de **conteúdo/estrutura** (XML OASIS LegalDocML).

A **chave da composição é o FRBR partilhado**: o AKN usa
`<FRBRWork>/<FRBRExpression>/<FRBRManifestation>/<FRBRItem>`, exactamente os
níveis da ontologia ELI — pelo que os URIs alinham naturalmente.

**AKN4EU** (perfil interinstitucional UE, governado pelo IMFC desde 2018; v3.0
em 2020-03-06) **adopta explicitamente a convenção de nomenclatura ELI** para
os URIs de elementos estruturais. A composição **eId → fragmento ELI é
canónica**: o eId hierárquico (separador `__`, ex. `art_5__para_1`) junta-se
ao IRI do documento via `#` — exactamente o idioma do AKN-PT.

**Publications Office:** usa ELI + AKN4EU **em conjunto, em papéis distintos** —
ELI para identificar/descrever; AKN4EU como formato estruturado de troca.
**LEOS** (editor open-source da Comissão, EUPL 1.2) é a prova de implementação
conjunta: *"full use of the ELI URI for referencing the subdivisions of the
document at any level of hierarchy"*.

**ELI-DL** (*ELI for Draft Legislation*) — extensão para legislação em
preparação e *pegada legislativa*. **v3 em 2023-11-10** (under development).
**ELI-I** (*Impact ontology*, v1, 2023-11-10, archived) para impactos/
consolidações. Ambas relevantes para a legística PT (pegada Lei 5-A/2026).

**ECLI** (*European Case Law Identifier*) — standard-irmão para
**jurisprudência**; estrutura `ECLI:país:tribunal:ano:número`. Fronteira
clara: **ECLI = jurisprudência, ELI = legislação** (domínios disjuntos).

---

## 7. Desenvolvimentos recentes (2023-2026)

- **Ontologia v1.5** (2024-03-21) como baseline normativa; **3.ª edição** das
  guidelines e do guia técnico em 2024 (formalizam o **Pilar IV**).
- **Novas extensões (2023-2024):** **ELI-DL v3** (drafts/tramitação) e
  **ELI-I v1** (impactos/consolidação) — os desenvolvimentos mais accionáveis
  para necessidades de consolidação e acompanhamento legislativo.
- **Componentes `{agent}`/`{sub-agent}`** suportam legislação
  **regional/sub-nacional** (relevante para Açores/Madeira) e
  **secundária/regulamentar**.
- **Interoperable Europe Act — Regulamento (UE) 2024/903** (em vigor desde
  11.04.2024): transita do quadro voluntário (EIF) para estrutura
  **juridicamente vinculativa**, com avaliações de interoperabilidade
  obrigatórias. **Não torna o ELI obrigatório** — mas cria **pressão indirecta
  de mandato** por identificadores comuns. (O próprio Regulamento usa ELI.)
- **DCAT-AP** alinha-se com ELI; sob os **High Value Datasets (HVD)**, cada
  dataset deve fornecer o ELI em `dcatap:applicableLegislation`.
- **schema.org Legislation** derivada do ELI; **EuroVoc** como vocabulário de
  classificação ligável.
- **Investigação:** *Semantic Interoperability: Mapping the ELI and Akoma
  Ntoso Ontologies* (ICEGOV 2023, ACM, doi 10.1145/3614321.3614327) —
  referência directa para o cruzamento AKN↔ELI.

---

## Fontes

**Conclusões do Conselho / base jurídica UE**
- 2012/C 325/02 — https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52012XG1026(01)
- 2017/C 441/05 — https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52017XG1222(02)
- Interoperable Europe Act 2024/903 — https://eur-lex.europa.eu/eli/reg/2024/903/oj/eng

**ELI register / Publications Office / ontologia**
- About ELI — https://eur-lex.europa.eu/eli-register/about.html
- Implementação (registo) — https://eur-lex.europa.eu/eli-register/implementation.html
- EU Vocabularies (ontologia v1.5) — https://op.europa.eu/en/web/eu-vocabularies/eli
- Namespace canónico — http://data.europa.eu/eli/ontology
- Subdivisions specifications v2 — https://eur-lex.europa.eu/content/eli-register/ELI-subdivisions-specifications-v2.pdf

**Implementações nacionais**
- Légifrance (FR) — https://www.legifrance.gouv.fr/eli/decret/2014/11/3/EINI1418507D/jo/texte
- Legilux (LU) — https://legilux.public.lu/eli/etat/leg/loi/1915/08/10/n1/consolide/20250302
- BOE (ES) — https://www.boe.es/legislacion/eli.php?lang=en
- Irish Statute Book (IE) — https://www.irishstatutebook.ie/pdf/ELI_URI_schema.pdf
- Normattiva (IT) — https://dati.normattiva.it/assets/come_fare_per/ELI_implementation_in_Italy.pdf
- Lovdata (NO) — https://lovdata.no/eli/ · Polónia — https://eli.gov.pl/

**Portugal**
- ELI register — Portugal — https://eur-lex.europa.eu/eli-register/portugal.html
- 2.º pilar em PT (out. 2017) — https://eur-lex.europa.eu/eli-register/news_item_19.html
- DRE — página ELI — https://diariodarepublica.pt/dr/geral/ligacoes-interesse/identificador-europeu-legislacao-eli
- Lei 74/98 (art. 1.º n.º 5) — https://www.pgdlisboa.pt/leis/lei_mostra_articulado.php?nid=1302&tabela=leis
- DL 83/2016 — https://diariodarepublica.pt/dr/detalhe/decreto-lei/83-2016-105371771
- DL 235/2015 (regime INCM) — https://diariodarepublica.pt/dr/legislacao-consolidada/decreto-lei/2015-207484249

**ELI × Akoma Ntoso / standards adjacentes**
- AKN4EU — https://op.europa.eu/en/web/eu-vocabularies/akn4eu
- AKN v1.0 / Naming Convention (OASIS) — https://docs.oasis-open.org/legaldocml/akn-nc/v1.0/akn-nc-v1.0.html
- ELI-DL — https://interoperable-europe.ec.europa.eu/collection/eli-european-legislation-identifier/solution/eli-ontology-draft-legislation-eli-dl
- ELI-I — https://interoperable-europe.ec.europa.eu/collection/eli-european-legislation-identifier/solution/eli-i
- ECLI — https://eur-lex.europa.eu/content/help/eurlex-content/ecli.html
- LEOS — https://github.com/l-e-x/leos
- DCAT-AP 3.0.1 — https://semiceu.github.io/DCAT-AP/releases/3.0.1/
- Mapping ELI↔AKN (ICEGOV 2023) — https://dl.acm.org/doi/10.1145/3614321.3614327

---

*Pontos a confirmar antes de citação formal: (i) dia exacto da v1.5; (ii)
versão da ontologia em produção na INCM; (iii) estado real dos Pilares II/III/
IV no portal OutSystems; (iv) padrão exacto do URI de consolidada da INCM.*
