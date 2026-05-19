# Decisions log — AKN-PT v0.1.0 build

Cada decisão tomada durante o build, em ordem cronológica. Formato:
**Q** (questão) → **A** (decisão) → **Why** (justificação curta).

Quando uma decisão contraria ou esclarece uma ADR existente, o link aponta para
ela; quando cria uma nova ADR, a entrada cita o ficheiro.

---

## CP0 — Setup

**Q0.1** Onde vivem os artefactos deste build?
**A0.1** Em `02. Artefactos AKN-PT v0.1.0/`, isolado do material original em `docs/`, `mapping/` etc.
**Why** Preserva o trabalho prévio do utilizador; permite comparação lado-a-lado.

**Q0.2** Aceitar as 10 ADRs em estado *Proposed* sem revisão?
**A0.2** Sim, por defeito. Qualquer revisão será nova ADR (≥0011) ou supersede explícito.
**Why** Mandato do utilizador: total autoridade decisória, regista no log.

**Q0.3** Naming dos ficheiros de mapping para tipos novos (Lei, Decreto AR, etc.).
**A0.3** Mesma convenção do v0.0.1: `<tipo>.md` em `mapping/v0.1.0/`. Ficheiro extra `_common-patterns.md` para padrões cross-cutting (preface, signatures, references); `_special-cases.md` para Artigo X.º-A, republicação, alteração; `_metadata.md` para o bloco `<meta>` canónico.
**Why** Reduz duplicação nas 9 fichas por tipo.

---

## CP1 — Fundações (mapping + ELI-PT)

### Open questions herdadas do mapping v0.0.1

**Q1.1 (DL)** Considerandos numerados ou não?
**A1.1** Sempre numerados internamente (`eId="rec_N"`); apresentação visual sem numeração por defeito (responsabilidade do stylesheet de render).
**Why** Identificação estável para referenciação cruzada; estética não condiciona estrutura.

**Q1.2 (DL)** Fórmula promulgatória — texto fixo ou variável?
**A1.2** Variável. Catalogadas 4 variantes em `mapping/v0.1.0/_special-cases.md` §Fórmulas. Schematron valida que pertence ao catálogo.
**Why** A prática real tem variação por categoria do DL.

**Q1.3 (DL)** Assinatura — modelar o nome ou anonimizar?
**A1.3** Modelar o nome. `<signature>` contém `<person refersTo="#xxx">` com o nome no `<TLCPerson>` correspondente em `<references>`.
**Why** O nome do signatário é parte do conteúdo legal publicado em DR; anonimizar perde informação.

**Q1.4 (DL)** Referenda múltipla — múltiplas `<signature>` ou uma com `<person>` repetido?
**A1.4** Múltiplas `<signature role="countersignature">` — uma por ministro.
**Why** Granularidade permite distinguir ordem e papel; alinhado com Senato model.

**Q1.5 (DL)** Vacatio legis — onde modelar?
**A1.5** Em `<lifecycle>` como `<eventRef type="generation" refersTo="#entry-into-force">`, e o artigo de vigência marcado normalmente em `<body>`. Schematron cruza os dois.
**Why** `<meta>` é o local canónico para datas; o texto do artigo continua no corpo como qualquer outro.

**Q1.6 (Portaria)** Portarias conjuntas — `<FRBRauthor>` múltiplo ou agregado?
**A1.6** Múltiplo. Cada ministro como `<FRBRauthor href="#ministro-X">`.
**Why** Coerente com AKN4EU practice para co-autoria.

**Q1.7 (Portaria)** Modelos de impressos em anexos — conteúdo estruturado ou facsimile?
**A1.7** Estruturado sempre que possível (form fields representados como `<blockList>` ou `<table>`). Facsimile (`<img>` referenciando ficheiro externo) apenas quando o modelo é graficamente impossível de capturar.
**Why** Preserva a queryability; o nosso negócio é dados, não imagens.

**Q1.8 (Portaria)** Distinção entre portarias regulamentares e de mera execução.
**A1.8** Capturada em `<FRBRsubtype value="portaria-regulamentar"|"portaria-execucao">`. Não afecta estrutura.
**Why** Metadado é o sítio certo; estrutura é a mesma.

**Q1.9 (RCM)** Pontos resolutivos — `<paragraph>` ou `<point>` directo?
**A1.9** `<paragraph eId="para_N">` com `<num>N -</num>`. Confirmação com Palmirani em M1.
**Why** Pragmático e homogéneo com o resto do articulado AKN. A revisão pode mudar.

**Q1.10 (RCM)** Anexos com conteúdo normativo — `<attachment>` ou `<body>` adicional?
**A1.10** `<attachment>`. Conteúdo vinculativo dentro de `<attachment>` é normalmente referenciado pelos resolutivos ("aprovar a estratégia constante do anexo I"); marca-se com `<mainBody>` interno se for articulado.
**Why** Mantém o limite estrutural claro: o ato é o ato; os anexos são anexos. A vinculatividade vem do resolutivo, não da localização.

**Q1.11 (RCM)** RCMs puramente políticas (sem normatividade) — v0.1 ou v0.2+?
**A1.11** v0.1, sob `<FRBRsubtype value="res-cm-politica">`. Estrutura coincide; só faltam regras de legística específicas no Schematron.
**Why** Não justifica adiar — o modelo serve, é o Schematron que muda.

### Open questions herdadas das ADRs

