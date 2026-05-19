# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **Editor UX v3 — "Cockpit de drafting"**: redesign profundo do interface.
  Substitui o painel TOC à esquerda por **pilha multi-rascunho** (drafts
  paralelos no localStorage). Substitui as 4 tabs do painel direito
  (Informação / Revisão / Ligações / Saída) por **régua de actividade**
  cronológica unificada com 7 filtros. Acaba o overflow menu `⋯` — todas
  as acções secundárias (snapshots, importar, partilhar, IA, etc.) ficam
  acessíveis via **Cmd-K palette** pesquisável (`Ctrl/⌘+K`). TOC vive
  como **breadcrumb sticky** no topo do canvas com mini-TOC chip por
  artigo. Topbar reduzida a masthead navy editorial (Fraunces). Validação
  passa a ser **inline no canvas** com sublinhado oxblood + tooltip + pulso
  uma vez.
- **Tipografia editorial nova**: Source Serif 4 + Inter substituídas por
  **Fraunces** (display, com optical sizing 9..144), **STIX Two Text**
  (corpo do diploma), **Geist / Geist Mono** (UI + código).
- **Paleta**: vermelho DR substituído por **navy institucional** (#0f2747)
  como autoridade + **oxblood** (#7a1f2b) para erros/atenção + **olive**
  (#4a5520) para sucesso + **brass** (#a87832) para avisos editoriais.

### Added
- 10 ADRs materializadas em `docs/adr/` (0001-0010), com `README.md`
  índice e ciclo de vida documentado.
- `tools/sync_schemas.py` — script de sincronização entre `schema/`
  canónico e `validator/src/akn_pt/data/`, com modo `--check` para CI.
  Acaba o risco de drift identificado em `LESSONS-AND-OPEN-QUESTIONS.md`.
- `docs/spec/en/README.md` — clarifica que a documentação EN é summary
  only (3 documentos), enquanto PT é autoritativa (18 capítulos), em
  linha com ADR-0006.
- Editor: 3 novos módulos JS — `stack.js` (pilha multi-doc), `activity.js`
  (feed cronológico), `cmdk.js` (command palette).
- Editor: 3 novos smoke-tests — `decreto-ar-simple`, `despacho-simple`,
  `drr-acores-simple`. Cobertura passa de 6 para **9 tipos** de actos.
- Editor: feature flag `?lab=1` (ou `localStorage.akn-pt-lab=1`) que
  expõe features experimentais (Bluebell-PT, colaboração cross-tab,
  partilha por URL, LoDA inline, export com comentários). Por defeito
  escondidas, reduzindo a superfície da demo.
- CI: novo job `schema-sync` que falha em PR com drift de schemas.

### Fixed
- Editor: `Validation.check()` passa a emitir `eId` por issue quando
  aplicável, permitindo decoração inline directa no canvas.

## [0.0.0] — 2026-05-17

Project bootstrapped.

### Added (bootstrap)
- Repository structure (monorepo)
- Mapping draft v0.0.1 for Decreto-Lei, Resolução do Conselho de Ministros, Portaria
- Outreach drafts to OASIS LegalDocML TC chair (M. Palmirani) and Hellenic Parliament (F. Fitsilis)
