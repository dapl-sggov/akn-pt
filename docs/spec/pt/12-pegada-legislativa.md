# 12. Pegada legislativa (Lei n.º 5-A/2026)

## 12.1 Enquadramento legal

A Lei n.º 5-A/2026 institui a obrigatoriedade da **pegada legislativa**
("legislative footprint") para todos os actos normativos publicados em
Portugal a partir de **27 de julho de 2026**.

A pegada legislativa é o registo estruturado, por cada diploma, de:

1. **Quem** iniciou a sua elaboração;
2. **Como** evoluiu (anteprojecto, consultas, audições, propostas de alteração);
3. **Quem contribuiu** com inputs externos (entidades empresariais, sindicais,
   representantes de interesses registados, cidadãos, peritos, órgãos
   consultivos);
4. **Quando** foi aprovado, promulgado, publicado e entrou em vigor.

O AKN-PT v0.1.1 materializa-a através do bloco `<akn-pt:workflow>` em
`<meta>`, com vocabulário controlado para fases e tipos de contributo. O
prefixo `akn-pt:` resolve para o namespace nacional
`http://eli.gov.pt/ns/akn-pt/1.0` (cf. **ADR-0011**) — extensão explícita
relativamente ao namespace OASIS canónico.

> **Migração v0.1.0 → v0.1.1:** se um documento foi marcado com `<workflow>`
> sem prefixo no namespace OASIS, é considerado **inválido**. Converter com
> `xsltproc validator/scripts/migrate-ns.xsl doc.akn.xml > doc.migrated.akn.xml`.
> O corpus institucional não tem documentos afectados; apenas pipelines
> externos que tenham emitido o formato antigo.

## 12.2 Estrutura `<akn-pt:workflow>`

```xml
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0/CSD17"
            xmlns:akn-pt="http://eli.gov.pt/ns/akn-pt/1.0">
  ...
  <meta>
    ...
    <akn-pt:workflow source="#dapl">
      <akn-pt:step eId="step_iniciativa" date="2026-04-15"
            refersTo="#iniciativa" source="#governo">
        <akn-pt:description><p>Decisão do Governo de iniciar a elaboração.</p></akn-pt:description>
      </akn-pt:step>
      <akn-pt:step eId="step_anteprojeto" date="2026-05-20"
            refersTo="#anteprojeto" source="#dapl">
        <akn-pt:description><p>Anteprojecto elaborado pela DAPL.</p></akn-pt:description>
      </akn-pt:step>
      <akn-pt:step eId="step_consulta_publica" date="2026-06-01"
            refersTo="#consulta-publica" source="#dapl">
        <akn-pt:description><p>Consulta pública aberta por 30 dias.</p></akn-pt:description>
        <akn-pt:input eId="input_cip" date="2026-06-15"
               source="#org-cip" type="contributo-consulta-publica">
          <akn-pt:description><p>Comentários da CIP sobre o artigo 8.º.</p></akn-pt:description>
          <akn-pt:affects href="#art_8"/>
        </akn-pt:input>
        <akn-pt:input eId="input_ces" date="2026-06-20"
               source="#org-ces" type="parecer-conselho-economico-social">
          <akn-pt:description><p>Parecer do CES.</p></akn-pt:description>
        </akn-pt:input>
      </akn-pt:step>
      <akn-pt:step eId="step_aprovacao_cm" date="2026-08-01"
            refersTo="#aprovacao-cm" source="#cm"/>
      <akn-pt:step eId="step_promulgacao" date="2026-08-10"
            refersTo="#promulgacao" source="#governo"/>
      <akn-pt:step eId="step_publicacao" date="2026-08-15"
            refersTo="#publicacao" source="#dre"/>
    </akn-pt:workflow>
  </meta>
```

O `<akn-pt:workflow>` é filho directo de `<meta>` (ao mesmo nível de
`<identification>`, `<references>`, `<lifecycle>` e `<analysis>`, que vivem
no namespace canónico OASIS).

## 12.3 `<step>` — atributos e sub-elementos

| Atributo | Obrigatório | Conteúdo |
|---|---|---|
| `@eId` | Sim | Identificador único snake_case (`step_xxx`) |
| `@date` | Sim | Data ISO 8601 do step |
| `@refersTo` | Sim | Valor do catálogo `WorkflowStepTarget` |
| `@source` | Sim | Actor responsável — referência interna a TLC actor |
| `@outcome` | Opcional | Resultado do step |

Sub-elementos opcionais:

- `<description>` — texto livre.
- `<input>` — zero ou mais contributos externos.

### Catálogo de step types (`WorkflowStepTarget`)