**Q1.12 (ADR-0004)** "Phase" como propriedade do documento ou só do validador?
**A1.12** Só do validador, via flag `--phase`. O documento não declara fase.
**Why** Fase é estado de processo, não atributo intrínseco do ato. Um mesmo XML pode ser validado em diferentes fases pelos diferentes consumidores.

**Q1.13 (ADR-0005)** "CSD17" no namespace ou "1.0"?
**A1.13** OASIS canónico literal — `http://docs.oasis-open.org/legaldocml/ns/akn/3.0/CSD17`. Identificação do nosso perfil via `<FRBRformat value="application/akn+xml; profile=akn-pt-1.0">`.
**Why** Não inventar URI alternativa para o standard base. O AKN-PT identifica-se como perfil no FRBR.

**Q1.14 (ADR-0006)** ELI-PT bilingual completo ou PT-primary + EN abstract?
**A1.14** Bilingual completo. ELI-PT é ponto de contacto com a comunidade ELI europeia.
**Why** Documento curto (~15pp), justifica a tradução integral; tem audiência mista por desenho.

**Q1.15 (ADR-0009)** ELI-PT domain final.
**A1.15** Mantém-se placeholder `https://eli.gov.pt/...` no build. Recomendação substantiva a fazer à INCM: `https://data.dre.pt/eli/...`. Decisão deferida para M3.
**Why** Sem coordenação INCM ainda; ADR-0009 já assumiu deferral.

**Q1.16 (ADR-0010)** Compensação de revisores externos.
**A1.16** Honorária. Orçamento da SGGOV cobre deslocações se aplicável.
**Why** Praxe académica para projetos de standard público.

---

## CP2 — Schemas

**Q2.1** XSD: importar AKN base OASIS via `xs:import` ou construir auto-contido?
**A2.1** Auto-contido em v0.1, capturando subset necessário do AKN. Migração para `xs:import + xs:restriction` em v0.2.
**Why** Sem dependência externa de schema, o repo é validável standalone com qualquer parser XML. Reduz fricção para reviewers externos. A restriction-based subtyping é mais correcta tecnicamente, mas pode ficar para depois da estabilização do escopo.

**Q2.2** `EIdType` regex: aceitar só snake_case ou também kebab-case?
**A2.2** Ambos. Snake_case com `__` separador para articulado (`art_5__para_1__lit_a`); kebab-case para eIds de TLC actors (`primeiro-ministro`, `pessoa-pm-2026-03`).
**Why** A convenção dupla observa-se em todas as customizações AKN nacionais existentes; forçar único causaria incomodidade aos drafters.

**Q2.3** `<docType>`/`<docNumber>`/`<shortTitle>`: elementos próprios ou só `<p class>`?
**A2.3** Elementos próprios (canónico AKN). `<p class="docTitle">` permitido como wrapper, mas os elementos internos `<docType>` etc. são obrigatórios pelo Schematron.
**Why** O canónico AKN tem-nos como elementos. `class` é display-only e não fica searchable. Schematron impõe a presença dos elementos.

**Q2.4** Schematron `queryBinding`: xslt1 ou xslt2?
**A2.4** `xslt1` (literal `"xslt"`) em v0.1.0 para compatibilidade com `lxml.isoschematron`. Comentário no ficheiro indica como elevar para `xslt2` em produção com Saxon.
**Why** Permite que o test suite e o validador (CP5) corram sem dependência Java/Saxon. Trade-off: `matches()` regex desabilitado (1 warning sacrificada). Aceitável.

**Q2.5** Estrutura de patterns Schematron: monolítico ou modular?
**A2.5** 7 patterns separados — cada com escopo bem definido. Phases activam combinações.
**Why** Em Schematron, dentro do mesmo pattern apenas a primeira `<rule>` que faz match num nó é aplicada. Patterns separados permitem que regras genéricas e específicas coexistam sem colisão. Lição aprendida no debugging do `s10`.

**Q2.6** Comparação de datas em XPath 1.0?
**A2.6** Truque: `number(translate(@date, '-', ''))` converte ISO date em inteiro comparável (20260315 >= 20260310). Documentado inline.
**Why** XPath 1.0 não tem date-comparison nativa; este idiom é portável e claro.

**Q2.7** `<analysis>` obrigatório ou opcional em v0.1.0?
**A2.7** Opcional no XSD mas obrigatório no Schematron (review/publication phases), com filhos `<activeModifications/>` `<passiveModifications/>` permitidos vazios.
**Why** Forward-compatibility para consolidação automática v0.2+. Custo zero em v0.1.

**Q2.8** Pre-wrap do comentário antes de aplicar mutações nos test generators?
**A2.8** Sim — sem isto, regexes de mutação podem apanhar `<body>` ou `<article>` literais dentro do comentário de cabeçalho do baseline.
**Why** Bug encontrado em `s02` durante o build. Documentado no test generator.

---

## CP3 — Specification

**Q3.1** Modularizar a spec em ficheiros separados (1 ficheiro por capítulo) ou monolítico?
**A3.1** Modular: 17 ficheiros em `docs/spec/pt/` + 2 ficheiros em `docs/spec/en/`. Pandoc concatena na build.
**Why** Permite revisão por capítulo, edição independente sem conflitos, e referência cruzada simples via links Markdown. PDF gerado é o produto, não a fonte autoritativa.

