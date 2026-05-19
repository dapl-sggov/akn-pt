# 9. Metadados

> Para o detalhe do bloco `<workflow>` — pegada legislativa exigida pela
> Lei n.º 5-A/2026 — ver [capítulo 12](12-pegada-legislativa.md). Este
> capítulo cobre `<identification>` (FRBR), `<references>` (TLC actors),
> `<lifecycle>` e `<analysis>`.

## 9.1 Onde vivem os metadados num documento AKN-PT

```
<act>
  <meta>
    <identification>   FRBRWork + FRBRExpression + FRBRManifestation
    <references>       TLC actors (Organization, Person, Role, Concept, Location, Event)
    <lifecycle>        eventRefs (aprovação, promulgação, publicação, vigência)
    <workflow>         workflow steps (opcional, v0.2+)
    <analysis>         active/passive modifications (vazio em v0.1.0)
  </meta>
  ...
</act>
```

Tudo em `<meta>` é metadado. O `<preface>` (cabeçalho legível) também tem
informação que é simultaneamente conteúdo e metadado (docType, docNumber,
shortTitle); esses elementos são duplicados como metadado para queryability.

## 9.2 FRBR — obrigatórios

O bloco `<identification>` é o mais central. Os elementos obrigatórios em
todas as três camadas:

### FRBRWork

| Elemento | Obrigatório | Conteúdo |
|---|---|---|
| `<FRBRthis>` | Sim | URI ELI-PT Work do fragmento principal (com `/!main`) |
| `<FRBRuri>` | Sim | URI ELI-PT Work canónico |
| `<FRBRdate name="adoption">` | Sim | Data de aprovação (CM ou AR) |
| `<FRBRauthor href="#xxx">` | Sim | Referência a actor em `<references>` |
| `<FRBRcountry value="pt|pt-20|pt-30">` | Sim | Jurisdição |
| `<FRBRsubtype value="...">` | Sim em AKN-PT | Subtipo do tipo de ato (cap. 4) |
| `<FRBRnumber value="..."/>` | Recomendado | Número do ato (redundante com URI mas útil para tooling) |

### FRBRExpression

| Elemento | Obrigatório | Conteúdo |
|---|---|---|
| `<FRBRthis>` | Sim | URI ELI-PT Expression do fragmento principal |
| `<FRBRuri>` | Sim | URI ELI-PT Expression canónico |
| `<FRBRdate name="publication">` | Sim | Data de publicação em DR |
| `<FRBRauthor>` | Sim | Tipicamente igual ao Work |
| `<FRBRlanguage language="por">` | Sim | ISO 639-3 — sempre `por` para PT |
| `<FRBRversionNumber>` | Recomendado | `1` para originária; incrementa em cada consolidação |

### FRBRManifestation

| Elemento | Obrigatório | Conteúdo |
|---|---|---|
| `<FRBRthis>` | Sim | URI Manifestation do fragmento principal |
| `<FRBRuri>` | Sim | URI Manifestation canónico (com sufixo `.xml`/`.html`/...) |
| `<FRBRdate name="publication">` | Sim | Data de manifestação |
| `<FRBRauthor href="#dre">` | Sim | INCM/DRE como manifestador |
| `<FRBRformat value="application/akn+xml; profile=akn-pt-1.0">` | Sim | Media type com perfil |

## 9.3 `<references>` — actores nomeados

Cada actor mencionado por `href="#xxx"` no documento (autores, signatários,
roles, conceitos, eventos) **DEVE** ter um declarador correspondente em
`<references>`.

| TLC | Uso típico | eId convencional |
|---|---|---|
| `TLCOrganization` | Instituições | `governo`, `ar`, `cm`, `dre`, `dapl`, `ministerio-X`, `gov-regional-acores`, `alra` |
| `TLCRole` | Cargos | `primeiro-ministro`, `presidente-republica`, `presidente-ar`, `ministro-X`, `representante-republica-acores` |
| `TLCPerson` | Pessoas singulares (com desambiguação por data) | `pessoa-pm-2026-03`, `pessoa-pr-2026-03`, `pessoa-min-financas-2026-04` |
| `TLCConcept` | Conceitos definidos no diploma | snake_case PT (e.g. `autoridade-competente`) |
| `TLCLocation` | Geo refs | `pt`, `pt-20`, `pt-30`, `lisboa`, `ponta-delgada` |
| `TLCEvent` | Eventos lifecycle | `approval-cm`, `approval-ar`, `promulgation`, `signature`, `countersignature`, `publication`, `entry-into-force` |

Cada declarador tem três atributos obrigatórios:

```xml
<TLCOrganization
  eId="governo"
  href="/akn/ontology/organization/pt/governo"
  showAs="Governo da República Portuguesa"/>
```