| Valor | Significado | Tipos onde aparece |
|---|---|---|
| `#iniciativa` | Decisão de iniciar a elaboração | Todos |
| `#anteprojeto` | Elaboração de anteprojecto | DL, Lei, Portaria, RCM |
| `#consulta-publica` | Consulta pública formal | DL (frequente), Lei |
| `#consulta-aberta` | Discussão informal | Qualquer |
| `#consultas-obrigatorias` | Pareceres institucionais obrigatórios | Conforme matéria |
| `#discussao-na-generalidade` | Discussão na generalidade em plenário | Lei, Decreto AR, Res AR |
| `#discussao-na-especialidade` | Discussão na especialidade (Comissão) | Lei, Decreto AR |
| `#audicao-publica` | Audição pública parlamentar | Lei |
| `#votacao-final-global` | Votação final global em plenário | Lei, Decreto AR, Res AR |
| `#aprovacao-cm` | Aprovação em Conselho de Ministros | DL, RCM |
| `#aprovacao-ar` | Aprovação em plenário da AR | Lei, Decreto AR, Res AR |
| `#promulgacao` | Promulgação | DL, Lei, Decreto AR, DLR, DRR |
| `#assinatura` | Assinatura ministerial | Portaria, Despacho normativo |
| `#publicacao` | Publicação no DR | Todos |

## 12.4 `<input>` — registo de contributo externo

```xml
<input eId="input_cip" date="2026-06-15"
       source="#org-cip"
       type="contributo-consulta-publica">
  <description><p>Comentários da CIP sobre o artigo 8.º.</p></description>
  <affects href="#art_8"/>
</input>
```

| Atributo | Obrigatório | Conteúdo |
|---|---|---|
| `@eId` | Sim | Identificador único (`input_xxx`) |
| `@date` | Sim | Data ISO 8601 em que o contributo foi recebido |
| `@source` | Sim | TLCOrganization ou TLCPerson em `<references>` |
| `@type` | Sim | Valor do catálogo `ContributionType` |

Sub-elementos opcionais:

- `<description>` — texto livre descrevendo o contributo.
- `<affects href>` — uma ou mais referências para `eId`s do articulado
  onde o contributo teve impacto.

### Catálogo de contribution types

| Valor | Significado |
|---|---|
| `parecer-tecnico` | Parecer técnico interno ou externo |
| `parecer-juridico` | Parecer jurídico |
| `parecer-obrigatorio` | Parecer obrigatório por lei |
| `parecer-facultativo` | Parecer facultativo |
| `contributo-consulta-publica` | Contributo em consulta pública formal |
| `contributo-consulta-aberta` | Contributo em discussão informal |
| `contributo-audicao` | Contributo em audição parlamentar |
| `proposta-de-alteracao` | Proposta de alteração ao texto |
| `proposta-de-aditamento` | Proposta de aditamento |
| `proposta-de-eliminacao` | Proposta de eliminação |
| `representacao-interesse` | Lobby registado (Lei n.º 5-A/2026 específico) |
| `parecer-tribunal-de-contas` | Parecer do Tribunal de Contas |
| `parecer-conselho-economico-social` | Parecer do CES |

## 12.5 Obrigatoriedade

| Acto | Pegada obrigatória? |
|---|---|
| Publicado **antes** de 2026-07-27 | Opcional |
| Publicado **a partir** de 2026-07-27 | **Obrigatória** |

Para actos obrigatoriamente sujeitos a pegada legislativa, o Schematron
(fase `publication`) impõe:

- Presença de `<workflow>` em `<meta>`;
- Pelo menos um `<step refersTo="#iniciativa">`;
- Pelo menos um `<step>` de aprovação (`#aprovacao-cm`, `#aprovacao-ar` ou
  `#assinatura`);
- Pelo menos um `<step refersTo="#publicacao">`.

A omissão de qualquer destes elementos em acto pós-2026-07-27 causa **error**
em validação `publication`.

## 12.6 Actores típicos da pegada legislativa

Adicionais aos actores comuns (Governo, CM, AR, INCM, DRE), a pegada
legislativa requer declarar em `<references>` os contribuintes externos.
Convenções de eId:

| Categoria | eId convencional |
|---|---|
| Confederações empresariais | `org-cip`, `org-cap`, `org-ccp`, `org-cta` |
| Confederações sindicais | `org-cgtp`, `org-ugt` |
| Órgãos consultivos | `org-ces` (CES), `tribunal-de-contas` |
| Reguladores independentes (quando consultados) | `org-anacom`, `org-ers`, etc. |
| Associações profissionais | `org-ordem-advogados`, `org-ordem-medicos`, etc. |
| Cidadãos individuais (em consulta pública identificada) | `pessoa-{slug}-{YYYY-MM}` |
| Cidadãos agregados (consulta pública anónima/agregada) | `publico-geral` (TLCOrganization) |
| Representantes de interesses (registo de transparência) | `lobby-{slug}` |

