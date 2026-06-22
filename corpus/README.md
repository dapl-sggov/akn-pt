# Corpus AKN-PT — 8 diplomas reais verificados

Corpus de referência do AKN-PT. Cada ficheiro é um diploma **realmente
publicado** no Diário da República, com **identidade ELI verificada** (o URI
`data.dre.pt/eli/...` resolve 301→200 no DR), marcado segundo a spec AKN-PT e
validado contra XSD + Schematron (phase `publication`). Diplomas extensos
(códigos) são marcados como **excerto** (primeiros artigos), à semelhança da
prática internacional para corpora de demonstração.

> **Nota de revisão (2026-06-22):** o conjunto anterior (15 ficheiros) foi
> **substituído**. Ao testar a resolução ELI contra o DR descobrimos que a
> maioria desses diplomas era **sintética** (identidades inventadas que não
> resolviam) e que continham slugs/forma de URI não-canónicos. Este corpus
> contém apenas diplomas **reais e verificáveis**, na forma ELI real da INCM
> (ver [`../eli-pt/incm-eli-reference.md`](../eli-pt/incm-eli-reference.md)).
> Formas ainda sem exemplo real (consolidada, retificação, republicação) ficam
> para adição futura com diplomas reais (ex.: o CCP tem consolidação real em
> `dec-lei/18/2008/p/cons/{data}`).

## Inventário

| # | Ficheiro | Diploma real | `<act name>` / slug ELI | Exercita |
|---|---|---|---|---|
| 1 | [`dec-lei/dec-lei-18-2008-ccp-excerto.akn.xml`](dec-lei/dec-lei-18-2008-ccp-excerto.akn.xml) | Decreto-Lei n.º 18/2008, de 29 de janeiro (Código dos Contratos Públicos) | `dec-lei` / `dec-lei` | Estrutura base DL; promulgação PR + referenda PM; **excerto** (arts. 1.º-3.º do diploma de aprovação) |
| 2 | [`lei/lei-7-2009-codigo-trabalho-excerto.akn.xml`](lei/lei-7-2009-codigo-trabalho-excerto.akn.xml) | Lei n.º 7/2009, de 12 de fevereiro (Código do Trabalho) | `lei` / `lei` | Lei da AR; transposição de directivas; **excerto** |
| 3 | [`portaria/portaria-164-a-2022.akn.xml`](portaria/portaria-164-a-2022.akn.xml) | Portaria n.º 164-A/2022, de 24 de junho | `portaria` / `port` | **Sufixo no número** (`164-a`); lei habilitante (CIEC); dois Secretários de Estado |
| 4 | [`res-cm/rcm-67-2022.akn.xml`](res-cm/rcm-67-2022.akn.xml) | Resolução do Conselho de Ministros n.º 67/2022, de 25 de julho | `res-cm` / `resolconsmin` | Body com `<paragraph>` numerados + `<list>`/`<point>`; **excerto** |
| 5 | [`res-ar/res-ar-28-2022.akn.xml`](res-ar/res-ar-28-2022.akn.xml) | Resolução da Assembleia da República n.º 28/2022, de 24 de junho | `res-ar` / `resolassrep` | Resolução da AR; assinatura do Presidente da AR; **excerto** |
| 6 | [`despacho/despacho-normativo-36-2006.akn.xml`](despacho/despacho-normativo-36-2006.akn.xml) | Despacho Normativo n.º 36/2006, de 26 de junho | `despacho-normativo` / `despnorm` | Habilitação em direito da UE; **excerto** |
| 7 | [`dlr/dlr-12-2022-acores.akn.xml`](dlr/dlr-12-2022-acores.akn.xml) | Decreto Legislativo Regional n.º 12/2022/A (Açores), de 25 de maio | `dlr` / `declegreg` | **Território `a` no URI** (`…/a/dre`); `<FRBRcountry>` `pt-20` |
| 8 | [`decreto-ar/decreto-ar-1-2018.akn.xml`](decreto-ar/decreto-ar-1-2018.akn.xml) | Decreto n.º 1/2018, de 11 de janeiro | `decreto-ar` / `dec` | Decreto (aprovação); estrutura com anexo |

Cobertura de tipos do escopo: DL, Lei, Portaria, RCM, Resolução AR, Despacho
Normativo, DLR (regional), Decreto. O `<act name>` mantém o nome AKN-PT legível;
o **slug ELI real da INCM** aparece só no URI (`port`, `resolconsmin`, `despnorm`,
`declegreg`, `dec`, …).

## Validação

Todos os ficheiros **devem** passar XSD + Schematron (phase `publication`):

```
python corpus/validate_corpus.py     # XSD + Schematron (lxml)
python -m akn_pt batch corpus        # validador akn_pt (inclui verificações Python, ex. STR-0010 eId↔num)
```
