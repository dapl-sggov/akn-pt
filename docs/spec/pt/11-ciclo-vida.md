# 11. Ciclo de vida, alterações e consolidação

## 11.1 Vida de um ato — visão de conjunto

```
                    ┌───────────────┐
                    │ Redação       │ (drafting; SmartLegis)
                    │ Expression  ε │
                    └───────────────┘
                            │
                            ▼ (envio para CM / AR)
                    ┌───────────────┐
                    │ Aprovação     │ event: approval-cm | approval-ar
                    └───────────────┘
                            │
                            ▼ (envio ao PR)
                    ┌───────────────┐
                    │ Promulgação   │ event: promulgation (DL, Lei, Decreto AR, DLR, DRR)
                    └───────────────┘
                            │
                            ▼ (envio à DR)
                    ┌───────────────┐
                    │ Publicação    │ event: publication
                    │ Expression  1 │ (versão originária)
                    └───────────────┘
                            │
                            ▼ (decurso da vacatio legis)
                    ┌───────────────┐
                    │ Vigência      │ event: entry-into-force
                    └───────────────┘
                            │
                            ▼ (ao longo dos anos)
                    ┌───────────────┐
                    │ Alterações    │ active/passive modifications
                    │ Expressions 2,3,… │
                    └───────────────┘
                            │
                            ▼ (eventualmente)
                    ┌───────────────┐
                    │ Revogação     │ event: repeal
                    └───────────────┘
```

A Expression `ε` (de "draft", em fase de redação) não é publicada — vive em
ambiente SmartLegis sem URI ELI-PT. A primeira Expression publicada (1) é a
versão originária. Cada alteração subsequente produz uma nova Expression.

## 11.2 Alteração — modelo conceptual

Quando o ato A altera o ato B:

1. O ato A (alterador) é, ele próprio, um `<act>` AKN-PT distinto, com a sua
   própria Work, Expression e Manifestation.
2. O ato A, na sua `<analysis>/<activeModifications>`, regista o que faz a B
   (e a outros, se múltiplos diplomas alterados).
3. O ato B mantém:
   - A sua **Expression originária** inalterada (URI permanente);
   - Uma **nova Expression consolidada**, com `{point-in-time}` igual à data
     de entrada em vigor das alterações, contendo o texto incorporando o que
     A determinou.
4. Em ambas as Expressions de B, o bloco `<analysis>/<passiveModifications>`
   regista que A alterou aquele ato (com referência reversa).

## 11.3 Alteração — marcação no diploma alterador

```xml
<article eId="art_2">
  <num>Artigo 2.º</num>
  <heading>Alteração ao Decreto-Lei n.º 22/2025, de 5 de novembro</heading>
  <paragraph eId="art_2__para_1">
    <intro>
      <p>São alterados os artigos 3.º e 5.º do <ref href="https://data.dre.pt/eli/dec-lei/22/2025/11/05">Decreto-Lei n.º 22/2025, de 5 de novembro</ref>, que passam a ter a seguinte redação:</p>
    </intro>
    <quotedStructure>
      <article eId="quoted__art_3">
        <num>Artigo 3.º</num>
        <heading>...</heading>
        <paragraph eId="quoted__art_3__para_1">
          <content><p>Nova redação ...</p></content>
        </paragraph>
      </article>
      <article eId="quoted__art_5">
        <num>Artigo 5.º</num>
        <heading>...</heading>
        ...
      </article>
    </quotedStructure>
  </paragraph>
</article>
```

Notas:

- A `<quotedStructure>` contém o texto novo que vai substituir o texto antigo
  no ato alterado.
- Os eIds da `<quotedStructure>` usam prefixo `quoted__` para não colidir com
  os eIds do diploma alterador.
- O subtipo do alterador inclui `-alterador` (e.g. `dec-lei-alterador`) — é
  subtipo cumulativo.

## 11.4 Republicação técnica

Em alterações substanciais, a prática PT inclui a republicação integral do
diploma alterado, em anexo:

```xml
<attachments>
  <attachment eId="anx_1">
    <heading>Anexo (a que se refere o n.º 1 do artigo 5.º)</heading>
    <subheading>Decreto-Lei n.º 22/2025, de 5 de novembro (Republicação)</subheading>
    <mainBody>
      <article eId="rep__art_1">
        <num>Artigo 1.º</num>
        <heading>Objeto</heading>
        <paragraph eId="rep__art_1__para_1">
          <content><p>...</p></content>
        </paragraph>
      </article>
      <article eId="rep__art_2">
        ...
      </article>
      <!-- toda a estrutura do diploma republicado, com eIds prefixados rep__ -->
    </mainBody>
  </attachment>
</attachments>
```