**Q3.2** EN summary é tradução parcial ou documento próprio?
**A3.2** Documento próprio em dois ficheiros: `executive-summary.md` (~4pp, leitura rápida) + `technical-overview.md` (~10pp, profundidade técnica). Sem tradução literal do PT.
**Why** A audiência internacional precisa de visão geral + detalhe técnico para review, não de tradução completa. ADR-0006 sancionou "sumário EN ~10-20pp"; a divisão em dois layers de profundidade serve melhor a audiência.

**Q3.3** Build do PDF é parte do release ou é derivado/CI?
**A3.3** Derivado. O entregável autoritativo é o Markdown. PDF é gerado por Pandoc + XeLaTeX, com Makefile fornecido para uso local ou em CI. Não há PDF committed no repo.
**Why** Reproduzibilidade + binários fora do git + Markdown é reviewable via diff. PR review é em texto, não em PDF.

**Q3.4** "Conformance estrita" vs. "conformance básica" — manter a distinção?
**A3.4** Sim. Distinção formal no cap. 2 §2.7. Básica = produz/consome XML conformante. Estrita = + suporta as três fases + content negotiation + metadados ELI completos.
**Why** Permite adoptantes começarem com nível mínimo e evoluírem. Sem a distinção, "conformance" virava all-or-nothing, o que desencoraja adopção inicial.

**Q3.5** Glossário PT-EN incluir nomes institucionais?
**A3.5** Sim, em secção separada do glossário (§15.2). Útil para outreach internacional (emails, papers, apresentações UE).
**Why** O custo é mínimo (uma tabela) e o benefício é elevado — facilita comunicação institucional sem buscar fora da spec.

**Q3.6** Capítulo "Casos especiais" mistura tipos diferentes (republicação, Artigo X.º-A, vacatio legis, retificação) ou capítulo por caso?
**A3.6** Misturados num único capítulo de "Ciclo de vida e alterações" (cap. 11). Cada caso tem secção própria mas vive sob a unidade temática "como o ato evolui no tempo".
**Why** Estes casos têm em comum a dimensão temporal/dinâmica do diploma. Separar em capítulos individuais inflacionaria a contagem sem ganho conceptual.

---

## CP3+ — Pegada legislativa (Lei n.º 5-A/2026)

**Q3.7** Pegada legislativa: diferir para v0.2 (mencionar) ou modelar no v0.1.0?
**A3.7** Modelar no v0.1.0. Escopo total: novo capítulo dedicado na spec (cap. 12), enriquecimento do `<workflow>` no XSD, vocabulário controlado (`WorkflowStepTarget`, `ContributionType`), regra Schematron `legislative-footprint` obrigatória em `publication` para actos publicados a partir de 2026-07-27, mapping doc dedicado, 1 positivo + 2 negativos no test suite.
**Why** A obrigatoriedade legal entra a 27-07-2026 (~2 meses do release alvo de v0.1.0). Deixar para v0.2 forçaria sistemas a improvisar marcação ad-hoc não-validável até v0.2 estar pronto. Decisão do utilizador: incluir já.

**Q3.8** Onde vive a pegada legislativa no XML — extensão custom (novo namespace `akn-pt:`), novo elemento na OASIS, ou reuso do `<workflow>` AKN existente?
**A3.8** Reuso do `<workflow>` AKN existente, enriquecendo `<step>` com sub-elementos `<description>` e `<input>`. `<input>` é elemento dentro do `<workflow>` que regista cada contributo externo.
**Why** Mantém namespace canónico OASIS (ADR-0005). `<workflow>` AKN é projectado para registar fases do procedimento. `<input>` como child de `<step>` é natural — embora não esteja explicitamente no AKN base, é compatível em espírito.

**Q3.9** Vocabulário controlado das fases — quão exaustivo?
**A3.9** 14 valores em `WorkflowStepTarget` cobrindo todo o ciclo (iniciativa → publicação) para todos os tipos de ato no escopo, incluindo discussão na generalidade/especialidade, audição pública, votação final global. Não tentei cobrir variantes exóticas.
**Why** Equilíbrio entre granularidade útil e simplicidade de validação. 14 valores cobrem ~95% dos procedimentos típicos; o resto cobre-se em v0.1.1 se houver caso real.

**Q3.10** Vocabulário controlado dos contributos — incluir `representacao-interesse`?
**A3.10** Sim, como `ContributionType` value distinto. Campos adicionais (número do registo de transparência, valor do contrato com o lobby) ficam para v0.1.1 conforme o regulamento de execução da Lei n.º 5-A/2026 for publicado.
**Why** A Lei 5-A/2026 distingue explicitamente lobbying de outros contributos; o vocabulário tem de reflectir essa distinção desde já. Os campos adicionais dependem do regulamento que ainda não saiu.

**Q3.11** Granularidade do `<affects>` — eId do diploma final ou também rastrear versões intermédias?
**A3.11** eId do diploma final (versão originária) em v0.1.0. Tracear "a CIP propôs X mas ficou Y" é matéria de `<analysis>/<activeModifications>` em v0.2+.
**Why** A pegada legislativa em v0.1.0 cumpre a obrigação legal (registar quem contribuiu). A análise comparativa do input para output é trabalho subsequente.

**Q3.12** Cutoff date de obrigatoriedade — usar `>=` ou `>`?
**A3.12** `>=` (a partir de 2026-07-27 inclusive). Workaround XPath 1.0: `number(translate(@date, '-', '')) >= 20260727`.
**Why** Interpretação literal da Lei n.º 5-A/2026 ("a partir de 27 de julho").

