# ADR-0009 — Domínio ELI-PT: placeholder até coordenação INCM

- **Estado:** Proposed
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
