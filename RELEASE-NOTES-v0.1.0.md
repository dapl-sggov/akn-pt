# AKN-PT v0.1.0 — Release Notes

**Data:** 2026-05-18
**Estado:** v0.1.0 (proposta) — primeira release pública
**Autoridade:** DAPL / Secretaria-Geral do Governo (SGGOV)
**Licença:** EUPL-1.2

---

## 1. O que é o AKN-PT v0.1.0

O **AKN-PT** é o perfil nacional português do standard internacional Akoma
Ntoso 1.0 (OASIS LegalDocML), aplicado à representação estruturada de atos
normativos publicados em Portugal.

A v0.1.0 estabelece a **fundação técnica** completa do perfil:

- Especificação documental (PT + EN);
- Esquemas XSD modulares;
- Regras Schematron com validação em três fases;
- Esquema canónico de identificadores ELI-PT;
- Catálogo de mapeamento PT→AKN para 9 tipos de ato;
- Corpus de 10 diplomas portugueses reais marcados;
- Validador de referência (Python + Docker);
- Suporte completo à pegada legislativa (Lei n.º 5-A/2026).

## 2. Estatísticas do release

| Componente | Métrica |
|---|---|
| Capítulos da spec PT | 18 |
| Páginas spec PT | ~63 |
| Documentos EN | 3 (executive summary + technical overview + implementation guide) |
| Páginas spec EN | ~18 |
| ADRs em estado *Proposed* | 10 |
| Tipos de ato cobertos | 9 (4 com cobertura completa, 5 com skeleton) |
| Subtipos catalogados | 27 |
| Fichas de mapping PT→AKN | 13 (9 por tipo + 4 transversais) |
| Módulos XSD | 4 |
| Patterns Schematron | 9 |
| Fases de validação | 3 (drafting, review, publication) |
| Ficheiros XML de teste do schema | 42 (10 positivos + 20 XSD-negativos + 12 Schematron-negativos) |
| Ficheiros XML do corpus | 10 (diplomas reais portugueses) |
| Testes pytest do validador | 50 |
| Testes pytest do conversor ELI-PT | 13 |
| **Total ficheiros XML validados** | **52** |
| **Total testes Python verde** | **63** |
| Decisões registadas (decisions-log) | 31 |

## 3. Os sete artefactos da v0.1.0

| # | Artefacto | Localização | Estado |
|---|---|---|---|
| 1 | Especificação (PT + EN) | `docs/spec/` | ✓ Completa |
| 2 | XSD modular | `schema/xsd/` (4 ficheiros) | ✓ Completa, testada |
| 3 | Regras Schematron | `schema/schematron/akn-pt-rules.sch` | ✓ Completa, testada |
| 4 | Especificação ELI-PT | `eli-pt/` (5 docs + conversor + testes) | ✓ Completa |
| 5 | Mapping PT→AKN | `mapping/v0.1.0/` (13 ficheiros) | ✓ Completa |
| 6 | Corpus | `corpus/` (10 diplomas reais) | ✓ Completa, validada |
| 7 | Validador Python | `validator/` (CLI + lib + Docker + CI) | ✓ Completa, 50/50 testes |

## 4. Tipos de ato cobertos

### Cobertura completa (mapping + corpus + XSD)

- **Decreto-Lei** (4 variantes: ordinário, autorizado, parlamentar, transposição; + cumulativo: alterador)
- **Lei** da Assembleia da República (5 subtipos: comum, orgânica, de bases, autorização, revisão)
- **Portaria** (3 subtipos: regulamentar, execução, extensão)
- **Resolução do Conselho de Ministros** (3 subtipos: normativa, política, administrativa)

### Cobertura skeleton (mapping + XSD; corpus parcial)

- **Decreto da AR** (1 exemplo no corpus) — 3 subtipos
- **Resolução da AR** — 4 subtipos
- **Despacho normativo** (1 exemplo no corpus) — 2 subtipos
- **Decreto Legislativo Regional** (1 exemplo no corpus, Açores) — 2 subtipos
- **Decreto Regulamentar Regional** — 2 subtipos

### Fora de escopo (v0.2+)

Jurisprudência, atos administrativos, atos pré-1976, atos orçamentais,
comunicações ao TC, avisos do BdP/CMVM e outros reguladores independentes.