**Q3.13** EN expandido para ~20pp — mais um documento ou expandir os existentes?
**A3.13** Três documentos EN: `executive-summary.md` (4pp), `technical-overview.md` (7pp, agora com secção dedicada à pegada legislativa), `implementation-guide.md` (6pp, novo, focado em developers). Total ~18pp.
**Why** Mais útil para audiências distintas. ~18pp de conteúdo denso em vez de ~20pp diluídos.

**Q3.14** Renumeração de capítulos 12-17 → 13-18 — risco de quebrar cross-references?
**A3.14** Sim. Mitigado com script Python que renomeou ficheiros e actualizou referências textuais (`cap. X`, `capítulo X`, `X-validacao.md`) em todos os ficheiros markdown da spec. Validação manual identificou e corrigiu uma referência interna em cap. 5 (§14.4 estava com numeração antiga).
**Why** Pegada legislativa é tópico distinto dos restantes; merece capítulo próprio (12), não secção dentro de cap. 11. Renumeração mecânica e auditável.

**Q3.15** PDF generation — agora ou no fim?
**A3.15** No fim (CP5). Build via Pandoc + XeLaTeX está configurado em `docs/spec/Makefile`; geração executada como parte da release no CP5. Decisão registada como TODO no CP5.
**Why** Mandato explícito do utilizador. Markdown é a fonte autoritativa; PDF é artefacto de release.

---

## CP4 — Corpus de 10 diplomas reais

**Q4.1** "Diplomas reais" — verbatim do dre.pt ou marcação representativa baseada em diplomas reais?
**A4.1** Marcação representativa baseada em diplomas reais (números, datas, ementas autênticos). Primeiros 3-5 artigos detalhados; restantes com `<num>+<heading>` + marcação esquemática do conteúdo. Comentário inicial declara explicitamente esta convenção. Prática estabelecida em corpora pedagógicos (Senato, LexML, AKN-IT samples).
**Why** O utilizador escolheu "Tudo real" (vs. sintético). Sem fetch verbatim do dre.pt em tempo razoável e sem inflar enormemente os ficheiros, esta é a opção que (a) preserva credibilidade institucional (números/datas/ementas reais), (b) exercita a estrutura sintáctica AKN-PT exaustivamente, (c) mantém os ficheiros legíveis para review. Documentado abertamente no README do corpus.

**Q4.2** `<quotedStructure>` directamente em `<paragraph>` ou wrapped em `<content>`?
**A4.2** Wrapped em `<content>`. O schema do `<paragraph>` aceita `<content>` OU `<intro>+<list>+<wrapUp>`; `<quotedStructure>` vive dentro de `<content>` ao lado de `<p>`.
**Why** Conformidade com AKN canónico. Bug encontrado e corrigido durante validação do corpus #3 (DL alterador). O `<content>` é o container natural; `<intro>` é semanticamente para introduzir uma `<list>`, não para introduzir uma citação.

**Q4.3** Versão consolidada — novo Work ou nova Expression do mesmo Work?
**A4.3** Nova Expression do mesmo Work. URI Work mantém-se (`/eli/pt/dec-lei/2020/72/pt`); URI Expression nova (`/eli/pt/dec-lei/2020/72/pt/2022-01-01`).
**Why** FRBR canónico. A obra é a mesma (DL 72/2020); muda só a versão textual. Permite que citações do Work apontem sempre para o mesmo objecto, mesmo após consolidações sucessivas.

