# AKN-PT — Roadmap (fonte única)

Estado a 2026-06-22. Substitui as listas de próximos passos dispersas.

## Estado atual (v0.2)

ELI-PT **alinhado com o template real e em produção da INCM** (`data.dre.pt`),
verificado empiricamente. Tudo verde: schema 45/45 · corpus 8/8 (reais) ·
validador 49/49 · conversão 23/23 · editor smoke+UI · CI 15/15.

Fonte única do esquema ELI: [`eli-pt/incm-eli-reference.md`](eli-pt/incm-eli-reference.md).
Decisão registada: [ADR-0012](docs/adr/0012-eli-pt-incm-real-template.md).

## Feito (cadeia de alinhamento)

- [x] `data.dre.pt` canónico; citação completa → construível; **slugs reais** da
      INCM; **forma real** do URI (Work `/{p|a|m}/dre`, consolidadas `/cons`,
      território `a`/`m`); habilitante `based_on`; língua `pt`/`PRT`.
- [x] **Corpus** de 8 diplomas **reais verificados** (ELI resolve no DR).
- [x] **Editor** emite a forma canónica + RDFa/JSON-LD com paridade INCM
      (`uri_schema`, `publisher_agent`, `legal_value`, `based_on`).
- [x] **Docs** coerentes (spec PT/EN, cap. 08, uri-templates, exemplos);
      kit de reunião INCM repensado.

## Próximos passos

### A. Antes da reunião INCM (2026-07-01)
- [x] **Editor — deploy** `akn-pt.pages.dev` reconectado e a servir a versão atual (verificado).
- [x] **Vocabulário nacional de assunto** integrado no editor (`eli:is_about`,
      ~35k descritores da INCM; índice lazy + módulo SubjectVocab).
- [ ] Rever a leitura do template linha-a-linha vs página oficial (validar na reunião).

### B. Reunião INCM — decidir/abrir
- [ ] Confirmar `decreto-ar→dec`; data-da-citação = data-do-path; consolidadas/língua.
- [ ] **Estrutura na origem** (tema central): mapeamento **AKN-PT ↔ XML interno
      da INCM**; abertura do SSA a captura estruturada a montante.
- [ ] **Governação**: protocolo SGGOV–INCM (quem norma o perfil, quem opera).
- [ ] **2.ª série** (desde 1991): tipos a incluir no escopo conjunto.
- [ ] **Vocabulário de assunto** nacional (`is_about`) + ponte → EuroVoc.
- [ ] Lacuna **pré-1991** (1.ª série não resolve, ex. Cód. IRS).

### C. AKN-PT — pós-reunião / contínuo
- [ ] Corpus: exemplos **reais** de consolidada/retificação/republicação
      (o CCP tem consolidação real `…/cons/…`); crescer via harvest do Atom feed.
- [ ] Schematron: regra território `a`/`m` ↔ `FRBRcountry`; slug contra o
      vocabulário controlado da INCM (`dre-incm-pt-resource-type.rdf`).
- [ ] Resolver **citação→ELI** para citações abreviadas (lookup de data via feed).
- [ ] Integrar o `is_about` (vocabulário nacional) no perfil e no editor.

### D. Editor — pós-reunião / contínuo
- [ ] **Picker de assuntos** na UI (autocomplete sobre SubjectVocab → `doc.subjects`).
- [ ] **Mapeamento descritores INCM → EuroVoc** (o RDF não tem; oportunidade de contributo à INCM).
- [ ] **Static act-index** a partir do Atom feed da INCM (harvest offline → JSON;
      o runtime é CORS-blocked). Cobre citações abreviadas (sem data). *(valor marginal: o citação→ELI já funciona com a data da citação completa)*
- [ ] Validação in-browser: `validation.js` já cobre as regras-chave live; em
      falta apenas coerência FRBR e eId↔num (baratas de acrescentar). WASM XSD/Schematron = peso elevado, ganho marginal (CI já valida).
- [ ] UI de regionais (Açores/Madeira → `a`/`m`) e de consolidadas.
- [ ] Estética anti-"slop" + verificação visual (Playwright desktop/mobile);
      acessibilidade e mobile.

## Higiene
- [ ] ADRs: rever estados "Proposed" → "Accepted" onde aplicável.
- [ ] Cópias OneDrive do repo (cwd da sessão é OneDrive não-git) — risco de
      divergência; trabalhar sempre no repo git (`Documents/AKNPT`).
