# ADR-0000 — Agenda de decisões conjuntas SGGov–INCM

- **Estado:** Accepted
- **Data:** 24/07/2026
- **Âmbito:** meta-ADR. Não decide matéria substantiva: enumera, por ordem, as
  decisões que a construção do perfil AKN-PT obrigou a tomar e assinala quais
  se podem fechar já, quais dependem da reunião com a Imprensa Nacional-Casa da
  Moeda (INCM) e quais ficam faseadas.

## Contexto

A Suporte à Decisão - DAPL construiu uma versão de teste do AKN-PT — o perfil
nacional português do Akoma Ntoso, norma OASIS LegalDocML. Esse exercício
funcionou como levantamento de requisitos: cada obstáculo prático revelou uma
decisão que qualquer perfil nacional tem de tomar no arranque.

A INCM opera já uma implementação madura do European Legislation Identifier
(ELI) em produção, com identificadores resolúveis desde 1991, metadados em RDFa,
vocabulários controlados e alimentação por Atom. O AKN-PT alinhou-se ao template
real da INCM em vez de propor um esquema paralelo (ver [ADR-0012](0012-eli-pt-incm-real-template.md)).

Este documento consolida a agenda para que a conversa com a INCM parta de
propostas concretas e não de uma folha em branco.

## Decisão

Adota-se a agenda seguinte, com a classificação do momento de decisão:

- **Já** — matéria madura, decidível sem depender da reunião
- **Reunião** — exige acordo com a INCM
- **Faseado** — decidido no essencial, com concretização por etapas

### Bloco A — Fundacionais: governação e processo

| # | Decisão | Proposta AKN-PT | Momento | ADR |
|---|---|---|---|---|
| 1 | Quem normaliza o perfil e quem o opera | Modelo híbrido: a DAPL normaliza, uma comissão técnica ratifica. Precedente espanhol: o grupo de trabalho ELI não coincide com a entidade editora | **Reunião** | [0001](0001-project-governance.md) |
| 2 | Licença e abertura | EUPL-1.2 para código e dados | Já | [0002](0002-license-eupl.md) |
| 3 | Repositório e método de trabalho | Repositório único no GitHub, com revisão externa por marcos | Já | [0003](0003-repository-monorepo.md), [0010](0010-external-review-milestone.md) |

### Bloco B — Norma base e extensibilidade

| # | Decisão | Proposta AKN-PT | Momento | ADR |
|---|---|---|---|---|
| 4 | Norma internacional e versão | Akoma Ntoso (OASIS LegalDocML), esquema CSD17, perfil declarado no elemento de formato | Já | [0005](0005-namespace-oasis-csd17.md) |
| 5 | Espaço de nomes das extensões nacionais | Prefixo próprio `akn-pt` para o que não existe no núcleo da norma | Já | [0011](0011-namespace-pt-extensions.md) |

### Bloco C — Identificadores e ELI

| # | Decisão | Proposta AKN-PT | Momento | ADR |
|---|---|---|---|---|
| 6 | Esquema de identificadores | Adotar o template real da INCM em `data.dre.pt`, nas três camadas e nas versões consolidadas | Já | [0012](0012-eli-pt-incm-real-template.md) |
| 7 | Correspondência entre tipos de ato e abreviaturas do identificador | Mapa completo alinhado com o da INCM. Falta confirmar o decreto da Assembleia da República | Já | — |
| 8 | Território | Marcador nacional, dos Açores e da Madeira no identificador, coerente com o país declarado nos metadados. Regra de validação criada | Já | — |
| 9 | Data que entra no identificador | Data de publicação. A citação legística completa torna o identificador construível a partir da referência | Já | — |
| 10 | Permanência e lacuna anterior a 1991 | Identificadores resolvem desde 1991. Os atos anteriores ficam por tratar | **Reunião** | — |

### Bloco D — Âmbito

| # | Decisão | Proposta AKN-PT | Momento | ADR |
|---|---|---|---|---|
| 11 | Tipos de ato abrangidos | Nove tipos na primeira versão, com alargamento posterior | Faseado | [0007](0007-scope-9-types-v0.1.0.md) |
| 12 | Cobertura temporal e segunda série | A definir em conjunto | **Reunião** | — |

### Bloco E — Línguas

| # | Decisão | Proposta AKN-PT | Momento | ADR |
|---|---|---|---|---|
| 13 | Política linguística | Português no corpo e inglês no sumário. Marcação de língua e de autoridade conforme a prática da INCM | Já | [0006](0006-languages-pt-body-en-summary.md) |

### Bloco F — Conformidade e validação

| # | Decisão | Proposta AKN-PT | Momento | ADR |
|---|---|---|---|---|
| 14 | Níveis de conformidade | Três fases: redação, revisão e publicação | Já | [0004](0004-conformance-phases.md) |
| 15 | Regras e ferramenta de validação | Esquema para a estrutura e regras Schematron para as invariantes de legística e de coerência, com validador próprio | Já | [0008](0008-validator-stack-python-lxml.md) |

### Bloco G — Semântica e vocabulários

| # | Decisão | Proposta AKN-PT | Momento | ADR |
|---|---|---|---|---|
| 16 | Vocabulário de assunto | Adotar a lista de descritores da INCM, com ponte para o EuroVoc | Já | — |
| 17 | Tabelas de autoridade | Adotar os vocabulários controlados da INCM como autoridade comum | Já | — |
| 18 | Relações jurídicas | Modelar diploma habilitante, transposição, consolidação e alteração | Já | — |

### Bloco H — Ciclo de vida e conteúdos especiais

| # | Decisão | Proposta AKN-PT | Momento | ADR |
|---|---|---|---|---|
| 19 | Consolidação e alterações | Expressões consolidadas com data e versão | Faseado | — |
| 20 | Pegada legislativa | Bloco próprio no espaço de nomes nacional, conforme a Lei n.º 5-A/2026 | Faseado | [0011](0011-namespace-pt-extensions.md) |
| 21 | Identificadores internos dos elementos | Esquema coerente com a numeração apresentada, com validação automática | Já | — |

### Bloco I — Captura na origem

| # | Decisão | Proposta AKN-PT | Momento | ADR |
|---|---|---|---|---|
| 22 | Onde e como se capta a estrutura do texto | Explorar a captura estruturada no novo Sistema de Submissão de Atos, com mapeamento entre o AKN-PT e o formato interno da INCM | **Reunião** | — |

## Consequências

**Positivas**

- A conversa com a INCM parte de propostas concretas, com a matéria de baixo
  atrito já resolvida.
- Os blocos C e G adotam o que é da INCM, o que reduz o risco de divergência de
  identificadores e de vocabulários.
- A agenda distingue o que é técnico do que é institucional, o que evita que a
  discussão de governação bloqueie o trabalho técnico.

**Negativas e mitigação**

- Classificar uma decisão como “Já” não dispensa a validação da INCM. A
  classificação exprime maturidade da proposta, não competência para decidir
  sozinho. Mitigação: as decisões do bloco C e G são apresentadas como adoção do
  que a INCM já pratica.
- Três matérias ficam dependentes da reunião, o que condiciona o calendário.
  Mitigação: o trabalho técnico prossegue nos restantes blocos.

## Relação com outros documentos

- Esquema de identificadores: [ADR-0012](0012-eli-pt-incm-real-template.md) e
  `eli-pt/incm-eli-reference.md`
- Estado do trabalho e próximos passos: `ROADMAP.md`
- Guião da reunião com a INCM: `eli-pt/`
