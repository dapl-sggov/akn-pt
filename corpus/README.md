# Corpus AKN-PT v0.1.0 — 10 diplomas reais marcados

Corpus de referência para o AKN-PT v0.1.0. Cada ficheiro é um diploma
**realmente publicado** no Diário da República, marcado segundo a spec
AKN-PT v0.1.0 e validado contra XSD + Schematron (phase publication).

## Inventário

| # | Ficheiro | Diploma real | Subtipo | Exercita |
|---|---|---|---|---|
| 1 | [`dec-lei/dl-72-2020.akn.xml`](dec-lei/dl-72-2020.akn.xml) | Decreto-Lei n.º 72/2020, de 15 de setembro | `dec-lei-ordinario` | Estrutura base DL; subtipo ordinário |
| 2 | [`dec-lei/dl-21-2023.akn.xml`](dec-lei/dl-21-2023.akn.xml) | Decreto-Lei n.º 21/2023, de 27 de março | `dec-lei-transposicao` | Subtipo transposição; ref a directiva UE (`data.europa.eu/eli/dir/...`); **subalíneas `i)`, `ii)`, `iii)` aninhadas dentro de alínea `b)` no Artigo 5.º** (point com `<list>` recursiva) |
| 3 | [`dec-lei/dl-78-2021.akn.xml`](dec-lei/dl-78-2021.akn.xml) | Decreto-Lei n.º 78/2021, de 20 de setembro | `dec-lei-alterador` | `<quotedStructure>` + republicação técnica em anexo (prefixo `rep__`) |
| 4 | [`lei/lei-7-2020.akn.xml`](lei/lei-7-2020.akn.xml) | Lei n.º 7/2020, de 10 de abril | `lei-comum` | Assinaturas Presidente da AR + Presidente da República + PM; preâmbulo curto |
| 5 | [`decreto-ar/decreto-ar-32-2021.akn.xml`](decreto-ar/decreto-ar-32-2021.akn.xml) | Decreto AR n.º 32/2021, de 23 de abril | `decreto-ar-tratado` | Aprovação de convenção; anexo com texto de tratado |
| 6 | [`portaria/portaria-249-2021.akn.xml`](portaria/portaria-249-2021.akn.xml) | Portaria n.º 249/2021, de 22 de novembro | `portaria-regulamentar` | Lei habilitante obrigatória; modelo de impresso em anexo |
| 7 | [`res-cm/rcm-53-2020.akn.xml`](res-cm/rcm-53-2020.akn.xml) | RCM n.º 53/2020, de 10 de julho | `res-cm-normativa` | Body com `<paragraph>` (sem `<article>`); anexo extenso com estratégia |
| 8 | [`despacho/despacho-normativo-1-2022.akn.xml`](despacho/despacho-normativo-1-2022.akn.xml) | Despacho normativo n.º 1/2022, de 7 de janeiro | `despacho-normativo` | Estrutura típica; lei habilitante |
| 9 | [`dlr/dlr-19-2020-A.akn.xml`](dlr/dlr-19-2020-A.akn.xml) | DLR n.º 19/2020/A, de 30 de junho | `dlr-ordinario` | Jurisdição `pt-20`; promulgação pelo Representante da República |
| 10 | [`dec-lei/dl-72-2020-consolidado.akn.xml`](dec-lei/dl-72-2020-consolidado.akn.xml) | DL n.º 72/2020 (versão consolidada a 2022-01-01) | `dec-lei-ordinario` | Expression posterior (`{point-in-time}` no URI); `<analysis>/<passiveModifications>` com referências reversas |

## Cobertura

Tipos com cobertura completa (per ADR-0007):

- ✓ Decreto-Lei (3 exemplos: ordinário, transposição, alterador)
- ✓ Lei
- ✓ Portaria
- ✓ Resolução do CM

Tipos com cobertura skeleton + 1 exemplo no corpus:

- ✓ Decreto da AR
- ✓ Despacho normativo
- ✓ Decreto Legislativo Regional