Convenção:

- Prefixo `rep__` nos eIds da republicação evita colisão com o diploma
  alterador.
- A republicação **não** é uma Expression separada do diploma original — é
  conteúdo do alterador.
- A Expression consolidada do diploma original, gerada por consolidação
  automática (v0.2+), recupera estes textos.

## 11.5 Artigo X.º-A — inserção entre artigos

Quando um diploma alterador insere um novo artigo entre o 5.º e o 6.º do
diploma alterado, a convenção PT designa-o "Artigo 5.º-A". A marcação:

```xml
<article eId="art_5_a">
  <num>Artigo 5.º-A</num>
  <heading>Disposição inserida</heading>
  <paragraph eId="art_5_a__para_1">
    <content><p>...</p></content>
  </paragraph>
</article>
```

- eId: minúsculas + underscore (`art_5_a`), não hífen (`art_5-a`).
- Texto do `<num>`: literal "Artigo 5.º-A".
- Posição em `<body>`: imediatamente após `art_5`, antes de `art_6`.

Cadeias longas (5.º-A, 5.º-B, 5.º-C…) seguem o mesmo padrão: `art_5_a`,
`art_5_b`, `art_5_c`. O sufixo é sempre lowercase ASCII.

## 11.6 Renumeração pós-alteração

Quando uma alteração renumera artigos do diploma alterado (e.g. "o actual
artigo 10.º passa a artigo 12.º"):

- O diploma alterador descreve a renumeração em texto natural no articulado.
- A consolidação automática (v0.2+) regista a renumeração em
  `<analysis>/<activeModifications>/<renumbering>` (elemento canónico AKN).
- No texto consolidado da Expression posterior, os eIds **seguem a nova
  numeração**; o mapeamento entre as numerações antiga e nova fica em
  `<temporalGroup>` (v0.2+).

Em v0.1.0, a representação estruturada da renumeração ainda não é
obrigatória — basta descrever no articulado.

## 11.7 Retificação

Declaração de Retificação corrige erro material em diploma já publicado.
Em AKN-PT v0.1.0:

- Não é tipo independente coberto pelo `@name`;
- Marca-se como instância em `<analysis>/<activeModifications>` no diploma
  alvo (quando a consolidação for produzida em v0.2+);
- O texto da declaração de retificação fica em corpus separado, sob tipo a
  definir em v0.2.

A versão consolidada do diploma original gerada após a publicação da
retificação tem `<FRBRExpression>` com `{point-in-time}` igual à data da
publicação da declaração de retificação.

## 11.8 Vacatio legis

Período entre publicação e entrada em vigor. Marcação:

- Artigo final do diploma especifica a vigência (texto natural):

  ```xml
  <article eId="art_15">
    <num>Artigo 15.º</num>
    <heading>Entrada em vigor</heading>
    <paragraph eId="art_15__para_1">
      <content><p>O presente decreto-lei entra em vigor 30 dias após a data da sua publicação.</p></content>
    </paragraph>
  </article>
  ```

- `<lifecycle>` regista a data calculada:

  ```xml
  <eventRef eId="e4" date="2026-04-14" source="#governo"
            type="generation" refersTo="#entry-into-force"/>
  ```

Schematron (na fase publication) compara as duas — se o texto natural
indica "30 dias" e a data calculada não bate, emite warning.

## 11.9 Revogação

Quando o ato A revoga o ato B:

- O ato A é um `<act>` AKN-PT normal, com uma cláusula de revogação no
  articulado.
- O ato B mantém o seu URI Work, mas:
  - A última Expression em vigor é a versão imediatamente antes da revogação;
  - `<lifecycle>` da última Expression regista evento `repeal` com a data;
  - `<analysis>/<passiveModifications>` regista que A revogou (v0.2+).

Em v0.1.0, a revogação é descrita no articulado do ato A (cláusula de
revogação) e a actualização do ato B fica para a consolidação automática
(v0.2+).

## 11.10 Consolidação automática (v0.2+)

A consolidação automática é o motor que, dado:

- O texto da Expression originária do ato B,
- E todas as `<activeModifications>` de todos os actos alteradores subsequentes,

produz a Expression consolidada actual do ato B.

Em AKN-PT v0.1.0, este motor não está implementado, mas o schema está pronto
para o receber — daí a presença obrigatória de `<analysis>` (vazio) e o uso
sistemático de `<quotedStructure>` nos alteradores.

A consolidação automática é tópico próprio para v0.2 ou v0.3.