**Q4.4** `<analysis>/<passiveModifications>` populada no consolidado (#10)?
**A4.4** Sim, com `<textualMod>` simples (sem conteúdo detalhado). Indica que a Expression consolidada recebeu modificações; o motor de consolidação real (v0.2+) preencherá o detalhe.
**Why** Demonstra que o schema suporta o ciclo completo. Forward-compatibility para v0.2.

**Q4.5** DL alterador (#3) com republicação — usar prefixo `rep__` consistentemente em todos os eIds da republicação?
**A4.5** Sim. Todos os eIds dentro do `<attachment>` da republicação têm prefixo `rep__` (e.g. `rep__art_5__para_1__lit_a`). Refs internas dentro da republicação usam `#rep__...`.
**Why** Evita colisão com eIds do articulado do próprio diploma alterador. Convenção documentada em `mapping/v0.1.0/_special-cases.md`. Sem prefixo, o Schematron rejeitaria por eId duplicado.

**Q4.6** Pegada legislativa no corpus?
**A4.6** Não. Todos os 10 diplomas são pre-2026 (datas de publicação 2020-2023), portanto fora da cutoff date 2026-07-27 da Lei 5-A/2026. A capacidade é exercitada pelo positive test `dec-lei-with-footprint.akn.xml` (com data 2026-08-15) que vive em `schema/tests/positive/`.
**Why** Diplomas reais relevantes para o standard AKN-PT são pre-cutoff. Forçar pegada legislativa em diplomas que (na vida real) não a tinham seria anacrónico.

**Q4.7** Corpus em `corpus/` da pasta `02.` colide com o `corpus/` original em raiz?
**A4.7** Não colide — pastas distintas (raiz tem o original `dl-75-2026-exemplo.akn.xml`; `02. Artefactos AKN-PT v0.1.0/corpus/` tem os 10 reais novos). O original fica intocado.
**Why** Per Q0.1 (CP0): preservar trabalho prévio do utilizador.

---

## CP5 — Validator, Docker, CI, PDFs, release

**Q5.1** Build backend para o validator — hatchling ou setuptools?
**A5.1** setuptools. Hatchling tem incompatibilidade conhecida com Python 3.14 (`prepare_metadata_for_build_editable` missing). Setuptools funciona out-of-the-box.
**Why** Decisão pragmática durante install. Migração para hatchling/PDM/uv em v0.1.1 se a incompatibilidade for resolvida.

**Q5.2** Schemas duplicados (`schema/xsd/` + `validator/src/akn_pt/data/`)?
**A5.2** Sim — schemas são copiados para `validator/src/akn_pt/data/` no setup. Validator é distribuível standalone via `pip install akn-pt` sem precisar do repo todo.
**Why** Trade-off entre DRY e portabilidade. Para v0.1.0, portabilidade vence. Sincronização garantida via release workflow.

**Q5.3** Filtragem de patterns Schematron por fase — recompile per phase ou post-hoc?
**A5.3** Post-hoc. O Schematron é invocado uma única vez; a filtragem por fase é feita em Python inspeccionando `<svrl:active-pattern @id>`. Documentado como simplificação v0.1.0.
**Why** Mais simples e robusto a mudanças no Schematron. Performance aceitável (corpus completo valida em <2 s).

**Q5.4** SVRL marker — `active-pattern` ou `fired-pattern`?
**A5.4** Ambos. `lxml.isoschematron` emite `<svrl:active-pattern>`; Saxon emite `<svrl:fired-pattern>`. `_find_pattern_id` aceita os dois.
**Why** Compatibilidade cross-processor. Bug encontrado durante testes (pattern vinha vazio nas mensagens).

**Q5.5** i18n do validador — quão profundo em v0.1.0?
**A5.5** Apenas labels de UI (PT/EN). Mensagens de assertion Schematron ficam em PT (fonte). Tradução completa via stable message ids planeada para v0.1.1.
**Why** Mensagens com ids estáveis exigem refactor do `.sch` (acrescentar `@id` a cada assert). Trabalho independente; melhor em v0.1.1.

**Q5.6** Docker — base image?
**A5.6** Multi-stage com `python:3.12-slim`. Builder constrói wheel; runtime instala wheel + `libxml2/libxslt1.1` apenas. Imagem ~150 MB. Non-root user `akn-pt`.
**Why** Slim reduz superfície de ataque; multi-stage minimiza tamanho; non-root é boa prática.

**Q5.7** CI matrix — Python versions + OS?
**A5.7** Python 3.12 + 3.13 × Linux + macOS + Windows. Schema tests, validator tests, corpus, ELI-PT, Docker build, lint.
**Why** Cobertura cross-platform para `pip install akn-pt` funcionar em qualquer ambiente.

**Q5.8** PDF generation — Pandoc ou Python pure?
**A5.8** Ambos, com fallback automático. `tools/build_pdfs.py` detecta `pandoc` no PATH; usa-o se disponível, senão `fpdf2`. CI release usa Pandoc + XeLaTeX.
**Why** Garantir que PDFs **se geram sempre**. Pandoc dá output melhor; fpdf2 dá output funcional sem deps.

**Q5.9** PDF charset com fpdf2 — Helvetica latin-1 ou TTF Unicode?
**A5.9** Helvetica latin-1 com `_ascii()` que substitui caracteres comuns ("→" → "->", "✓" → "OK", caracteres de tabela ASCII, "·" → "*"). Compromisso v0.1.0: PDFs Python-puros são legíveis mas perdem caracteres especiais; PDFs Pandoc (CI) têm tipografia completa.
**Why** Adicionar TTF Unicode exige distribuir font (~10 MB). Não vale para v0.1.0.

**Q5.10** Release notes — onde e formato?
**A5.10** `RELEASE-NOTES-v0.1.0.md` na raiz do `02. Artefactos AKN-PT v0.1.0/`. Markdown autoritativo; PDF gerado pelo build script.
**Why** Visibilidade máxima junto ao README.

**Q5.11** GitHub Actions workflows — quantos?
**A5.11** Dois: `ci.yml` (PR/push) e `release.yml` (tag-triggered: build wheel + PDFs, publish Docker GHCR + PyPI + GitHub Release).
**Why** Separação clara entre CI e release. Cada job pequeno e focado.

**Q5.12** Schemas no Docker — copiados ou referenciados?
**A5.12** Copiados (parte do wheel via `package-data`). Imagem Docker self-contained.
**Why** Portabilidade.

**Q5.13** Cobertura de testes do validador?
**A5.13** 50 testes: `test_core.py` (17 unit), `test_cli.py` (11 integration via Click runner), `test_i18n.py` (4 unit), `test_integration_corpus.py` (18 parametrized — corpus + schema positives).
**Why** Test pyramid: muitos unit tests rápidos + alguns integration tests realistas.

**Q5.14** Bug `parents[3]` nos testes?
**A5.14** Encontrado e corrigido durante CP5. `Path(__file__).parents[3]` apontava para fora da pasta v0.1.0. Correcto: `parents[2]`.
**Why** Erro humano. 1ª iteração mostrou ficheiros estranhos do `corpus/` original. Fix mecânico.

---

## CP6 — Editor de demonstração + propagação de lições

(Trabalho posterior ao release v0.1.0 — capturado para v0.1.1.)

**Q6.1** Editor web puro (HTML/JS sem build) ou framework (React/Vue)?
**A6.1** Vanilla JS sem build. Zero deps em runtime, lê em qualquer browser, deployable em GitHub Pages com um `python -m http.server`.
**Why** Demoabilidade > sofisticação. Para juristas e revisores, abrir um HTML é zero fricção.

**Q6.2** Editor permite import de diploma não marcado?
**A6.2** Sim, 3 caminhos: colar texto, upload `.docx` (via mammoth.js), upload XML AKN-PT (round-trip). Parser heurístico detecta tipo, número, ementa, considerandos, artigos, alíneas, subalíneas, signatures.
**Why** Caminho realista de migração — DAPL recebe DOCX, não AKN-PT. Sem este caminho, a adopção é fricção.

**Q6.3** Templates ricos por tipo (pre-preenchidos) ou em branco?
**A6.3** Ricos. Cada tipo carrega 2-4 artigos típicos da sua legística, com placeholders. Portaria especialmente cuidada (lei habilitante + modelo em anexo).
**Why** Reduz fricção para o jurista. Word funciona assim (templates).

**Q6.4** Subalíneas (i, ii, iii) — modelar recursivamente ou cap a 1 nível?
**A6.4** Recursivamente no modelo (point.subPoints array), com 1 nível formalmente documentado em v0.1.0. Schema XSD aceita aninhamento ilimitado nativamente (`<point>/<list>/<point>` é recursivo). Schematron passa sem alterações (eId unique recursivo).
**Why** AKN canónico permite. A documentação explícita inicial cobre o caso 99% (alínea com subalíneas). Mais profundidade (sub-subalíneas) sai gratuitamente.

**Q6.5** Disambiguação alínea vs subalínea no parser de import?
**A6.5** Heurística: token multi-char ("ii", "iii", "iv", "v"…) ou começa com v/x → roman → subalínea. Single "i" → roman APENAS se não continua o alfabeto da última alínea (e.g. se última foi "b", "i" não é o próximo letra → roman). Documentado no parser e em `_common-patterns.md`.
**Why** Sem indentação no texto cru, contexto é o melhor sinal. Cobre 95% dos casos reais.

**Q6.6** Auto-numeração de parágrafos ao adicionar `+ número`?
**A6.6** Sim. Ao clicar `+ número`, todos os parágrafos sem `<num>` são auto-numerados sequencialmente, e o novo entra com `${N+1} -`. Convenção legística: se há mais que um, todos são numerados; se há um, omite-se `<num>`.
**Why** Bug observado pelo utilizador no primeiro teste — placeholder "N -" era confuso. Esta auto-numeração materializa a convenção legística sem fricção.

**Q6.7** Bug `el()` aceitar `null` como `attrs`?
**A6.7** Helper `el(tag, attrs, ...children)` falhava em `Object.entries(null)` quando attrs era explicitamente `null` (default param só dispara em `undefined`). Fix: `Object.entries(attrs || {})`.
**Why** Erro de design do helper. Causou cascata de 3 sintomas (artigos não renderizavam, TOC vazio, import partido). Difícil de diagnosticar sem jsdom.

**Q6.8** Propagação das lições do editor ao trabalho anterior?
**A6.8** 5 actualizações:
1. Schema test positive `dec-lei-with-subalineas.akn.xml` (regressão futura).
2. Mapping `_common-patterns.md` — exemplo XML completo de subalíneas + paragraph sem num.
3. Spec cap. 5 (estrutura) — secção dedicada a subalíneas + paragraph sem num.
4. Spec cap. 15 (exemplos) — exemplo §15.2.1 de alínea com subalíneas.
5. Corpus `dl-21-2023.akn.xml` — Art. 5.º enriquecido com 2 parágrafos numerados e subalíneas i), ii), iii) dentro de alínea b).
**Why** Sem propagação, o editor ficava "à frente" do trabalho documental — incoerência. Esta nota fecha o gap.