## 5. Pegada legislativa (Lei n.º 5-A/2026) — destaque

Esta release **cumpre integralmente** o requisito de modelação estruturada
da pegada legislativa, obrigatória a partir de 27 de julho de 2026:

- **Schema**: `<workflow>` enriquecido com `<step>`, `<input>`, `<affects>`.
- **Vocabulário controlado**: 14 tipos de step (`#iniciativa`, `#consulta-publica`, …) e 13 tipos de contributo (`contributo-consulta-publica`, `representacao-interesse`, `parecer-conselho-economico-social`, …).
- **Schematron**: pattern `legislative-footprint` activo na fase `publication`, obrigatório para actos com publicação ≥ 2026-07-27.
- **Spec dedicada**: [capítulo 12](docs/spec/pt/12-pegada-legislativa.md).
- **Mapping dedicado**: [`mapping/v0.1.0/_legislative-footprint.md`](mapping/v0.1.0/_legislative-footprint.md).
- **Validador**: extrai e apresenta sumário da pegada (steps, contributos, datas, eIds afectados).
- **Tests**: 1 positivo (`dec-lei-with-footprint.akn.xml`) + 2 negativos (`s11-footprint-missing-after-cutoff`, `s12-footprint-missing-iniciativa`).

## 6. Decisões fundadoras

Dez ADRs em estado **Proposed**, à espera de aceitação institucional:

| # | Decisão | Recomendação |
|---|---|---|
| 0001 | Governação | Modelo híbrido: despacho SG + EUPL + Comissão Técnica AKN-PT interinstitucional |
| 0002 | Licença | EUPL-1.2 (mesma do LEOS) |
| 0003 | Repositório | Monorepo GitHub, mirror posterior para code.europa.eu |
| 0004 | Conformance | Três fases: drafting / review / publication |
| 0005 | Namespace | OASIS canónico; perfil declarado em `<FRBRformat>` |
| 0006 | Línguas | Spec body PT + EN summary; ADRs EN; código EN |
| 0007 | Escopo v0.1.0 | 4 tipos com cobertura completa + 5 com skeleton |
| 0008 | Stack validador | Python 3.12+ + lxml |
| 0009 | Domínio ELI-PT | Placeholder `eli.gov.pt`; final negociado com INCM |
| 0010 | Revisão externa | Palmirani, Fitsilis, PubOffice UE, jurista PT legística |

## 7. Como começar

### Validar um documento

```bash
pip install akn-pt
akn-pt validate document.akn.xml
akn-pt validate document.akn.xml --phase publication --json
```

### Compilar a spec em PDF

```bash
cd docs/spec
make pt   # gera AKN-PT-Specification-v0.1.0-pt.pdf
make en   # gera versão EN
```

Requer Pandoc + XeLaTeX. Alternativa pure-Python: `python tools/build_pdfs.py`.

### Docker

```bash
docker pull ghcr.io/sggoverno/akn-pt:0.1.0
docker run --rm -v "$(pwd):/work" ghcr.io/sggoverno/akn-pt:0.1.0 \
  validate /work/doc.akn.xml
```

## 8. Limitações conhecidas

1. **Pegada legislativa**: `representacao-interesse` (lobby registado) usa o
   modelo genérico de `<input>`. Campos específicos do registo de transparência
   (número, valor do contrato) ficam para v0.1.1, após publicação do regulamento
   de execução da Lei n.º 5-A/2026.
2. **Articulado abreviado no corpus**: por questão de extensão, articulados
   longos têm primeiros 3-5 artigos detalhados; restantes com `<num>+<heading>`
   esquemático. Documentado abertamente em cada ficheiro.
3. **Schematron em XSLT 1.0**: para compatibilidade com `lxml.isoschematron`.
   Migração para XSLT 2.0 + Saxon é mecânica (documentada).
4. **Mensagens Schematron PT-only**: `--lang en` no validador traduz apenas
   labels da UI; assertion text fica em PT. Tradução completa via stable
   message ids planeada para v0.1.1.
5. **Consolidação automática**: o `<analysis>` está modelado mas o motor de
   geração automática de versões consolidadas é v0.2+.
6. **Conversor `dre.pt` ↔ ELI-PT**: o hash legado do URL `dre.pt` não é
   recuperável sem a tabela INCM; o conversor produz a forma curta da URL
   legada.

