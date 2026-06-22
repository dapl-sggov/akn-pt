# ADR-0007 — Scope v0.1.0: 9 tipos de actos

- **Estado:** Accepted
- **Data:** 2026-05-19

## Contexto

O ordenamento jurídico português tem dezenas de tipos de actos normativos.
Cobrir todos numa única release é inviável. Quais incluir na v0.1.0?

Critérios:

- Volume — tipos publicados em maior número no DRE.
- Variedade estrutural — cobrir as diferenças que stressam o modelo (com /
  sem articulado, com / sem PR, nacional vs regional).
- Disponibilidade de corpus para validação.

## Decisão

**9 tipos na v0.1.0**, escolhidos por volume + variedade estrutural:

| # | Tipo | Justificação |
|---|---|---|
| 1 | Decreto-Lei | Volume mais alto do executivo. Com PR. Com articulado. |
| 2 | Lei (AR) | Origem parlamentar. Com PR. Com articulado. |
| 3 | Portaria | Volume alto. Sem PR. Habilitante obrigatório. |
| 4 | Resolução do CM | Sem PR. Body com `<paragraph>`, não `<article>`. |
| 5 | Decreto da AR | Tipologia particular AR (autorização legislativa, ratificação). |
| 6 | Resolução da AR | Sem PR. `<paragraph>`. Subtipos múltiplos. |
| 7 | Despacho normativo | Acto regulamentar de membro do Governo. |
| 8 | Decreto Legislativo Regional | Regional (Açores `pt-20`, Madeira `pt-30`). Com Representante da República. |
| 9 | Decreto Regulamentar Regional | Regional. Sem RR. Habilitante obrigatório. |

**Fora do scope v0.1.0** (candidatos a v0.2.0+):

- Decreto Regulamentar (governo, raro mas existe)
- Aviso, Edital, Declaração de rectificação
- Resoluções administrativas internas
- Tratados internacionais (estrutura distinta)
- Acórdãos de tribunais constitucionais (são judicial, não normativo)

## Consequências

**Positivas:**

- Cobre ~95% do volume publicado no DRE em qualquer ano.
- Cobre as três classes estruturais críticas (PR / sem PR; `<article>` /
  `<paragraph>`; nacional / regional).
- Corpus de 10 diplomas reais consegue validar todos os 9 tipos.

**Negativas:**

- Declarações de rectificação ficam fora — é provavelmente o primeiro pedido
  de utilizadores reais e merece prioridade em v0.2.0.
- Tratados ficam fora — relevância política alta mas baixa frequência.

## Notas

A decisão sobre **declarações de rectificação** deve ser revista a quente após
feedback do corpus piloto: se aparecerem nas primeiras 10 utilizações, sobem
para v0.1.1.