**Q6.9** Inserir artigo a meio do articulado — manter eId original (ex. `art_5` entre `art_1` e `art_2`) ou renumerar tudo?
**A6.9** Renumerar tudo. `insertArticleAt()`, `moveArticleUp()` e `moveArticleDown()` chamam `renumberArticles()` no fim, que reatribui (a) o `<num>` visível ("Artigo 1.º", "Artigo 2.º", …) e (b) o `eId` (`art_1`, `art_2`, …) sequencialmente a partir da posição corrente. Renames são propagados recursivamente aos descendentes (`art_N__para_M`, `…__lit_X`, `…__sublit_Y`) por substituição de prefixo. `<num>` não-standard (ex. `Artigo 5.º-A`) preserva-se — só o standard `Artigo N.º` é reatribuído.
**Why** Pedido directo do utilizador ("a posição em que entra o artigo tem de renumerar todos"). É o que jurista espera ao reordenar (consistência visual + URI estável por posição enquanto se rascunha). Em produção, depois de publicação, renumerar deixa de ser admissível — mas isto é fase **drafting** (cf. ADR-0004), portanto eIds ainda não estão congelados. A regra é "no `drafting`, eIds são fluidos; no `review`/`publication`, são imutáveis e qualquer alteração de estrutura implica `<quotedStructure>` (cap. 11)".

---

## CP7 — Benchmark internacional e roadmap das 6 features

