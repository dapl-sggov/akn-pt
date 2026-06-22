# AKN-PT — Roadmap (fonte única)

Estado a 2026-06-23. Substitui as listas de próximos passos dispersas.

## Estado atual (v0.2)

ELI-PT **alinhado com o template real e em produção da INCM** (`data.dre.pt`),
verificado empiricamente. Tudo verde: schema **47/47** · corpus 8/8 (reais) ·
validador 50/50 · conversão 23/23 · editor smoke+UI (25/25) · CI 15/15.

Fonte única do esquema ELI: [`eli-pt/incm-eli-reference.md`](eli-pt/incm-eli-reference.md).
Decisão registada: [ADR-0012](docs/adr/0012-eli-pt-incm-real-template.md).

## Feito

### Cadeia de alinhamento ELI (v0.2)
- [x] `data.dre.pt` canónico; citação completa → construível; **slugs reais** da
      INCM; **forma real** do URI (Work `/{p|a|m}/dre`, consolidadas `/cons`,
      território `a`/`m`); habilitante `based_on`; língua `pt`/`PRT`.
- [x] **Corpus** de 8 diplomas **reais verificados** (ELI resolve no DR).
- [x] **Editor** emite a forma canónica + RDFa/JSON-LD com paridade INCM
      (`uri_schema`, `publisher_agent`, `legal_value`, `based_on`).
- [x] **Docs** coerentes (spec PT/EN, cap. 08, uri-templates, exemplos);
      kit de reunião INCM repensado.

### Editor — funcionalidades
- [x] **Deploy** `akn-pt.pages.dev` reconectado e a servir a versão atual.
- [x] **Vocabulário nacional de assunto** (`is_about`, ~35k descritores INCM;
      índice lazy + módulo SubjectVocab) e **picker** na UI (chips + badge EuroVoc).
- [x] **Crosswalk** descritores INCM → EuroVoc (3810 matches; `eli:is_about`
      emite descritor nacional **+** conceito EuroVoc). *(cobertura 10.85% — o
      resto são entidades nomeadas; futuro: matching difuso + curadoria.)*
- [x] **Static act-index** do Atom feed (383 atos) + módulo `ActIndex` na busca DRE.
- [x] **eId↔num** cross-check (STR-0010) no `validation.js`.
- [x] **UI de regionais** (select Região → `pt-20`/`pt-30`, território `a`/`m` no
      URI) e **de consolidadas** (fluxo amender → `/cons/{AAAAMMDD}`).
      Verificado end-to-end (UI → estado → `workUri`).
- [x] **Identidade visual v3.1** ("Cockpit de drafting" intensificado): hero
      tipográfico, atmosfera, movimento de entrada, masthead responsivo, cards
      com profundidade, favicon, **cache-bust do CSS**, tick latão nos painéis;
      **a11y** (`aria-label` nos botões só-ícone, `lang=pt-PT`). Verificação
      visual Playwright (1440 + 375), consola 0 erros.

### Schema / validador
- [x] **Schematron — território** (`TERR-0001`): marcador `/a|/m|/p` no URI Work
      ↔ `FRBRcountry` (`pt-20`/`pt-30`/`pt`). Fixtures positiva (canónica) + negativa.

### Higiene
- [x] **ADRs**: estados `Proposed` → `Accepted` (DAPL como autoridade interina,
      ADR-0001; ratificação pela Comissão quando constituída); índice do README
      atualizado (0001–0012, 0009 superada por 0012).

## ⛔ Bloqueado pela reunião INCM (2026-07-01)

Itens que dependem de decisão conjunta SGGOV–INCM. **Não acionáveis** antes da
reunião; o guião está em [`eli-pt/meeting-incm-2026-07-01.md`](eli-pt/meeting-incm-2026-07-01.md).

- [ ] Confirmar `decreto-ar→dec`; data-da-citação = data-do-path; consolidadas/língua.
- [ ] **Estrutura na origem** (tema central): mapeamento **AKN-PT ↔ XML interno
      da INCM**; abertura do SSA a captura estruturada a montante.
- [ ] **Governação**: protocolo SGGOV–INCM (quem norma o perfil, quem opera).
- [ ] **2.ª série** (desde 1991): tipos a incluir no escopo conjunto.
- [ ] **Vocabulário de assunto** nacional + ponte → EuroVoc (refinamento conjunto).
- [ ] Lacuna **pré-1991** (1.ª série não resolve, ex. Cód. IRS).
- [ ] A leitura linha-a-linha do template está feita em `incm-eli-reference.md`;
      **confirmação final na reunião**.

## Contínuo (pós-v0.2, não-bloqueante)

Melhorias incrementais que podem avançar a qualquer momento, sem dependência da
reunião.

- [ ] **Corpus**: exemplos **reais** de consolidada/retificação/republicação
      (o CCP tem consolidação real `…/cons/…`); crescer via harvest do Atom feed.
- [ ] **Citação→ELI** para citações abreviadas (lookup de data via feed; limitado
      pela janela móvel ~2 meses do feed — exigiria outra fonte para histórico).
- [ ] **`is_about` no perfil**: documentar no spec/schema (no editor já emite).
- [ ] **Schematron**: slug contra o vocabulário controlado da INCM
      (`dre-incm-pt-resource-type.rdf`).
- [ ] **EuroVoc**: matching difuso + curadoria manual dos temáticos de topo.

## Higiene (ongoing)

- [ ] Cópias OneDrive do repo (cwd da sessão é OneDrive não-git) — risco de
      divergência; trabalhar sempre no repo git (`Documents/AKNPT`).