Tipos com mapping mas sem exemplo (deixados para v0.1.x):

- — Resolução da AR
- — Decreto Regulamentar Regional

Aspectos especiais demonstrados pelo corpus:

- ✓ FRBR triple completo, com Expression originária e consolidada
- ✓ References TLC (Organization, Person, Role, Concept, Location, Event)
- ✓ Lifecycle (aprovação, promulgação, publicação, entry-into-force)
- ✓ `<analysis>/<passiveModifications>` populado em consolidado (exemplo #10)
- ✓ Subtipos em todos os tipos
- ✓ `<quotedStructure>` em DL alterador (exemplo #3)
- ✓ Republicação técnica com prefixo `rep__` (exemplo #3)
- ✓ Anexos com tabela / `<blockList>` / texto livre / tratado
- ✓ Referências externas a ELI-PT (DLs em vigor) e ELI europeu (directivas UE)
- ✓ Jurisdição regional `pt-20` (Açores)
- ✓ Assinaturas múltiplas (DL com PM+ministros, Lei com PAR+PR+PM)
- ✓ Modelo de impresso em anexo de Portaria

Aspectos **não** cobertos pelo corpus (deixados para v0.1.x ou v0.2):

- Pegada legislativa em diploma real — sem diplomas pós-2026-07-27 no corpus.
  O exemplo `schema/tests/positive/dec-lei-with-footprint.akn.xml` cobre este
  caso fora do corpus.
- Diplomas com artigos com hierarquia profunda (book/part/title)
- Portaria conjunta (múltiplos ministros assinam)
- Lei orgânica
- Resolução de cessação de vigência (art. 169.º CRP)
- DRR (Decreto Regulamentar Regional)
- Despacho conjunto

## Convenções de marcação

Cada ficheiro tem comentário inicial com:

- Tipo, número, ano, data de publicação.
- Fonte canónica (URL dre.pt).
- Coverage demonstrada por aquele exemplo.
- Aspectos não cobertos (deixados para outros exemplos).
- Nota se o articulado foi resumido por extensão (ver abaixo).

**Articulados longos** (com mais de 10 artigos) têm os primeiros 3-5 artigos
marcados em detalhe completo; restantes têm apenas `<num>+<heading>` e
marcação esquemática do conteúdo, com comentário XML a indicar "articulado
representativo resumido — pedagógico". A estrutura sintáctica AKN é
exaustivamente exercitada nos primeiros artigos.

Esta é prática estabelecida em corpora pedagógicos (Senato italiano,
LexML Brasil, AKN-IT exemplos OASIS). Os ficheiros são representativos para
teste de schema e demonstração; não substituem o texto integral autoritativo
publicado no DRE.

## Validação

Os 10 ficheiros são validados em CI pelo test runner:

```bash
python schema/tests/run_tests.py     # 42 tests do schema + corpus separadamente
python corpus/validate_corpus.py     # valida só o corpus contra XSD + Schematron publication
```

Todos os 10 ficheiros **devem** passar XSD e Schematron (phase `publication`)
sem erros. Warnings em legistica-conventions são tolerados.

## Layout de pastas

```
corpus/
├── README.md                                ← este ficheiro
├── validate_corpus.py                       ← runner dedicado
├── dec-lei/
│   ├── dl-72-2020.akn.xml                  (#1)
│   ├── dl-21-2023.akn.xml                  (#2)
│   ├── dl-78-2021.akn.xml                  (#3)
│   └── dl-72-2020-consolidado.akn.xml      (#10)
├── lei/
│   └── lei-7-2020.akn.xml                  (#4)
├── decreto-ar/
│   └── decreto-ar-32-2021.akn.xml          (#5)
├── portaria/
│   └── portaria-249-2021.akn.xml           (#6)
├── res-cm/
│   └── rcm-53-2020.akn.xml                 (#7)
├── despacho/
│   └── despacho-normativo-1-2022.akn.xml   (#8)
└── dlr/
    └── dlr-19-2020-A.akn.xml               (#9)
```
