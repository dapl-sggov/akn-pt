# Mapeamento — bloco `<meta>` canónico AKN-PT

O bloco `<meta>` é igual para todos os tipos de ato (com pequenas variações em
`<FRBRsubtype>` e em `<lifecycle>`). Esta ficha define a forma canónica
obrigatória; cada ficha de tipo limita-se a indicar particularidades.

## Estrutura

```xml
<meta>
  <identification source="#dapl">
    <FRBRWork>...</FRBRWork>
    <FRBRExpression>...</FRBRExpression>
    <FRBRManifestation>...</FRBRManifestation>
  </identification>
  <references source="#dapl">
    <TLCOrganization .../>
    <TLCPerson .../>
    <TLCRole .../>
    <TLCConcept .../>
    <TLCLocation .../>
  </references>
  <lifecycle source="#dapl">
    <eventRef ... />
  </lifecycle>
  <workflow source="#dapl">         <!-- opcional, v0.2+ -->
    <step .../>
  </workflow>
  <analysis source="#dapl">         <!-- opcional, vazio na v0.1 -->
    <activeModifications/>
    <passiveModifications/>
  </analysis>
</meta>
```

## FRBR triple

### FRBRWork — a obra abstracta (o "decreto-lei n.º 75/2026" como tal)

| Elemento | Valor canónico | Obrigatório |
|---|---|---|
| `<FRBRthis>` | `https://eli.gov.pt/{type}/{year}/{number}/pt/!main` | ✓ |
| `<FRBRuri>` | `https://eli.gov.pt/{type}/{year}/{number}/pt` | ✓ |
| `<FRBRdate name="adoption">` | Data de aprovação em CM/AR (`YYYY-MM-DD`) | ✓ |
| `<FRBRauthor href="#xxx">` | Referência para `<TLCOrganization>` em `<references>` | ✓ |
| `<FRBRcountry value>` | `pt` (nacional), `pt-20` (Açores), `pt-30` (Madeira) | ✓ |
| `<FRBRsubtype value>` | Variante do tipo (e.g. `dec-lei-ordinario`, `dec-lei-autorizado`) | ✓ se variante |
| `<FRBRnumber value>` | Número do ato (e.g. `75`); redundante com FRBRuri mas útil para tooling | recomendado |

### FRBRExpression — a versão linguística e temporal

| Elemento | Valor canónico | Obrigatório |
|---|---|---|
| `<FRBRthis>` | `{uri}@{point-in-time}/!main` | ✓ |
| `<FRBRuri>` | `{uri}@{point-in-time}` | ✓ |
| `<FRBRdate name="publication">` | Data de publicação em DR (`YYYY-MM-DD`) | ✓ |
| `<FRBRauthor href>` | Mesmo que Work, normalmente | ✓ |
| `<FRBRlanguage language>` | `por` (ISO 639-3) | ✓ |
| `<FRBRversionNumber>` | Versão consolidada; `1` para originária | recomendado |

### FRBRManifestation — o ficheiro físico

| Elemento | Valor canónico | Obrigatório |
|---|---|---|
| `<FRBRthis>` | `{expression-uri}/!main.xml` | ✓ |
| `<FRBRuri>` | `{expression-uri}.xml` | ✓ |
| `<FRBRdate name="publication">` | Data de manifestação (= publicação) | ✓ |
| `<FRBRauthor href="#dre">` | INCM/DR como manifestador | ✓ |
| `<FRBRformat value>` | `application/akn+xml; profile=akn-pt-1.0` | ✓ |

## `<references>` — actores nomeados

Tudo o que o documento refere por `href="#xxx"` tem de existir em `<references>`.

| Tipo TLC | Uso típico | eId convencional |
|---|---|---|
| `TLCOrganization` | Governo, Ministérios, AR, INCM, Conselho de Ministros, agências | `governo`, `ar`, `ministerio-financas`, `cm`, `dre`, `dapl` |
| `TLCRole` | Primeiro-Ministro, PR, Presidente da AR, Ministro de X | `primeiro-ministro`, `presidente-republica`, `presidente-ar`, `ministro-financas` |
| `TLCPerson` | Nome próprio de signatário | `pessoa-pm-2026-05`, `pessoa-pr-2026-03` (com data desambiguadora) |
| `TLCConcept` | Conceitos jurídicos importantes (e.g. "autoridade competente" no diploma) | snake_case PT |
| `TLCLocation` | Lisboa, Açores, Madeira, etc. | `pt`, `pt-20`, `pt-30`, `lisboa` |
| `TLCEvent` | Eventos lifecycle | `approval-cm`, `promulgation`, `publication`, `entry-into-force` |

Atributo `href` aponta para a ontologia AKN canónica: `/akn/ontology/{type}/{country}/{slug}`.
Atributo `showAs` é o nome legível em PT.

## `<lifecycle>` — eventos no tempo de vida do ato

Eventos canónicos para diplomas PT, na ordem em que ocorrem:

| `type` (AKN) | `refersTo` (AKN-PT) | Quando | Aplica-se a |
|---|---|---|---|
| `generation` | `#approval-cm` | Aprovação em Conselho de Ministros | DL, RCM |
| `generation` | `#approval-ar` | Aprovação em plenário da AR | Lei, Decreto AR, Resolução AR |
| `generation` | `#promulgation` | Promulgação pelo Presidente da República | DL, Lei, Decreto AR |
| `generation` | `#signature` | Assinatura ministerial | Portaria, Despacho normativo |
| `generation` | `#countersignature` | Referenda do PM | DL, Lei (quando aplicável) |
| `generation` | `#publication` | Publicação no DR | Todos |
| `generation` | `#entry-into-force` | Início de vigência | Todos |
| `amendment` | (vazio) | Cada alteração subsequente | Quando aplicável (v0.2+) |
| `repeal` | (vazio) | Revogação | Quando aplicável (v0.2+) |

Cada evento tem `eId`, `date`, `source` (FK para `<references>`).

## `<analysis>` — modificações activas e passivas

Na v0.1.0 fica **vazio mas presente** (`<analysis source="#dapl"><activeModifications/><passiveModifications/></analysis>`).
Modificações são populadas a partir do trabalho de consolidação automática
(v0.2+). A presença do elemento facilita a evolução sem mudança de schema.

## Schematron — invariantes deste bloco

| Regra | Severity |
|---|---|
| FRBRWork.FRBRuri deve corresponder ao template ELI-PT para o tipo | error |
| FRBRExpression.FRBRuri deve conter `@YYYY-MM-DD` se houver versão consolidada | error |
| `<FRBRcountry value>` deve ser `pt`, `pt-20` ou `pt-30` | error |
| `<FRBRlanguage language>` deve ser `por` | error |
| Todo `href="#xxx"` no documento deve resolver para um `eId` em `<references>` | error |
| `<lifecycle>` deve ter no mínimo `generation`+`publication` para qualquer ato publicado | error |
| Datas em formato ISO 8601 | error |
| Datas em `<lifecycle>` devem ser cronologicamente coerentes | warning |
