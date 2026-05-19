# 16. Glossário PT-EN

## 16.1 Termos PT → EN (técnicos AKN-PT)

| PT | EN | Notas |
|---|---|---|
| Acto normativo | Normative act | Termo guarda-chuva para os tipos cobertos |
| Aprovação | Adoption | Aprovação em CM ou AR |
| Alteração | Amendment | Modificação textual de outro acto |
| Alterador | Amending act | Acto que altera outro |
| Anexo | Attachment / Annex | `<attachment>` em AKN |
| Articulado | Articles / Body | `<body>` em AKN; conjunto dos artigos |
| Assinatura | Signature | `<signature>` em AKN |
| Camada (FRBR) | Layer (FRBR) | Work / Expression / Manifestation |
| Capítulo | Chapter | `<chapter>` |
| Citação | Citation / Reference | `<ref>`, `<rref>` |
| Conformidade | Conformance | Termo formal — RFC 2119 |
| Considerando | Recital | `<recital>` |
| Consolidação | Consolidation | Integração de alterações na versão consolidada |
| Decreto-Lei | Decree-Law | `dec-lei` |
| Despacho normativo | Normative dispatch | `despacho-normativo` |
| Ementa | Short title / Summary | `<shortTitle>` |
| Epígrafe (de artigo) | Heading | `<heading>` |
| Eventos do ciclo de vida | Lifecycle events | `<lifecycle>/<eventRef>` |
| Fórmula promulgatória | Enacting formula | `<formula type="enacting">` |
| Identificador | Identifier | eId, FRBR URI, ELI-PT |
| Jurisdição | Jurisdiction | `<FRBRcountry>` |
| Legística | Legistics | Técnica legislativa |
| Manifestação (FRBR) | Manifestation (FRBR) | Ficheiro concreto |
| Mapeamento | Mapping | PT structure → AKN element |
| Metadados | Metadata | Bloco `<meta>` |
| Pegada legislativa | Legislative footprint | Lei n.º 5-A/2026 |
| Perfil | Profile | Customização nacional do AKN |
| Permanência (de URI) | Permanence (of URI) | Compromisso de imutabilidade |
| Ponto resolutivo | Resolution paragraph | `<paragraph>` em RCM/Res-AR |
| Portaria | Ministerial regulation / Ordinance | `portaria` |
| Preâmbulo | Preamble | `<preamble>` |
| Promulgação | Promulgation | Pelo PR (ou Representante da República) |
| Referenda | Countersignature | Pelo PM e ministros |
| Republicação | Republication | Republicação técnica em anexo |
| Resolução do CM | Council of Ministers resolution | `res-cm` |
| Retificação | Rectification | Declaração de retificação |
| Subtipo | Subtype | `<FRBRsubtype>` |
| Tipo de ato | Act type | `<act @name>` |
| Versão consolidada | Consolidated version | Expression posterior |

## 16.2 Termos institucionais PT → EN

| PT | EN |
|---|---|
| Assembleia da República (AR) | Assembly of the Republic |
| Assembleia Legislativa Regional dos Açores (ALRA) | Azores Regional Legislative Assembly |
| Assembleia Legislativa Regional da Madeira (ALRM) | Madeira Regional Legislative Assembly |
| Conselho de Ministros (CM) | Council of Ministers |
| Constituição da República Portuguesa (CRP) | Constitution of the Portuguese Republic |
| Diário da República (DR) | Official Journal (lit. "Republic Diary") |
| Divisão de Apoio ao Processo Legislativo (DAPL) | Legislative Process Support Division |
| Faculdade de Direito da Universidade de Lisboa (FDUL) | Lisbon Faculty of Law |
| Governo | Government |
| Imprensa Nacional - Casa da Moeda (INCM) | National Press - Mint House |
| Instituto de Ciências Jurídico-Políticas (ICJP) | Institute of Legal and Political Sciences |
| Ministro | Minister |
| Plenário | Plenary |
| Presidente da República (PR) | President of the Republic |
| Primeiro-Ministro (PM) | Prime Minister |
| Região Autónoma | Autonomous Region |
| Representante da República | Representative of the Republic (regional) |
| Secretaria-Geral do Governo (SGGOV) | Government Secretariat-General |
| Secretário-Geral (SG) | Secretary-General |

## 16.3 Termos AKN canónicos (não traduzir!)

Estes elementos AKN têm nome em inglês definido pelo standard OASIS e **não
devem ser traduzidos** no XML — fazer isso quebra tooling.

- `akomaNtoso`, `act`, `meta`, `preface`, `preamble`, `body`, `conclusions`, `attachments`
- `identification`, `references`, `lifecycle`, `analysis`, `workflow`
- `FRBRWork`, `FRBRExpression`, `FRBRManifestation`
- `FRBRthis`, `FRBRuri`, `FRBRdate`, `FRBRauthor`, `FRBRcountry`, `FRBRsubtype`, `FRBRnumber`, `FRBRlanguage`, `FRBRformat`, `FRBRversionNumber`
- `TLCOrganization`, `TLCPerson`, `TLCRole`, `TLCConcept`, `TLCLocation`, `TLCEvent`, `TLCObject`, `TLCReference`
- `eventRef`
- `book`, `part`, `title`, `chapter`, `section`, `subsection`, `article`, `paragraph`, `list`, `point`
- `num`, `heading`, `subheading`, `intro`, `content`, `wrapUp`
- `docType`, `docNumber`, `docDate`, `shortTitle`
- `recital`, `formula`, `signature`, `person`
- `ref`, `rref`, `date`, `authorialNote`, `quotedStructure`
- `attachment`, `mainBody`
- `b`, `i`, `u`, `sup`, `sub`, `p`, `blockList`, `item`, `table`, `tr`, `td`, `img`

O **nome do elemento** é em inglês (`<article>`); o **conteúdo textual** que
o elemento contém é em português ("Artigo 5.º").

## 16.4 Abreviaturas usadas nesta spec

| Sigla | Significado |
|---|---|
| AKN | Akoma Ntoso |
| AKN-PT | Perfil português do Akoma Ntoso (objecto desta spec) |
| AKN4EU | Perfil UE do Akoma Ntoso (PubOffice) |
| ALR | Assembleia Legislativa Regional |
| AR | Assembleia da República |
| CM | Conselho de Ministros |
| CRP | Constituição da República Portuguesa |
| DAPL | Divisão de Apoio ao Processo Legislativo |
| DL | Decreto-Lei |
| DLR | Decreto Legislativo Regional |
| DR | Diário da República |
| DRR | Decreto Regulamentar Regional |
| ELI | European Legislation Identifier |
| ELI-PT | Perfil português do ELI |
| EUPL | European Union Public Licence |
| FRBR | Functional Requirements for Bibliographic Records |
| IMFC | Interinstitutional Metadata and Formats Committee (UE) |
| INCM | Imprensa Nacional - Casa da Moeda |
| ISO | International Organization for Standardization |
| LEOS | Legislation Editing Open Software (Comissão Europeia) |
| OASIS | Organization for the Advancement of Structured Information Standards |
| PR | Presidente da República |
| PM | Primeiro-Ministro |
| RCM | Resolução do Conselho de Ministros |
| SG | Secretário-Geral |
| SGGOV | Secretaria-Geral do Governo |
| SVRL | Schematron Validation Reporting Language |
| TLC | Top-Level Class (`<TLCOrganization>`, `<TLCPerson>`, etc.) |
| TSI | Technical Support Instrument (DG REFORM, Comissão Europeia) |
| XSD | XML Schema Definition |
