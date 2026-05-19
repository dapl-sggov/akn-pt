# Pegada legislativa — mapping AKN-PT (Lei n.º 5-A/2026)

A Lei n.º 5-A/2026 torna a pegada legislativa obrigatória, com efeito a 27 de
julho de 2026. O AKN-PT v0.1.0 materializa-a através de um bloco `<workflow>`
estruturado dentro de `<meta>`, com vocabulário controlado para fases do
procedimento e tipos de contributo.

## Modelo conceitual

A pegada legislativa responde a quatro perguntas, para cada diploma:

1. **Quando** começou a vida deste diploma? (iniciativa)
2. **Como** evoluiu? (anteprojecto, consultas, audições, propostas de alteração)
3. **Quem** contribuiu para o seu conteúdo final? (entidades externas com inputs)
4. **Quando** entrou em vigor? (aprovação, promulgação, publicação)

Em AKN-PT, as respostas vivem em três blocos coordenados de `<meta>`:

- **`<lifecycle>`** — eventos institucionais (aprovação, promulgação, publicação) — já existente.
- **`<workflow>`** — fases do procedimento legislativo (iniciativa → anteprojeto → consultas → aprovação → promulgação → publicação).
- **`<workflow>/<step>/<input>`** — cada contributo externo no decurso de um step.

## Estrutura `<workflow>`

```xml
<workflow source="#dapl">
  <step eId="step_iniciativa" date="2026-04-15"
        refersTo="#iniciativa" source="#governo">
    <description><p>Decisão do Governo de iniciar a elaboração.</p></description>
  </step>
  <step eId="step_anteprojeto" date="2026-05-20"
        refersTo="#anteprojeto" source="#dapl">
    <description><p>Anteprojecto elaborado pela DAPL.</p></description>
  </step>
  <step eId="step_consulta_publica" date="2026-06-01"
        refersTo="#consulta-publica" source="#dapl">
    <description><p>Consulta pública aberta por 30 dias.</p></description>
    <input eId="input_cip" date="2026-06-15"
           source="#org-cip" type="contributo-consulta-publica">
      <description><p>Comentários da CIP sobre o artigo 8.º.</p></description>
      <affects href="#art_8"/>
    </input>
    <input eId="input_ces" date="2026-06-20"
           source="#org-ces" type="parecer-conselho-economico-social">
      <description><p>Parecer do CES.</p></description>
    </input>
  </step>
  <step eId="step_aprovacao_cm" date="2026-08-01"
        refersTo="#aprovacao-cm" source="#cm"/>
  <step eId="step_promulgacao" date="2026-08-10"
        refersTo="#promulgacao" source="#governo"/>
  <step eId="step_publicacao" date="2026-08-15"
        refersTo="#publicacao" source="#dre"/>
</workflow>
```

## `<step>` — atributos

| Atributo | Obrigatório | Conteúdo |
|---|---|---|
| `@eId` | Sim | Identificador único snake_case (`step_xxx`) |
| `@date` | Sim | Data ISO 8601 em que o step ocorreu |
| `@refersTo` | Sim | Valor do catálogo `WorkflowStepTarget` |
| `@source` | Sim | Actor responsável pelo step — referência interna a TLC actor |
| `@outcome` | Opcional | Resultado do step (e.g. `#approval-cm` em lifecycle) |

Sub-elementos opcionais:

- `<description>` — texto livre descrevendo o que aconteceu no step.
- `<input>` — zero ou mais contributos externos (ver abaixo).

## Catálogo de step types (`WorkflowStepTarget`)

| Valor | Significado | Aplica-se tipicamente a |
|---|---|---|
| `#iniciativa` | Decisão de iniciar a elaboração | Todos os tipos |
| `#anteprojeto` | Elaboração de anteprojecto | DL, Lei, Portaria, RCM |
| `#consulta-publica` | Consulta pública formal | DL (frequente), Lei |
| `#consulta-aberta` | Discussão informal (sem prazo, sem registo formal) | Qualquer |
| `#consultas-obrigatorias` | Pareceres institucionais obrigatórios (e.g. ANMP, CES) | Conforme matéria |
| `#discussao-na-generalidade` | Discussão na generalidade em plenário | Lei, Decreto AR, Res AR |
| `#discussao-na-especialidade` | Discussão na especialidade (Comissão) | Lei (frequente), Decreto AR |
| `#audicao-publica` | Audição pública parlamentar | Lei |
| `#votacao-final-global` | Votação final global em plenário | Lei, Decreto AR, Res AR |
| `#aprovacao-cm` | Aprovação em Conselho de Ministros | DL, RCM |
| `#aprovacao-ar` | Aprovação em plenário da AR | Lei, Decreto AR, Res AR |
| `#promulgacao` | Promulgação | DL, Lei, Decreto AR, DLR, DRR |
| `#assinatura` | Assinatura ministerial | Portaria, Despacho normativo, RCM |
| `#publicacao` | Publicação no DR | Todos |

## `<input>` — atributos

| Atributo | Obrigatório | Conteúdo |
|---|---|---|
| `@eId` | Sim | Identificador único (`input_xxx`) |
| `@date` | Sim | Data ISO 8601 em que o contributo foi recebido |
| `@source` | Sim | Actor contribuinte — referência interna a TLCOrganization ou TLCPerson |
| `@type` | Sim | Valor do catálogo `ContributionType` |

Sub-elementos opcionais:

- `<description>` — texto livre descrevendo o conteúdo do contributo.
- `<affects>` — uma ou mais referências (`@href="#eId"`) a artigos/partes do diploma onde o contributo teve impacto.

## Catálogo de contribution types (`ContributionType`)

| Valor | Significado |
|---|---|
| `parecer-tecnico` | Parecer técnico interno ou externo |
| `parecer-juridico` | Parecer jurídico |
| `parecer-obrigatorio` | Parecer obrigatório por lei (e.g. de entidade administrativa específica) |
| `parecer-facultativo` | Parecer facultativo |
| `contributo-consulta-publica` | Contributo recebido em consulta pública |
| `contributo-consulta-aberta` | Contributo recebido em discussão informal |
| `contributo-audicao` | Contributo em audição parlamentar |
| `proposta-de-alteracao` | Proposta de alteração ao texto |
| `proposta-de-aditamento` | Proposta de aditamento |
| `proposta-de-eliminacao` | Proposta de eliminação |
| `representacao-interesse` | Representação de interesse (lobby registado — Lei n.º 5-A/2026 específico) |
| `parecer-tribunal-de-contas` | Parecer do Tribunal de Contas |
| `parecer-conselho-economico-social` | Parecer do CES |

## Obrigatoriedade

Por força do art. X da Lei n.º 5-A/2026, e validado pelo Schematron na fase
`publication`:

| Acto | Obrigatório? |
|---|---|
| Acto publicado **antes** de 2026-07-27 | `<workflow>` é opcional |
| Acto publicado **a partir** de 2026-07-27 | `<workflow>` é **obrigatório** com pelo menos: |
|  | — um step `#iniciativa` |
|  | — um step de aprovação (`#aprovacao-cm`, `#aprovacao-ar` ou `#assinatura`) |
|  | — um step `#publicacao` |

A omissão de qualquer destes elementos em acto pós-2026-07-27 causa **error**
na fase `publication` do Schematron.

## Boas práticas

1. **Granularidade adequada.** Não há vantagem em ter 50 steps; recomenda-se entre 4 e 12 por diploma típico.
2. **`<input>` para cada contributo identificável.** Se uma entidade enviou contributo, deve aparecer como `<input>`. Se um conjunto de cidadãos contribuiu em consulta pública sem identificação individual, registar como um `<input>` agregado com `@source="#publico-geral"`.
3. **`<affects>` quando possível.** Aumenta o valor da pegada — permite tracear quem influenciou que artigo concreto.
4. **Datas coerentes.** Schematron emite warning se um `<input>` tem data posterior ao seu step pai.
5. **Actores em `<references>`.** Todo `<input>/@source` deve resolver para uma TLCOrganization ou TLCPerson declarada em `<references>`. Os actores tipicamente novos para pegada legislativa são:
   - `TLCOrganization eId="org-cip"` — CIP (Confederação Empresarial de Portugal)
   - `TLCOrganization eId="org-cgtp"` — CGTP-IN
   - `TLCOrganization eId="org-ces"` — Conselho Económico e Social
   - `TLCOrganization eId="tribunal-de-contas"` — Tribunal de Contas
   - `TLCOrganization eId="publico-geral"` — agregação de contributos públicos não-identificados
   - `TLCPerson eId="pessoa-xxx-yyyy-mm"` — pessoas singulares que contribuíram (com desambiguação por mês)

## Schematron — invariantes

| Regra | Severity | Phase |
|---|---|---|
| Acto com publicação ≥ 2026-07-27 deve ter `<workflow>` | error | publication |
| `<workflow>` deve conter step `#iniciativa` | error | publication |
| `<workflow>` deve conter step de aprovação (`#aprovacao-cm`/`-ar`/`#assinatura`) | error | publication |
| `<workflow>` deve conter step `#publicacao` | error | publication |
| `<input>/@source` deve começar por `#` (referência a TLC actor) | error | publication |
| `<input>/@date` posterior a `<step>/@date` pai | warning | publication |

## Limitações conhecidas (v0.1.0)

1. **`<affects>` aponta para eIds do articulado final, não para versões intermédias.** Tracear que "a CIP propôs X mas o texto final ficou Y" é matéria de v0.2+ (relacionar com `<analysis>`).
2. **Sem cadeia entre `<input>` e `<eventRef>` em `<lifecycle>`.** A coerência cronológica entre os dois blocos é validada por Schematron, mas não há link estrutural directo.
3. **Lobby registado** (`representacao-interesse`) usa o mesmo modelo dos outros contributos — não há campos extra (e.g. número do registo de transparência). Suficiente para v0.1.0 da pegada; reforço em v0.1.1 se a Lei n.º 5-A/2026 (texto final) impuser campos adicionais.
4. **Sem agregação automática** (e.g. "quantas entidades empresariais contribuíram?"). É trabalho de leitura analítica do bloco `<workflow>`, fora do escopo de validação técnica.

## Como o validador apresenta a pegada

O validador (Artefacto 7), no modo verbose, emite um resumo da pegada
legislativa quando `<workflow>` está presente:

```
Pegada legislativa:
  6 steps; 2 inputs externos
  Steps: iniciativa, anteprojeto, consulta-publica, aprovacao-cm, promulgacao, publicacao
  Contributos:
    - CIP (contributo-consulta-publica, 2026-06-15) — afecta art_8
    - Conselho Económico e Social (parecer-conselho-economico-social, 2026-06-20)
```

Este sumário é útil para auditoria rápida da pegada antes da publicação no DR.
