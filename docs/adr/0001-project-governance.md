# ADR-0001 — Modelo de governação híbrido

- **Estado:** Accepted
- **Data:** 2026-05-19
- **Decisores:** DAPL/SGGOV

## Contexto

O AKN-PT é um perfil nacional de uma norma OASIS (Akoma Ntoso) com múltiplos
stakeholders institucionais: SGGOV (executivo), AR (legislativo), INCM
(publicação oficial), revisores externos (CIRSFID-Bologna, Parlamento Helénico,
ICJP). Nenhum destes actores tem, isoladamente, mandato para definir o perfil.

Modelos considerados:

1. **Top-down DAPL/SGGOV** — rápido, mas sem legitimidade transversal.
2. **Comissão técnica formal** — legitimidade, mas demora meses a constituir e
   bloqueia o arranque.
3. **Híbrido — bootstrap DAPL, transição para comissão** — arranque imediato,
   institucionalização posterior.

## Decisão

Modelo **híbrido**:

- Fase 1 (v0.1.0): DAPL/SGGOV lidera, com revisão técnica externa por convite.
- Fase 2 (v0.2.0+): Comissão Técnica AKN-PT formalizada com representantes de
  SGGOV, AR, INCM, mais 2-3 revisores externos.
- Decisões registadas em `decisions-log.md` enquanto a comissão não existir;
  ADRs formais a partir do momento em que existir.

## Consequências

**Positivas:** Permite trabalho técnico imediato sem esperar processo
institucional. Material produzido é input para a comissão futura, não
substituto.

**Negativas:** As ADRs em fase 1 são "Proposed" até validação da comissão —
nada está definitivo. Risco de retrabalho se a comissão divergir
significativamente.

**Mitigação:** Decisões da fase 1 baseiam-se em práticas internacionais
documentadas (AKN4EU, Senato, Parlamento Helénico) para reduzir divergência
esperada.
