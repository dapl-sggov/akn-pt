# AKN-PT — perfil nacional português do Akoma Ntoso

[![CI](https://github.com/dapl-sggov/akn-pt/actions/workflows/ci.yml/badge.svg)](https://github.com/dapl-sggov/akn-pt/actions/workflows/ci.yml)
[![License: EUPL-1.2](https://img.shields.io/badge/license-EUPL--1.2-blue)](LICENSE)
[![Version](https://img.shields.io/badge/version-v0.1.0-blue)](CHANGELOG.md)
[![Editor demo](https://img.shields.io/badge/editor-demo-2a3a6b)](https://akn-pt.pages.dev)

**AKN-PT** é o perfil nacional português do [Akoma Ntoso](https://www.oasis-open.org/standards/#akomantosov1.0)
(OASIS LegalDocML), destinado à marcação estruturada e interoperável de
diplomas legislativos portugueses — decretos-leis, leis, portarias, resoluções
do Conselho de Ministros, decretos legislativos regionais e outros.

> ⚠ **Estado:** **v0.1.0** — pré-fundacional, em revisão técnica. As decisões
> estão registadas em [`decisions-log.md`](decisions-log.md) e nas [ADRs](docs/adr/).
> Nenhuma decisão é definitiva até validação institucional formal.

## O que está aqui

| Artefacto | Pasta | Estado |
|---|---|---|
| **Especificação** (PT body + EN summary) | [`docs/spec/`](docs/spec/) | v0.1.0 — 18 capítulos |
| **Schema XSD** (modular, 4 ficheiros) | [`schema/xsd/`](schema/xsd/) | v0.1.0 — 43 test cases |
| **Schematron** (9 patterns, 3 fases) | [`schema/schematron/`](schema/schematron/) | v0.1.0 |
| **ELI-PT** (perfil URI nacional) | [`eli-pt/`](eli-pt/) | v0.1.0 — `eli.gov.pt` placeholder |
| **Mapping** (estrutura PT → AKN) | [`mapping/v0.1.0/`](mapping/v0.1.0/) | v0.1.0 — 9 tipos cobertos |
| **Corpus** (10 diplomas reais marcados) | [`corpus/`](corpus/) | v0.1.0 |
| **Validador** (CLI + lib + Docker) | [`validator/`](validator/) | Python 3.12+ · 51 testes |
| **Editor web demo** | [`editor/`](editor/) | HTML/CSS/JS · 22 features |

## Tentar online

- **Editor web:** **<https://akn-pt.pages.dev>** — escolha um tipo de acto, preencha,
  exporte AKN-PT XML, PDF ou Word. Sem servidor, funciona offline, dados ficam no browser.

## Tentar localmente

```bash
git clone https://github.com/dapl-sggov/akn-pt.git
cd akn-pt
```

### Validador (CLI)

```bash
cd validator
pip install -e .

# Validar um diploma
python -m akn_pt validate ../corpus/dec-lei/dl-21-2023.akn.xml

# Validar em lote
python -m akn_pt batch ../corpus/

# Validação por fase (drafting/review/publication — cf. ADR-0004)
python -m akn_pt validate doc.akn.xml --phase publication
```

### Editor (browser)

```bash
cd editor
python -m http.server 8000
# abrir http://localhost:8000
```

### Testes

```bash
python schema/tests/run_tests.py     # 43/43 esperado
python corpus/validate_corpus.py     # 10/10 esperado
cd validator && python -m pytest     # 51/51 esperado
cd editor && node smoke-test.js \
  && python -m akn_pt batch .smoke-output  # 16/16 + 15/15 esperado
```

## Pré-requisitos

- **Python 3.12+** com `lxml` (instalado via `validator/pyproject.toml`)
- **Node.js 20+** (apenas para correr os smoke tests do editor; o editor em si não precisa)
- **Pandoc + XeLaTeX** (opcional, para reconstruir PDFs da spec a partir do MD)

## Modelo de governação

Híbrido — ver [ADR-0001](docs/adr/0001-project-governance.md):
- Inicialmente liderado por **DAPL/SGGOV** (Direcção de Apoio aos Processos
  Legislativos / Secretaria-Geral do Governo)
- Coordenação técnica futura via **Comissão Técnica AKN-PT** (a constituir)
  com SGGOV + INCM + AR + revisores externos

Para detalhes sobre como contribuir: ver [`CONTRIBUTING.md`](CONTRIBUTING.md).
Para reportar vulnerabilidades: ver [`SECURITY.md`](SECURITY.md).
Código de conduta: [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

## Decisões arquitectónicas

10 ADRs propostas, registadas em [`docs/adr/`](docs/adr/):

| # | Decisão | Estado |
|---|---|---|
| 0001 | Governance model — Hybrid | Proposed |
| 0002 | License — EUPL-1.2 | Proposed |
| 0003 | Repository — Monorepo no GitHub | Proposed |
| 0004 | Conformance — 3 fases (drafting/review/publication) | Proposed |
| 0005 | Namespace — OASIS CSD17 + perfil em `<FRBRformat>` | Proposed |
| 0006 | Línguas — PT body, EN summary | Proposed |
| 0007 | Scope — 9 tipos na v0.1.0 | Proposed |
| 0008 | Validator stack — Python 3.12+ + lxml | Proposed |
| 0009 | ELI-PT domain — placeholder até coordenação INCM | Proposed |
| 0010 | External review — milestone-based | Proposed |

Decisões operacionais e fixes durante o build: [`decisions-log.md`](decisions-log.md)
(85+ entradas Q&A organizadas em 8 checkpoints CP1–CP8).

## Stakeholders externos relevantes

- **INCM** — coordenação ELI-PT, domínio final, integração com DRE
- **AR — Assembleia da República** — fluxo legislativo parlamentar
- **Comissão Europeia / Office for Publications** — alinhamento AKN4EU
- **Monica Palmirani (CIRSFID-Bologna)** — review técnica AKN
- **Fragiskos Fitsilis (LSE / OECD ParlAmericas)** — review técnica
- **ICJP** — review jurídica

## Licença

[EUPL-1.2](LICENSE) — European Union Public Licence, compatível com GPL e MPL.
Permite uso comercial e fechado em camadas superiores, exigindo apenas reciprocidade
em modificações ao próprio AKN-PT.

## Citação

```
AKN-PT — Akoma Ntoso profile for Portuguese legislation, v0.1.0.
DAPL/SGGOV, 2026. https://github.com/dapl-sggov/akn-pt
```
