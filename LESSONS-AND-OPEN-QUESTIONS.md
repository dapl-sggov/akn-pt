# Lições e perguntas em aberto — síntese do build v0.1.0

Documento gerado no fim da sessão. Captura aprendizagens, dúvidas para
revisores externos, próximos passos e formas de testar.

## 1. Aprendizagens

### Substantivo

- A tipologia PT é mais densa do que parece — 9 tipos × 2-5 subtipos = ~27 variantes estruturais.
- A separação RCM/Res-AR (sem `<article>`) vs DL/Lei (com `<article>`) é estrutural, não cosmética. Erro de marcação mais frequente em sistemas comparáveis.
- Três autoridades de promulgação criam três modelos: PR (nacional), Representante da República (Açores/Madeira), ausência (Portaria/RCM/Despacho).
- Pegada legislativa exige catálogo controlado de fases + tipos de contributo + `<affects>` — não basta workflow livre.
- Republicação técnica + artigos X.º-A são as duas dores recorrentes da legística PT.
- FRBR resolve elegantemente consolidação: mesma Work, várias Expressions com `{point-in-time}`.

### Técnico

- Schematron tem first-rule-wins por pattern; regras específicas antes das genéricas (ou em pattern separado).
- XPath 1.0 não compara datas ISO como strings; workaround `number(translate(@date, '-', ''))`.
- lxml.isoschematron emite `<active-pattern>`, Saxon `<fired-pattern>`; aceitar ambos.
- XSD auto-contido vs `xs:import + restriction` — escolha pragmática vs canónica.
- setuptools > hatchling com Python 3.14.
- fpdf2 multi_cell exige `new_x="LMARGIN"` consistentemente.
- `<input>` como child de `<step>` não é AKN canónico estritamente.
- Schemas duplicados (`schema/xsd/` + `validator/src/akn_pt/data/`) tem risco de drift.

### Processo

- 31 decisões registadas — institutional memory viva.
- Test pyramid funcionou: bugs apareceram cedo via pytest.
- Spec modular (18 capítulos) compensa overhead de renumeração.
- Ordem de produção (mapping → ELI-PT → XSD → Schematron → spec → corpus → validator) foi acertada.

### Surpresas

- Pegada legislativa coube no `<workflow>` AKN sem precisar namespace custom.
- `<docType>` etc. existem em AKN canónico, não são invenção PT.
- Hash legado de URLs dre.pt não é determinístico — só recuperável por lookup INCM.
- Schematron negatives foram os mais informativos para validar regras.

## 2. Perguntas para revisores externos

### Monica Palmirani (Bologna, OASIS LegalDocML TC)

1. `<input>` como filho de `<step>` em `<workflow>` — extensão aceitável no namespace OASIS ou devia ser custom?
2. `<quotedStructure>` dentro de `<content>` é placement correcta? (vimos código Senato com placement diferente)
3. Republicação técnica com prefixo `rep__` nos eIds — há convenção AKN canónica?
4. `<analysis>` vazio em v0.1.0 — incompatibilidade futura quando preenchermos?
5. Phased conformance via Schematron `<phase>` — modelo OASIS canónico?
6. `<FRBRformat value="application/akn+xml; profile=akn-pt-1.0">` — usar parâmetro `profile=` é aceitável?
7. `<paragraph>` directamente em `<body>` (sem `<article>`) para RCM/Res-AR — abordagem correcta?

### Fotis Fitsilis (Parlamento Helénico)

1. First-rule-wins do Schematron — bateu-te? Como sair sem proliferar patterns?
2. Footprint legislativo na Grécia — modelado estruturalmente em AKN ou metadata externo?
3. UX das 3 fases drafting/review/publication — adopção rápida ou friction?
4. Migraram para Saxon XSLT 2.0? Vale o esforço?
5. Articulado representativo vs corpus integral — começaram por excertos ou diplomas inteiros?
6. Review pipeline entre AKN-GR e OASIS — quem decide quando há conflito?

### Publications Office UE (Veronique Parisse, equipa AKN4EU)

1. `profile=akn-pt-1.0` no media type — alinhado com profiling AKN4EU? Há registo central?
2. ELI-PT path structure — compatível com ELI-EU resolvers?
3. `data.europa.eu/eli/dir/...` é a forma canónica para referência a directivas?
4. Pegada legislativa — IMFC tem vocabulário controlado em desenvolvimento?
5. EuroVoc obrigatório para v0.2 — qual a recomendação?
6. Cross-link AKN-PT → AKN4EU para DL de transposição — bidirectional?
7. Code.europa.eu mirror — processo prático para reflectir o repo?

### Especialista PT legística (Blanco de Morais / Lanceiro / ICJP)

1. Subtipos de Lei cobrem tudo (Lei orgânica, bases, autorização, revisão, comum)?
2. Catálogo de fórmulas promulgatórias por subtipo de DL está completo e correcto?
3. Slug `decreto-ar` — devia ser `decreto-parlamentar` ou `decreto-aprovacao-tratado`?
4. RCM resolutivos com verbo no infinitivo — prescrito no Manual de Legística ou prática?
5. Republicação técnica — modelo Lei 4/2018 fica adequado com `<attachment>/<mainBody>` + `rep__`?
6. Vacatio legis diferida por artigo — modelo suficiente ou precisa granularidade?
7. `representacao-interesse` — campos mínimos consensuais antes do regulamento da Lei 5-A/2026?
8. Despacho não-normativo — cobrir em v0.2?
9. Retificação como mecanismo de alteração em `<analysis>` vs tipo próprio — doutrina objecta?

