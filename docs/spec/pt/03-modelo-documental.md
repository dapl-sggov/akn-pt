# 3. Modelo documental — FRBR e Akoma Ntoso

## 3.1 As três camadas FRBR

O Akoma Ntoso adopta o modelo FRBR (Functional Requirements for Bibliographic
Records), que separa três camadas para qualquer recurso bibliográfico:

| Camada | Significado prático para um ato PT |
|---|---|
| **Work** | A obra abstracta — "o Decreto-Lei n.º 22/2026". Existe independentemente do texto concreto. |
| **Expression** | Uma versão textual concreta — a versão originária; a versão consolidada após a Lei n.º 15/2027; etc. |
| **Manifestation** | Uma representação física — o XML AKN-PT, o PDF facsimile, a página HTML em dre.pt. |
| (Item) | Uma instância singular — o ficheiro X no servidor Y. (Não tem URI ELI próprio.) |

Esta separação é a base para versionamento (uma Work, várias Expressions), para
identificação canónica (cada camada com URI próprio) e para arquivamento (cada
Manifestation pode evoluir tecnicamente sem alterar a identidade da Expression).

## 3.2 Como AKN-PT materializa as três camadas

Cada documento AKN-PT contém os três elementos FRBR em `<meta>/<identification>`:

```xml
<identification source="#dapl">
  <FRBRWork>
    <FRBRthis    value="https://data.dre.pt/eli/dec-lei/22/2026/03/15/!main"/>
    <FRBRuri     value="https://data.dre.pt/eli/dec-lei/22/2026/03/15"/>
    <FRBRdate    date="2026-03-10" name="adoption"/>
    <FRBRauthor  href="#governo"/>
    <FRBRcountry value="pt"/>
    <FRBRsubtype value="dec-lei-ordinario"/>
    <FRBRnumber  value="22"/>
  </FRBRWork>
  <FRBRExpression>
    <FRBRthis     value="https://data.dre.pt/eli/dec-lei/22/2026/03/15/p/dre/pt/!main"/>
    <FRBRuri      value="https://data.dre.pt/eli/dec-lei/22/2026/03/15/p/dre/pt"/>
    <FRBRdate     date="2026-03-15" name="publication"/>
    <FRBRauthor   href="#governo"/>
    <FRBRlanguage language="por"/>
  </FRBRExpression>
  <FRBRManifestation>
    <FRBRthis   value="https://data.dre.pt/eli/dec-lei/22/2026/03/15/p/dre/pt/xml/!main"/>
    <FRBRuri    value="https://data.dre.pt/eli/dec-lei/22/2026/03/15/p/dre/pt/xml"/>
    <FRBRdate   date="2026-03-15" name="publication"/>
    <FRBRauthor href="#dre"/>
    <FRBRformat value="application/akn+xml; profile=akn-pt-1.0"/>
  </FRBRManifestation>
</identification>
```

Notas estruturais:

- `<FRBRthis>` é a identificação **deste fragmento** do documento (note o
  sufixo `/!main`); `<FRBRuri>` identifica **toda a obra** ao nível da
  respectiva camada.
- O `@value` em `<FRBRuri>` é um URI ELI-PT (ver [cap. 8](08-identificadores.md)).
- O `@source` em `<identification>` aponta para um actor declarado em
  `<references>` — quem produziu esta identificação.

## 3.3 Como uma alteração afecta as três camadas

Cenário: o DL n.º 22/2026 (originário) é alterado pelo DL n.º 80/2026.

| Camada | Antes da alteração | Depois |
|---|---|---|
| Work | `data.dre.pt/eli/dec-lei/22/2026/03/15` (único) | Mantém-se. Não muda. |
| Expression | `…/03/15/p/dre/pt` (originária) | mantém-se; cria-se `…/03/15/2026-08-20/dre/pt` para a consolidada. |
| Manifestation | `…/p/dre/pt/xml` | Mantém-se; cria-se `…/2026-08-20/dre/pt/xml`. |

Importante:

- A versão originária **nunca** desaparece. O seu URI Expression continua
  válido para sempre.
- A consolidada é uma **nova** Expression — não substitui a anterior.
- O alterador (DL n.º 80/2026) é, ele próprio, uma Work distinta, com a sua
  própria Expression e Manifestation.

## 3.4 `<references>` — os actores nomeados

Tudo o que o documento refere por `href="#xxx"` (autores, signatários,
roles, conceitos) **deve** ter um declarador correspondente em `<references>`.
Os declaradores usam elementos TLC ("Top-Level Class") canónicos do AKN:

| Elemento | Uso típico no AKN-PT | eId convencional |
|---|---|---|
| `<TLCOrganization>` | Governo, AR, Ministérios, INCM, DRE, agências | `governo`, `ar`, `cm`, `ministerio-financas`, `dre`, `dapl` |
| `<TLCRole>` | Primeiro-Ministro, Presidente da República, Presidente da AR, Ministro de X | `primeiro-ministro`, `presidente-republica`, `presidente-ar` |
| `<TLCPerson>` | Pessoa concreta que assina (com desambiguação por data) | `pessoa-pm-2026-05`, `pessoa-pr-2026-03` |
| `<TLCConcept>` | Conceito jurídico definido no diploma ("autoridade competente") | snake_case PT |
| `<TLCLocation>` | Lisboa, Açores, Madeira | `pt`, `pt-20`, `pt-30`, `lisboa` |
| `<TLCEvent>` | Eventos lifecycle (aprovação, promulgação, publicação) | `approval-cm`, `promulgation`, `publication`, `entry-into-force` |

Cada declarador tem três atributos obrigatórios:

- `@eId` — identificador interno (snake_case ou kebab-case);
- `@href` — URI da ontologia AKN canónica (`/akn/ontology/{tipo}/{país}/{slug}`);
- `@showAs` — nome legível em português.

Exemplo:

```xml
<references source="#dapl">
  <TLCOrganization eId="governo"
    href="/akn/ontology/organization/pt/governo"
    showAs="Governo da República Portuguesa"/>
  <TLCRole eId="primeiro-ministro"
    href="/akn/ontology/role/pt/primeiro-ministro"
    showAs="Primeiro-Ministro"/>
  <TLCPerson eId="pessoa-pm-2026-03"
    href="/akn/ontology/person/pt/pm-2026-03"
    showAs="Primeiro-Ministro"/>
</references>
```

## 3.5 `<lifecycle>` — eventos no tempo de vida

Os eventos canónicos do AKN-PT, na ordem cronológica em que ocorrem para o
caso típico de um Decreto-Lei:

| Evento (`refersTo`) | Quando | Aplica-se a |
|---|---|---|
| `#approval-cm` | Aprovação em Conselho de Ministros | DL, RCM |
| `#approval-ar` | Aprovação em plenário da AR | Lei, Decreto AR, Res. AR, DLR |
| `#promulgation` | Promulgação pelo Presidente da República (ou assinatura pelo Representante da República para DLR) | DL, Lei, Decreto AR, DLR, DRR |
| `#signature` | Assinatura ministerial | Portaria, Despacho normativo |
| `#countersignature` | Referenda do PM | DL, Lei (quando aplicável) |
| `#publication` | Publicação no Diário da República | Todos |
| `#entry-into-force` | Início de vigência (pode coincidir com publicação ou ser posterior — vacatio legis) | Todos |

Em XML:

```xml
<lifecycle source="#dapl">
  <eventRef eId="e1" date="2026-03-10" source="#governo" type="generation" refersTo="#approval-cm"/>
  <eventRef eId="e2" date="2026-03-12" source="#governo" type="generation" refersTo="#promulgation"/>
  <eventRef eId="e3" date="2026-03-15" source="#dre"     type="generation" refersTo="#publication"/>
</lifecycle>
```

O Schematron valida (na fase publication) que a sequência cronológica é
coerente: a data de publicação **deve** ser posterior ou igual à data de
adopção.

## 3.6 `<analysis>` — modificações activas e passivas

Em AKN base, `<analysis>` é o bloco onde se regista a relação do diploma com
outros diplomas:

- **Modificações activas** — o que **este diploma faz a outros** (e.g. "altera
  o artigo 5.º do DL n.º 22/2025").
- **Modificações passivas** — o que **outros diplomas fazem a este** (e.g.
  "alterado pelo DL n.º 80/2026").

Em **AKN-PT v0.1.0** o bloco está **estruturalmente presente mas vazio**:

```xml
<analysis source="#dapl">
  <activeModifications/>
  <passiveModifications/>
</analysis>
```

O preenchimento sistemático é da consolidação automática prevista para a v0.2.
Manter o elemento vazio em v0.1.0 garante compatibilidade forward — quando o
preenchimento começar, o schema já estará pronto.

## 3.7 Anatomia completa de um `<act>` AKN-PT

```
akomaNtoso
└── act (@name = "dec-lei" | "lei" | …)
    ├── meta
    │   ├── identification (FRBRWork + FRBRExpression + FRBRManifestation)
    │   ├── references (TLC actors)
    │   ├── lifecycle (eventRefs)
    │   ├── workflow (opcional, v0.2+)
    │   └── analysis (vazio em v0.1.0)
    ├── preface (docType + docNumber + docDate + shortTitle)
    ├── preamble (zero ou mais recitais + formula type="enacting")
    ├── body (articulado: article+ para DL/Lei/Portaria; paragraph+ para RCM/Res-AR)
    ├── conclusions (formulas + signatures)
    └── attachments (zero ou mais)
```

Os próximos capítulos detalham cada um destes blocos. O [capítulo 5](05-estrutura-documento.md)
trata da estrutura geral comum; o [capítulo 6](06-mapeamento-estrutural.md)
particulariza para cada tipo de ato.