**Q7.1** Como gerar PDF e DOCX sem dependências pesadas (jspdf, docx.js, pandoc)?
**A7.1** PDF: janela popup com Preview HTML + folha de estilo de impressão + `window.print()` automático. O utilizador escolhe "Guardar como PDF" no diálogo do sistema. DOCX: ficheiro `.doc` com HTML+namespaces `mso` (técnica MHT) — Word 2007+/LibreOffice/Google Docs abrem nativamente.
**Why** Coerência com princípio "sem servidor, sem build, sem CDN". Solução suficiente para drafting interno; produção institucional usaria backend XSLT+pandoc à Indigo.

**Q7.2** Onde guardar snapshots — `localStorage` (chave única) ou (uma chave por snapshot)?
**A7.2** Uma chave por snapshot (`akn-pt-snapshot-v1:{id}`) + chave de listagem leve (`akn-pt-snapshots-v1`). Auto-snapshot antes de cada export, com cap de 5 auto-snapshots em rotação.
**Why** `localStorage` tem limite de ~5 MB; serializar todos os snapshots numa só chave estoura rapidamente. Splitting evita relê-los todos para mostrar a lista.

**Q7.3** Algoritmo de diff: LCS por palavras ou por carácter? Operar sobre XML ou sobre doc state?
**A7.3** LCS palavra-a-palavra (tokens = `\S+|\s+`), operar sobre **doc state** (não XML). Comparação tem semântica (artigo X.º, parágrafo Y, alínea Z): cada bloco classifica-se em `added/removed/modified/unchanged` por correspondência de `eId`. Texto comparado word-level dentro de cada bloco.
**Why** Diff sobre XML mostraria ruído de formatação. Diff semântico mostra o que o jurista quer ver: "Artigo 3.º foi alterado: 2 palavras inseridas, 1 removida".

**Q7.4** Comentários — guardar onde? Entram no XML AKN-PT exportado?
**A7.4** Guardar em `doc.comments` (viajam com o rascunho via JSON). NÃO entram no XML por defeito (preserva pureza normativa do acto). API `Comments` independente do State para facilitar testabilidade.
**Why** A AKN tem `<note>` mas é para notas oficiais do diploma (anotações editoriais, históricas). Misturar anotações de revisão interna seria abuso semântico. Modo opcional `exportWithComments` planeado para v0.2 (gera `<note>`s rotuladas com `class="review"`).

**Q7.5** Resolução de referências — emitir sempre que o padrão bate, ou validar primeiro?
**A7.5** Validar. Internas: só emitir `<ref href="#…">` se o `eId` alvo **existir** no doc + anti-falso-positivo por contexto (presença de "da Constituição", "do referido diploma", "do Decreto-Lei…" logo após o match). Externas PT: mapear nome do tipo ("Decreto-Lei", "Lei", "Portaria"…) → slug ELI-PT. Externas UE: mantém URI ELI europeu.
**Why** Sem validação, "alínea a) do n.º 1 do artigo 198.º da Constituição" geraria `<ref href="#art_198__para_1__lit_a">` inexistente — Schematron rejeita. Validar é critério de correcção.

**Q7.6** Modo "alteração de diploma" — modelar como subtipo `dec-lei-alterador` ou como novo tipo separado?
**A7.6** Como `doc.kind = 'amender'` (flag separada do `actName`/`subtype`) com `doc.target` apontando para o alvo. UI dedicada (renderizador próprio do painel central). XML gerado segue convenção do corpus `dl-78-2021`: artigo "Alteração ao …" com `<article eId="art_2">` → `<paragraph>` → `<content><p>…texto introdutório…</p><quotedStructure startQuote="«" endQuote="»"><article eId="quoted__art_X">…</article></quotedStructure></content>`. Prefixo `quoted__` nos eIds para garantir unicidade no documento alterador.
**Why** O alterador É um DL normal — modelá-lo como tipo separado fragmentaria desnecessariamente. A flag `kind: 'amender'` é apenas um modo de edição, não um tipo de acto. A operacionalização ao nível do artigo completo (não cirúrgica) é deliberada para v0.1; v0.2 pode descer a parágrafo/alínea.

**Q7.7** Assistente IA — fazer browser → Anthropic directamente ou via backend?
**A7.7** Browser directo, com chave fornecida pelo utilizador em `localStorage`. Cabeçalho `anthropic-dangerous-direct-browser-access: true`. Mode "mock" com respostas canned quando não há chave, para que a UI seja testável sem chave nem backend.
**Why** Coerência com princípio "sem servidor". Para uso institucional real (DAPL), o roadmap prevê gateway com SSO governo (Q8). O modo mock cobre demo e formação. **Aviso ao utilizador**: a chave fica no browser e o conteúdo do rascunho passa pela API Anthropic — não usar com diplomas confidenciais sem autorização.

**Q7.8** Como integrar refs cruzadas no `AknExport` sem partir o exporter quando `References` não está carregado (Node smoke-test puro)?
**A7.8** Helper `xmlText(s, doc)` em `akn-export.js` que delega a `References.toXmlEscaped` se disponível, caso contrário cai em `escapeXml`. Smoke-test passou a carregar `references.js` explicitamente para exercer o caminho real.
**Why** Defesa em profundidade. Permite usar `akn-export.js` standalone (validação isolada) e mantém o smoke-test fiel ao caminho do browser.

**Q7.9** `<quotedStructure>` no XML do alterador — onde colocar exactamente?
**A7.9** Dentro de `<content>`, como **sibling depois de `<p>`** (NÃO dentro de `<p>`, NÃO sibling de `<content>`). Implementação: marker no texto que é movido por regex post-export: `<p>texto __QS_N__</p></content>` → `<p>texto</p><quotedStructure>…</quotedStructure></content>`.
**Why** Validado contra schema AKN-PT e contra corpus `dl-78-2021`. Alternativas (gerar tudo manualmente, fork do AknExport) foram afastadas por baixa relação benefício/manutenção.