### INCM

1. `data.dre.pt/eli/...` é viável institucionalmente?
2. Compromisso público de permanência de 100 anos?
3. Tabela hash legacy ↔ ELI-PT — INCM publica?
4. Pipeline INCM produz AKN-PT nativamente ou convertemos?
5. INCM aceita rejeitar diplomas que falhem validador phase publication?

## 3. Próximos passos

### Institucional (não-técnico)

1. Despacho do SG: rever esboço, submeter a parecer jurídico, agendar com SG.
2. Outreach internacional: Palmirani primeiro, Fitsilis a seguir, PubOffice em M3.
3. Reunião INCM antes do verão.
4. Apresentação interna na SGGOV com demo do validador.
5. Contacto académico com ICJP/FDUL para revisão informal.

### Técnico (continuação)

1. Push para GitHub público (depois do despacho).
2. Tag v0.1.0 dispara release workflow.
3. Comissão Técnica AKN-PT formalizada até M3.
4. v0.1.1 patches: stable message ids, validação eId vs num, campos extra footprint.
5. v0.2.0 minor: motor de consolidação, EuroVoc, xs:import.

### Adopção

1. SmartLegis: AKN-PT no caderno de encargos.
2. Piloto RCM (baixo risco, controlo SGGOV).
3. Champion network: 1 jurista por ministério.

## 4. Como testar

### Local (sem instalação extra)

```bash
cd "02. Artefactos AKN-PT v0.1.0"

# Test runners
python schema/tests/run_tests.py       # 42 cenários
python corpus/validate_corpus.py        # 10 diplomas
(cd validator && python -m pytest -q)   # 50 testes
(cd eli-pt && python -m pytest -q)      # 13 testes
python -m akn_pt batch corpus/          # 10/10 OK
```

### Workflow recomendado de validação manual

1. Validar diploma real teu: copiar template do corpus, marcar manualmente, `akn-pt validate -v`.
2. Quebrar deliberadamente: introduzir erros, ver se são apanhados, testar phases.
3. Pegada legislativa: reconstruir retrospectivamente workflow de um diploma real.
4. Ler PDFs em `release/v0.1.0/`.

### Próximo nível

5. Convidar jurista ICJP para revisão de 30 min do mapping.
6. Demo ao vivo no DAPL com validador num laptop limpo.
7. Stress test: marcar um Código integral; ver onde o modelo parte.

### Pressure tests recomendados

| Diploma | Pressiona |
|---|---|
| Código IRS/IVA consolidado | Hierarquia profunda, volume, cross-refs |
| Lei 4/2018 | Republicação técnica complexa |
| RCM aprovação PRR | Anexo enorme |
| DL transposição recente | URI ELI europeu canónico |
| Lei Orgânica de Bases | Subtipo `lei-organica` + Schematron específico |
| DLR com renumeração | Caso especial v0.1 incompleto |
| Portaria conjunta 3+ ministros | Múltiplas `<signature>` |

## 5. Riscos

| Risco | Mitigação |
|---|---|
| Trabalho desta sessão é do agente, não teu — internalização antes de defender externamente | Reler checkpoints + decisions; reescrever 1-2 capítulos por tuas palavras |
| "Corpus real" é representativo, não verbatim — Palmirani notará | Documentado abertamente; se objectar, marcar 2-3 verbatim antes M1 |
| Pegada legislativa antes do regulamento sair | Comprometer v0.1.1 com revisão pós-regulamento |
| ELI-PT depende da INCM | Manter placeholder; rascunhar acta antes da reunião |
| 105 testes verdes mas CI nunca correu em GitHub real | Primeiro PR pós-push: fix CI se necessário |
| `<input>` no `<workflow>` pode ser rejeitado como extensão mascarada | Plano B: namespace `akn-pt:` para extensões, migration script |

## 6. Top-3 perguntas prioritárias

Se só puderes mandar 3 perguntas a 3 reviewers, manda estas:

**Palmirani:** É legítimo modelar `<input>` como filho de `<step>` em `<workflow>`
sem inventar namespace custom? (Se não, todo o modelo de pegada legislativa
precisa de refactor.)

**Fitsilis:** Em Atenas, vocês conseguiram convencer juristas a aceitar
validação automática em 3 fases drafting/review/publication, ou tiveram de
relaxar para 1 fase? (Decide a viabilidade do nosso modelo de adopção.)

**Blanco de Morais ou Lanceiro:** O catálogo de subtipos de Lei
(`lei-comum`/`organica`/`de-bases`/`autorizacao`/`revisao`) e o catálogo de
fórmulas promulgatórias de DL estão completos do ponto de vista da legística
PT? (Se faltarem categorias, é breaking change futuro.)

---

Documento gerado em 2026-05-18 como síntese final do build v0.1.0.
