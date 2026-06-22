# ADR-0002 — Licença EUPL-1.2

- **Estado:** Accepted
- **Data:** 2026-05-19

## Contexto

O AKN-PT inclui especificação, schemas, mapping, validador e editor. Precisa
de uma licença que:

- Permita uso por entidades públicas portuguesas e europeias.
- Permita reutilização comercial em camadas superiores (ferramentas
  proprietárias que produzam AKN-PT).
- Mantenha reciprocidade sobre o próprio perfil — alterações ao AKN-PT voltam
  ao bem comum.
- Seja compatível com GPL, MPL e outras licenças open-source comuns.

Alternativas avaliadas: MIT (permissiva demais — perde reciprocidade), GPL-3
(viral demais — bloqueia integradores comerciais), MPL-2.0 (compatível mas
sem reconhecimento institucional europeu).

## Decisão

**EUPL-1.2** — European Union Public Licence, versão 1.2.

## Consequências

**Positivas:**

- Reconhecimento e tradução oficial em 23 línguas, incluindo PT.
- Recomendada pela Comissão Europeia para software público.
- Compatível com GPL-2, GPL-3, MPL-2.0, AGPL-3 (lista de compatibilidade no
  apêndice da própria licença).
- Reciprocidade limitada ao próprio código AKN-PT — ferramentas que apenas
  consomem ou produzem AKN-PT XML não ficam sujeitas.

**Negativas:**

- Menos familiar a developers fora da esfera pública europeia.
- Cláusula de reciprocidade pode ser interpretada conservadoramente por
  integradores que evitam por precaução.

**Mitigação:** README explicita o que requer e o que não requer
reciprocidade. `LICENSE` na raiz contém o texto integral.