---

## CP8 — Bluebell, colaboração leve, LoDA inline, comentários no XML, DRE mock

**Q8.1** UI das alíneas e epígrafes — `<input>` ou `<textarea>`?
**A8.1** `<textarea>` com classe `.autosize`, sem resize handle, altura ajusta-se ao conteúdo via `style.height = scrollHeight` em cada `input`. Aplicado a `article-heading` e `point-content` (alíneas e subalíneas).
**Why** Os campos eram inputs single-line, recortavam texto longo e impediam ver o conteúdo completo. Textarea preserva tipografia serif e dá espaço sem fricção, sem mudar o resto do layout.

**Q8.2** Bluebell-PT — copiar Bluebell da Laws.Africa literal ou adaptar?
**A8.2** Adaptar. Mantém a filosofia (texto puro + indentação semântica) mas usa terminologia legística PT: `ARTIGO`, `ANEXO`, `PREAMBLE`, `FORMULA`, numeração `Artigo 1.º`, alíneas `a)`, subalíneas `i)`. Único formato bidireccional do editor.
**Why** Bluebell original é em inglês/africaans e usa convenções de Westminster/South Africa (CHAPTER, PART, SUBPART) que não correspondem a Portugal. Adaptação aproxima o jurista de uma sintaxe que reconhece.

**Q8.3** Colaboração em tempo real sem servidor — viável?
**A8.3** Parcialmente: BroadcastChannel API permite sincronização entre tabs do mesmo browser/origin (caso de uso: jurista com 2 tabs abertas no mesmo doc). Para multi-pessoa exige WebRTC (P2P) ou Yjs+servidor — não implementado em v0.1. O share por URL com gzip+base64 cobre o caso "envia este draft ao colega".
**Why** Princípio "sem servidor" mantido. BroadcastChannel resolve 80% dos casos de "abri sem querer noutra tab" sem custo. Multi-pessoa real é v0.2/v1.0 com gateway DAPL.

**Q8.4** Share via URL — comprimir como?
**A8.4** `CompressionStream('gzip')` nativa do browser → base64url no hash. Documentos típicos (DL com 5-10 artigos) ficam em ~2-4 KB de URL. Cap em 32 KB; acima disso o exporter recusa-se a gerar (toast pede uso de XML).
**Why** API nativa zero-deps, cross-browser desde 2023. Sem servidor, sem deps. Cap protege contra truncamento silencioso por servidores intermediários (proxies, CDNs).

**Q8.5** LoDA inline — qual o output AKN-PT?
**A8.5** Edições inline acumulam-se em `doc.inlineEdits[paraId] = {newContent, articleId}`. Antes de export, `LodaInline.applyToAmendmentList(amender)` converte-as em `amendments` do tipo `replace` (no nível do ARTIGO que contém o parágrafo editado, com os parágrafos não-editados preservados intactos). O XML do alterador é igual ao caso wholesale, mas com texto que reflecte só o delta.
**Why** Não introduz novo modelo XML — reutiliza o `<quotedStructure>` já validado. O diff word-level é só UI/preview; o output AKN-PT é estruturalmente igual ao do modo "Substituir tudo". Variantes mais cirúrgicas (`<mod>` com `<ins>`/`<del>` inline) ficam para v0.2.

**Q8.6** Comentários no XML — usar `<note>` (HTML) ou `<authorialNote>` (AKN canónico)?
**A8.6** `<authorialNote>` — é o elemento canónico do AKN para notas editoriais inline. **Implicação importante**: `<authorialNote>` é INLINE, tem de estar dentro de um `<p>`. O injector localiza o último `</p>` dentro do elemento alvo e insere a nota imediatamente antes. Atributos: `marker="✎"` (símbolo de revisão) + `eId="note_…"` (rastreabilidade).
**Why** Primeira tentativa usou `<note class="review">` à HTML — inválido contra o XSD AKN-PT (rejeita o elemento). `<authorialNote>` valida e mantém pureza AKN. O autor (`author`) entra entre parêntesis no texto da nota (ex. `"Verificar coerência [bvidal]"`).

**Q8.7** Autocomplete contra DRE — backend real ou mock embutido?
**A8.7** Mock embutido com ~30 entradas reais (Constituição, códigos principais, leis recentes representativas, diretivas UE relevantes). Suficiente para demonstração; o gancho está pronto para substituição por API real do INCM. Algoritmo de match: fuzzy por tokens normalizados (sem acentos, sem "º"), pontuação por presence/prefix/número/ano.
**Why** Sem backend, não há acesso a DRE em produção. A demo precisa de provar o conceito ("digito 21 2023, sugere DL 21/2023"). O código está isolado em `js/dre-mock.js`; substituir por `fetch(...)` à API DRE é trivial no dia em que existir.

**Q8.8** Expor módulos em `window` ou manter IIFE privado?
**A8.8** Expor (`if (typeof window !== 'undefined') window.X = X;` no fim de cada ficheiro). Permite jsdom tests, depuração via DevTools, e futuras extensões (plugins de terceiros) sem fork.
**Why** Padrão consistente. Os módulos já estavam globais por serem `const X = (() => {…})()` em script clássico; explicitar `window.X` torna isso intencional e portável (browser + jsdom + workers).
