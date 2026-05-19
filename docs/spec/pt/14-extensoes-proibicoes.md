# 14. Extensões e construções proibidas

## 14.1 O que é uma extensão AKN-PT

Uma "extensão" é uso permitido (validado pelos schemas) que não é
obrigatório. Extensões podem ser usadas por sistemas que tirem partido
delas; sistemas que as ignorem continuam conformantes.

A v0.1.0 está deliberadamente conservadora em extensões — adiciona-se o
estritamente necessário; o resto fica para versões posteriores quando houver
caso de uso documentado.

## 14.2 Extensões permitidas em v0.1.0

| Extensão | Status | Notas |
|---|---|---|
| `<workflow>` em `<meta>` | Opcional | Para registar steps de workflow (e.g. consulta pública, votação por artigo) — usado em produção em v0.2+ |
| `<TLCObject>` em `<references>` | Permitido | Para objetos não cobertos pelas outras TLC (e.g. bens patrimoniais, processos) |
| `<TLCReference>` em `<references>` | Permitido | Para referências bibliográficas estruturadas |
| Atributo `@source` em qualquer elemento de `<meta>` | Obrigatório (todos os blocos `<meta>` têm `@source` que aponta para um actor) | Identifica quem produziu o metadado |
| `<FRBRversionNumber>` em `<FRBRExpression>` | Opcional | Recomendado: `1` para originária, incrementa em consolidações |
| Atributo `@class` em `<p>` | Permitido | Sugestão para renderização visual; sem semântica vinculativa |
| Comentários XML | Permitidos em qualquer posição | Não fazem parte do conteúdo; usados em corpus pedagógicos |

## 14.3 Construções proibidas

Construções que **não devem** ser usadas em AKN-PT v0.1.0:

| Construção | Razão da proibição |
|---|---|
| Outros elementos AKN não mencionados nestes schemas | O perfil é restritivo; usar elementos AKN base não cobertos quebra contratos de tooling |
| Namespace alternativo ao OASIS canónico | ADR-0005 fixou o namespace; uso de outros namespaces para o elemento raiz produz documento inválido |
| `<act @name>` fora do catálogo (cap. 4) | XSD rejeita |
| `<FRBRsubtype>` fora do catálogo | XSD rejeita |
| `<FRBRlanguage>` diferente de `por` | XSD rejeita; AKN-PT é monolíngue (cap. 10) |
| `<FRBRcountry>` fora de `pt`, `pt-20`, `pt-30` | XSD rejeita |
| Articulado com `<article>` em RCM ou Resolução da AR | Schematron rejeita; usar `<paragraph>` directo em `<body>` |
| `<signature role="promulgation">` em tipos sem promulgação (Portaria, RCM, Res-AR, Despacho normativo) | Schematron rejeita |
| eId duplicado no documento | Schematron rejeita |
| `<ref href="#xxx">` para eId inexistente | Schematron rejeita |
| URI ELI-PT mal formado | XSD rejeita por pattern; Schematron rejeita por coerência name↔type |
| Marcação de directiva UE com URI legado (e.g. `eur-lex.europa.eu/...`) em vez de ELI europeu | Recomendação forte (warning); v0.2+ pode tornar error |
| Conteúdo inline em maiúsculas SEM rationale | Recomendação estilística (não há regra automática) |

## 14.4 Anexos facsímile — recomendação

Para modelos de impresso, tabelas e formulários em anexos, **recomenda-se**
fortemente usar conteúdo estruturado (`<blockList>`, `<table>`, `<p>`) em
vez de imagem facsímile.

A imagem (`<img src="...">`) é permitida apenas quando o conteúdo é
graficamente impossível de capturar (e.g. mapa cartográfico, fórmula
matemática complexa, brasão).

Quando se usa imagem, **deve** estar acompanhada de descrição textual em
`@alt` que permita acessibilidade. A imagem em si é referenciada como
ficheiro externo, não embebida em base64.

## 14.5 Extensões a estudar para v0.2+

Catálogo de extensões em estudo para versões posteriores:

| Extensão | Motivação | Versão alvo |
|---|---|---|
| Classificação EuroVoc obrigatória | Alinhamento com AKN4EU; melhora discoverability | v0.2 |
| `<analysis>` preenchido por consolidação automática | Versões consolidadas | v0.2 |
| Tipo `acordao` (jurisprudência) com elemento raiz `<judgment>` | Cobertura da jurisprudência | v0.3 (artefacto próprio) |
| Tipo `comunicado` para atos pré-1976 | Cobertura legacy | v0.4 (com estudo histórico) |
| Pegada legislativa estruturada (Lei n.º 5-A/2026) | Obrigação legal | v0.2 |
| Multilingue para tratados bilingual | Caso de uso documentado | v0.2 |
| Granularidade abaixo da alínea (frase, palavra) | Para consolidação muito fina | v0.3+ |
| Suporte a Avisos de reguladores independentes (BdP, CMVM) | Cobertura completa do DR 2.ª série | TBD; depende de coordenação com reguladores |

## 14.6 Como propor uma extensão

Qualquer entidade pode propor uma extensão, abrindo issue no repositório
público do projecto. A proposta **deve** incluir:

1. Caso de uso concreto e número de documentos afectados.
2. Marcação XML proposta (com 2-3 exemplos completos).
3. Impacto em validação (XSD/Schematron).
4. Impacto em conformance (breaking change ou não).
5. Disponibilidade da entidade proponente para contribuir com testes ou
   implementação.

A Comissão Técnica AKN-PT (interinstitucional, ADR-0001) decide quais as
extensões a incorporar em cada versão.

## 14.7 Forward compatibility — promessa

Documentos válidos AKN-PT 0.1.0 **devem** continuar válidos em qualquer
versão 0.x posterior. Isto implica:

- Novos elementos opcionais podem ser adicionados; documentos antigos não os
  têm e continuam válidos.
- Novos tipos de ato podem ser adicionados; documentos antigos continuam a
  usar os tipos conhecidos.
- Novos subtipos podem ser adicionados; documentos antigos continuam a usar
  os subtipos pré-existentes.
- Restrições mais apertadas **não** são introduzidas em minor releases —
  ficam para major.

Mudanças que quebram compatibilidade ficam para uma futura versão major
(1.0.0), com período de transição documentado.
