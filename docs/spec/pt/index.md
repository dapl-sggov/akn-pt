# AKN-PT — Especificação

**Perfil nacional português do standard internacional Akoma Ntoso (OASIS LegalDocML 1.0)**

Versão: **0.1.0 (proposta)**
Data: 2026-05-18
Licença: EUPL-1.2
Autoridade: Divisão de Apoio ao Processo Legislativo (DAPL) / Secretaria-Geral do Governo (SGGOV)

---

## Sumário (este documento)

| # | Capítulo | Pp. |
|---|---|---|
| 1 | [Introdução](01-introducao.md) | 4 |
| 2 | [Conformidade](02-conformidade.md) | 3 |
| 3 | [Modelo documental — FRBR e Akoma Ntoso](03-modelo-documental.md) | 4 |
| 4 | [Tipologia dos atos cobertos](04-tipologia-atos.md) | 4 |
| 5 | [Estrutura geral do documento](05-estrutura-documento.md) | 4 |
| 6 | [Mapeamento estrutural por tipo](06-mapeamento-estrutural.md) | 6 |
| 7 | [Referências e citações](07-referencias-citacoes.md) | 3 |
| 8 | [Identificadores — eId, FRBR URI, ELI-PT](08-identificadores.md) | 4 |
| 9 | [Metadados](09-metadados.md) | 3 |
| 10 | [Multilinguismo e Regiões Autónomas](10-multilinguismo.md) | 2 |
| 11 | [Ciclo de vida, alterações e consolidação](11-ciclo-vida.md) | 3 |
| **12** | **[Pegada legislativa (Lei n.º 5-A/2026)](12-pegada-legislativa.md)** | **4** |
| 13 | [Modelo de validação](13-validacao.md) | 3 |
| 14 | [Extensões e construções proibidas](14-extensoes-proibicoes.md) | 2 |
| 15 | [Exemplos](15-exemplos.md) | 3 |
| 16 | [Glossário PT-EN](16-glossario.md) | 2 |
| 17 | [Referências bibliográficas](17-referencias.md) | 1 |
| 18 | [Changelog](18-changelog.md) | 1 |

Total: ~56 páginas em A4 corpo 11.

## Estado

Esta é a versão **0.1.0 (proposta)** do AKN-PT. Os capítulos materializam as
decisões registadas em 10 ADRs do projeto e nos artefactos técnicos
sub-jacentes (XSD, Schematron, mapping, ELI-PT). Nenhuma escolha é definitiva
até validação institucional formal (despacho do Secretário-Geral) e revisão
externa (Palmirani, Fitsilis, Publications Office UE — ADR-0010).

## Como ler

- **Para um leitor jurídico** que queira entender o quê e o porquê, ler
  capítulos 1, 3, 4, 12, 14 e 15. (~22 páginas, 40 min)
- **Para um implementador técnico** que vá escrever schemas, validadores ou
  conversores, ler capítulos 2, 5, 6, 7, 8, 9, 12, 13. (~30 páginas, 1h15)
- **Para um leitor da comunidade AKN internacional**, começar pelo
  [executive-summary EN](../en/executive-summary.md) e voltar a capítulos PT
  específicos se necessário.

## Convenções tipográficas

- **DEVE**, **NÃO DEVE**, **DEVERIA**, **PODE** — nos termos do RFC 2119 (e da
  sua tradução prática para PT).
- `código` — termos técnicos, nomes de ficheiros, fragmentos XML inline.
- Blocos `xml` — exemplos de marcação.
- `→` introduz consequência ou exemplo.

## Versão e changelog

Esta versão é a 0.1.0 (proposta). O changelog está no [capítulo 18](18-changelog.md)
e é também mantido em `CHANGELOG.md` na raiz do repositório.
