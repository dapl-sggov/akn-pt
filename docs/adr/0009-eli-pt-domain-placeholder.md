# ADR-0009 — Domínio ELI-PT: placeholder até coordenação INCM

- **Estado:** Proposed — **revisto 2026-06-22 (ver "Revisão" no fim)**
- **Data:** 2026-05-19

## Contexto

ELI (European Legislation Identifier) é o padrão UE para URIs persistentes
de legislação. O perfil PT precisa de:

- Um domínio raiz nacional (e.g. `eli.gov.pt`, `dre.pt/eli`, ou outro).
- Templates de URI por tipo de acto.
- Coordenação com INCM (Imprensa Nacional-Casa da Moeda) — entidade que
  gere o DRE e os identificadores oficiais.

A decisão do domínio final exige coordenação institucional que não cabe na
v0.1.0. Mas o trabalho técnico (templates, regex, conversores) não pode
esperar.

## Decisão

**Domínio placeholder: `eli.gov.pt`**, usado em toda a v0.1.0.

- Templates ELI-PT definidos em `eli-pt/uri-templates.md` usando este
  domínio.
- Conversor `eli-pt/conversion.py` aceita o domínio como parâmetro
  configurável, default `eli.gov.pt`.
- README do `eli-pt/` declara explicitamente que o domínio é provisório.
- Migração futura: trocar o domínio implica sed em corpus + regenerar
  fixtures de teste — script `tools/migrate_eli_domain.py` previsto para
  v0.2.0 se necessário.

Alternativas consideradas e rejeitadas:

- `dre.pt/eli/...` — depende de INCM aceitar adicionar prefixo `/eli` ao
  domínio existente. Risco de rejeição.
- `id.gov.pt/lex/...` — não existe ainda; depende de criar.
- Nenhum domínio até decisão — bloqueia validação e exemplos.

## Consequências

**Positivas:**

- Trabalho técnico avança em paralelo com coordenação institucional.
- Templates testáveis com fixtures.
- Migração futura é mecânica (substituição de string).

**Negativas:**

- URIs no corpus v0.1.0 ficarão obsoletos quando o domínio final for fixado.
- Risco de utilizadores externos copiarem URIs do corpus para produção.

**Mitigação:** README de `eli-pt/` em destaque visual avisa que o domínio é
placeholder. Validador emite warning quando encontra URIs com
`eli.gov.pt` em ficheiros submetidos para publicação (futuro: v0.2.0).

---

## Revisão 2026-06-22 — o pressuposto mudou

A pesquisa de suporte à reunião INCM de 2026-07-01 (ver
[`eli-pt/research/eli-international-dossier.md`](../../eli-pt/research/eli-international-dossier.md))
revelou um facto que **invalida o enquadramento original** desta ADR:

> **`data.dre.pt` não é uma alternativa "com risco de rejeição" — é o domínio
> ELI que Portugal JÁ tem em produção desde 2016.** Portugal é implementador
> ELI registado no EUR-Lex (Pilar I em 2016-12-19, Pilar II em 2017-07-27),
> operado pela INCM, com URIs do tipo
> `http://data.dre.pt/eli/dec-lei/83/2016/12/16/p/dre/pt/html`.

Consequências para esta decisão:

1. **A questão deixa de ser "que domínio inventar"** e passa a ser
   **"realinhar com o `data.dre.pt` existente da INCM"**. O placeholder
   `eli.gov.pt` mantém-se útil só enquanto a reunião não fixar a posição;
   a recomendação substantiva reforça-se: **adoptar `data.dre.pt`**.

2. **Surge uma divergência estrutural não prevista:** o template em produção
   da INCM usa **data completa** (`/{tipo}/{nº}/{ano}/{mês}/{dia}/p/dre/{lang}/
   {fmt}`), enquanto a nossa proposta ELI-PT v0.1.0 usa **ano+número**
   (`/eli/pt/{tipo}/{ano}/{nº}/pt`). Esta divergência é agora parte integrante
   da decisão de domínio e tem de ser resolvida com a INCM — ver
   [`eli-pt/research/eli-pt-gap-analysis.md`](../../eli-pt/research/eli-pt-gap-analysis.md),
   dimensão "Estrutura do URI".

3. **A decisão final (domínio + estrutura) fica reservada para a reunião INCM
   de 2026-07-01** e respectiva ata; esta ADR será actualizada para
   "Accepted" (ou substituída por ADR-0012) com a posição acordada. Ver
   [`eli-pt/meeting-incm-2026-07-01.md`](../../eli-pt/meeting-incm-2026-07-01.md).

Até lá, **nada muda no código**: `eli.gov.pt` continua como placeholder
parametrizável. A migração para o domínio + estrutura finais será mecânica
(o conversor e o XSD já tratam o domínio como variável; a estrutura
ano+número↔data exigirá ajuste ao regex e ao `conversion.py`).