## 9. Caminho institucional (post-release)

Para que esta v0.1.0 seja adoptada como standard nacional, são necessárias:

1. **Despacho do Secretário-Geral** formalizando o projeto (esboço em
   [`docs/governance/despacho-criacao-akn-pt.md`](docs/governance/despacho-criacao-akn-pt.md) na pasta original).
2. **Revisão externa** estruturada (per ADR-0010):
   - Monica Palmirani (Universidade de Bolonha; chair OASIS LegalDocML TC)
   - Fotis Fitsilis (Parlamento Helénico)
   - Publications Office UE (equipa AKN4EU)
   - Especialista PT em legística (Carlos Blanco de Morais, Rui Lanceiro, ou jurista sénior do ICJP)
3. **Coordenação INCM** para finalizar o domínio ELI-PT (recomendação substantiva: `data.dre.pt`).
4. **Constituição da Comissão Técnica AKN-PT** interinstitucional (SGGOV + INCM + AR; observador UE).
5. **Integração no caderno de encargos do SmartLegis** como requisito de saída.

## 10. Roadmap

- **v0.1.1** (patches): finalização de campos `representacao-interesse` após regulamento da Lei 5-A/2026; tradução completa de mensagens Schematron PT→EN; correções de revisão externa.
- **v0.2.0** (minor): consolidação automática; classificação EuroVoc; tipos `retificacao` e `acordao` (jurisprudência); migração para `xs:import + xs:restriction` do AKN base OASIS.
- **v1.0.0** (major): após acordo institucional estabilizado (despacho assinado + Comissão Técnica formalizada + adopção real em SmartLegis e INCM); domínio ELI-PT final fixado.

## 11. Estrutura do release

```
02. Artefactos AKN-PT v0.1.0/
├── README.md
├── RELEASE-NOTES-v0.1.0.md       ← este documento
├── decisions-log.md              ← 31 decisões registadas com Q/A/Why
├── CHECKPOINT-CP1.md
├── CHECKPOINT-CP2.md
├── CHECKPOINT-CP3.md
├── CHECKPOINT-CP4.md
├── CHECKPOINT-CP5.md
├── docs/
│   ├── spec/                     ← Artefacto 1
│   │   ├── pt/ (18 capítulos)
│   │   └── en/ (3 documentos)
│   └── adr/ (10 ADRs)
├── mapping/v0.1.0/               ← Artefacto 5 (13 ficheiros)
├── eli-pt/                       ← Artefacto 4 (5 docs + conversor + 13 testes)
├── schema/
│   ├── xsd/                      ← Artefacto 2 (4 módulos)
│   ├── schematron/akn-pt-rules.sch  ← Artefacto 3
│   └── tests/                    ← 42 ficheiros XML de teste
├── corpus/                       ← Artefacto 6 (10 diplomas reais)
├── validator/                    ← Artefacto 7 (Python + Docker)
├── tools/
│   └── build_pdfs.py             ← PDF builder (Pandoc + fpdf2 fallback)
├── release/v0.1.0/               ← PDFs gerados
└── .github/workflows/            ← CI + Release automation
```

## 12. Reconhecimentos

Este perfil é construído sobre o trabalho de:

- OASIS LegalDocML TC (M. Palmirani, F. Vitali e colaboradores)
- AKN4EU (Publications Office da União Europeia)
- LEOS (Comissão Europeia)
- Senato della Repubblica Italiana (customização AKN-IT)
- LexML Brasil
- Parlamento Helénico (F. Fitsilis; reutilização de LEOS)
- Comunidade de legística portuguesa: C. Blanco de Morais, R. Lanceiro, ICJP/FDUL

## 13. Contacto

- **Coordenador do projeto:** Bernardo Vidal (Chefe de Divisão, DAPL / SGGOV)
- **Email institucional:** [a definir após despacho de criação]
- **Repositório público:** [a publicar após sanção institucional]
- **Issues, propostas, contribuições:** via GitHub issues (após repo público)

---

**Modernização defensiva, não aventura.** Adoptar AKN-PT agora é convergência
com a prática estabelecida em todos os sistemas comparáveis europeus. Sem
este standard, qualquer investimento subsequente em consolidação automática,
pegada legislativa, IA legal ou interoperabilidade com EUR-Lex continuará
a ser frágil e caro.