- `@eId` — identificador interno único.
- `@href` — URI da ontologia AKN canónica: `/akn/ontology/{tipo}/{país}/{slug}`.
- `@showAs` — nome legível em português.

## 9.4 `<lifecycle>` — eventos no tempo

Cada evento tem `eId`, `date`, `source` (FK para `<references>`), `type` e
`refersTo` (FK para a ontologia de eventos).

```xml
<lifecycle source="#dapl">
  <eventRef eId="e1" date="2026-03-10" source="#governo"
            type="generation" refersTo="#approval-cm"/>
  <eventRef eId="e2" date="2026-03-12" source="#governo"
            type="generation" refersTo="#promulgation"/>
  <eventRef eId="e3" date="2026-03-15" source="#dre"
            type="generation" refersTo="#publication"/>
  <eventRef eId="e4" date="2026-04-14" source="#dre"
            type="generation" refersTo="#entry-into-force"/>
</lifecycle>
```

Valores possíveis para `@type` (AKN canónico):

| `@type` | Significado |
|---|---|
| `generation` | Acto que gera ou modifica este ato (criação, alteração própria) |
| `amendment` | Alteração feita por outro acto |
| `repeal` | Revogação por outro acto |

Schematron, na fase publication, valida:

- A presença de `#publication`;
- Que a data de publicação é posterior ou igual à data de adopção.

## 9.5 `<analysis>` — modificações activas e passivas

Em AKN-PT v0.1.0 o bloco está estruturalmente presente mas vazio:

```xml
<analysis source="#dapl">
  <activeModifications/>
  <passiveModifications/>
</analysis>
```

A consolidação automática prevista para v0.2+ irá preencher:

- **`<activeModifications>`** com cada operação que este diploma faz a outros
  (substituições, inserções, supressões, renumerações).
- **`<passiveModifications>`** com referências reversas de cada diploma que
  modifica este (em geral, é o pipeline de consolidação a calcular).

A presença do elemento, mesmo vazio, garante compatibilidade forward.

## 9.6 Mapeamento ELI ↔ AKN-PT para metadados externos

Quando o ato é servido em HTML ou JSON-LD por uma plataforma (e.g. dre.pt),
os metadados ELI **DEVEM** ser expostos. A correspondência:

| Propriedade ELI | Origem AKN-PT |
|---|---|
| `eli:type_document` | `<FRBRsubtype value>` ou `<act @name>` |
| `eli:date_document` | `<FRBRWork>/<FRBRdate name="adoption">` |
| `eli:date_publication` | `<FRBRExpression>/<FRBRdate name="publication">` |
| `eli:date_entry_in_force` | `<lifecycle>` evento `entry-into-force` |
| `eli:date_no_longer_in_force` | (v0.2+, evento `repeal`) |
| `eli:passed_by` | `<FRBRWork>/<FRBRauthor>` |
| `eli:title` | `<preface>/<shortTitle>` |
| `eli:id_local` | `<FRBRnumber>` |
| `eli:language` | `<FRBRlanguage>` |
| `eli:is_about` | (v0.2+, classificação EuroVoc) |

## 9.7 Metadata mínimo vs. estendido

| Campo | Mínimo (obrigatório) | Estendido (recomendado v0.1; obrigatório v0.2+) |
|---|---|---|
| FRBR triple completo | ✓ | ✓ |
| `<FRBRsubtype>` | ✓ | ✓ |
| `<references>` com pelo menos autor e signatários | ✓ | + TLCConcept para conceitos definidos no diploma |
| `<lifecycle>` com adoption + publication | ✓ | + entry-into-force; + workflow steps |
| `<analysis>` (vazio) | ✓ | preenchido por consolidação automática |
| Classificação EuroVoc | — | em estudo para v0.2 |
| Pegada legislativa (Lei n.º 5-A/2026) | — | obrigatório para diplomas publicados após 27-07-2026 — modelo em estudo |

## 9.8 Como o validador trata cada bloco

| Bloco | XSD | Schematron drafting | Schematron review | Schematron publication |
|---|---|---|---|---|
| `<identification>` | estrutural | obrigatório | + coerência URI↔name | + coerência completa FRBR |
| `<references>` | estrutural | — | obrigatório | + verificar refs órfãs no documento |
| `<lifecycle>` | estrutural | — | obrigatório (adoption, publication) | + coerência cronológica |
| `<workflow>` | opcional | — | — | — |
| `<analysis>` | opcional (mas se presente, estrutura validada) | — | — | — |
| `<preface>` (docType, docNumber, shortTitle) | obrigatório | obrigatório | obrigatório | obrigatório |