## 12.7 Boas práticas

1. **Granularidade adequada.** 4 a 12 steps para um diploma típico. Mais que
   isso fragmenta sem ganho informativo.
2. **`<input>` para cada contributo identificável.** Se uma entidade enviou
   contributo, deve aparecer.
3. **`<affects>` quando possível.** Aumenta significativamente o valor da
   pegada — permite tracear quem influenciou que artigo concreto.
4. **Datas coerentes.** Schematron emite warning se um `<input>` tem data
   posterior ao seu step pai.
5. **Actores declarados em `<references>`.** Cada `<input>/@source` deve
   resolver para um TLC actor.
6. **Texto descritivo conciso e objectivo.** `<description>` é para auditoria,
   não para advocacia — descrever o que o contributo disse, não defender se
   estava certo.

## 12.8 Pegada e consolidação

A pegada legislativa de um diploma **mantém-se associada à Expression
originária**. Versões consolidadas posteriores herdam a pegada da Expression
original, mas **não acumulam** pegadas de diplomas alteradores — esses têm a
sua própria pegada.

Para auditoria de "quem influenciou esta versão consolidada?", o consumidor
agrega:

- A pegada da Expression originária do diploma;
- As pegadas de cada diploma alterador subsequente.

Esta agregação é trabalho de leitura analítica (futuro tooling); o AKN-PT
v0.1.0 garante apenas que a informação está disponível em cada documento.

## 12.9 Pegada e jurisdições regionais

DLR e DRR seguem o mesmo modelo. Os actores típicos podem incluir entidades
regionais (Conselho Económico e Social Regional, associações regionais,
órgãos consultivos regionais). A obrigatoriedade da Lei n.º 5-A/2026
aplica-se também a actos regionais publicados a partir de 27-07-2026.

## 12.10 O que a pegada legislativa NÃO faz

- **Não substitui** o procedimento institucional — apenas o regista.
- **Não classifica** a qualidade ou influência dos contributos.
- **Não estabelece** prioridades entre contributos contraditórios.
- **Não responsabiliza** pela ponderação final dos contributos — essa é do
  autor político do diploma.

O AKN-PT é infraestrutura técnica para a transparência; a transparência
substantiva é matéria política.

## 12.11 Schematron — invariantes consolidadas

| Regra | Severity | Fase |
|---|---|---|
| Acto com publicação ≥ 2026-07-27 deve ter `<workflow>` | error | publication |
| `<workflow>` deve conter `<step refersTo="#iniciativa">` | error | publication |
| `<workflow>` deve conter step de aprovação | error | publication |
| `<workflow>` deve conter `<step refersTo="#publicacao">` | error | publication |
| `<input>/@source` deve começar por `#` | error | publication |
| `<input>/@date` posterior a `<step>/@date` pai | warning | publication |

Mais detalhe técnico em
[`mapping/v0.1.0/_legislative-footprint.md`](../../../mapping/v0.1.0/_legislative-footprint.md)
e no Schematron source (`schema/schematron/akn-pt-rules.sch`, pattern
`legislative-footprint`).

## 12.12 Apresentação no validador

O validador (Artefacto 7), no modo verbose, emite um sumário da pegada
legislativa quando `<workflow>` está presente:

```
Pegada legislativa:
  6 steps; 2 inputs externos
  Steps: iniciativa, anteprojeto, consulta-publica, aprovacao-cm, promulgacao, publicacao
  Contributos:
    - CIP (contributo-consulta-publica, 2026-06-15) — afecta art_8
    - Conselho Económico e Social (parecer-conselho-economico-social, 2026-06-20)
```

Este sumário é útil para auditoria rápida antes da publicação no DR.

## 12.13 Limitações conhecidas (v0.1.0)

1. **`<affects>` aponta para eIds do articulado final**, não para versões
   intermédias do texto — tracear "a CIP propôs X mas ficou Y" é matéria de
   `<analysis>` (v0.2+).
2. **Sem link estrutural directo entre `<input>` e `<eventRef>`** em
   `<lifecycle>` — a coerência cronológica é validada por Schematron mas a
   ligação é via convenção, não via atributo.
3. **`representacao-interesse`** usa o modelo genérico de `<input>`; campos
   adicionais (número do registo de transparência, valor do contrato com o
   lobby) ficam para v0.1.1 conforme o regulamento de execução da Lei
   n.º 5-A/2026 for publicado.
4. **Sem agregação automática** de contributos por categoria — é trabalho de
   leitura analítica, não de validação.

Ver `mapping/v0.1.0/_legislative-footprint.md` para o detalhe canónico.
