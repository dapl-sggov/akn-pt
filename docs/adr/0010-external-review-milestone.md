# ADR-0010 — Revisão externa milestone-based

- **Estado:** Proposed
- **Data:** 2026-05-19

## Contexto

O AKN-PT v0.1.0 é pré-fundacional. Precisa de revisão técnica externa por:

- **Monica Palmirani** (CIRSFID-Bologna, OASIS LegalDocML TC) — review da
  conformidade ao Akoma Ntoso canónico.
- **Fragiskos Fitsilis** (Parlamento Helénico, OECD ParlAmericas) — review
  do modelo de pegada legislativa, lições da implementação grega.
- **ICJP** (Instituto de Ciências Jurídico-Políticas) — review jurídica.
- **AKN4EU team** (Office for Publications da CE) — alinhamento com o perfil
  europeu.

Modelos de revisão considerados:

1. **Contínua** — partilhar PRs em curso. Vantagem: feedback rápido.
   Desvantagem: ruído para revisores; difícil de coordenar agendas.
2. **Big bang final** — revisão única antes de v1.0. Desvantagem: feedback
   tarde demais para mudanças estruturais.
3. **Milestone-based** — revisão por release com escopo definido.

## Decisão

**Revisão milestone-based**, ancorada em releases:

| Milestone | Scope da revisão | Revisores convidados |
|---|---|---|
| **v0.1.0** (esta) | Estrutura geral, namespaces, conformance phases, pegada | Palmirani, Fitsilis |
| **v0.2.0** | ELI-PT finalizado + INCM, corpus alargado, 11+ tipos | Palmirani, INCM, ICJP |
| **v0.3.0** | Integração com pipeline editorial AR + DAPL | AR, ICJP, AKN4EU |
| **v1.0.0** | Spec final, candidatura a perfil oficial OASIS | OASIS LegalDocML TC formal |

Cada milestone:

- Cria GitHub Release com tag `v0.X.0` e changelog.
- Envia email/outreach formal aos revisores com PDF + link ao repo.
- Cria issues etiquetadas `review-feedback-v0.X` para feedback.
- Janela de 4-6 semanas para feedback antes de fechar o milestone.

## Consequências

**Positivas:**

- Revisores recebem material estável, não em mudança.
- Feedback agrupado por temas (estrutura, semântica, integração).
- Calendário previsível para os revisores planearem.

**Negativas:**

- 4-6 semanas de espera por release é longo para iterações rápidas.
- Risco de revisor identificar problema arquitectónico tarde — mitigado por
  inclusão das perguntas mais críticas em `LESSONS-AND-OPEN-QUESTIONS.md`
  já em v0.1.0, sinalizando-as antes da revisão.

## Notas

`LESSONS-AND-OPEN-QUESTIONS.md` contém perguntas específicas por revisor
(secção 2). Funcionam como prompt explícito — minimiza o tempo do revisor
a procurar pontos críticos.
