# AKN-PT schemas (v0.1.0)

XSD modular + Schematron com 3 fases. Validáveis com `lxml`/`isoschematron`,
xmllint (XSD apenas) ou Saxon (full).

## Estrutura

```
schema/
├── xsd/
│   ├── akn-pt.xsd            # entry point (akomaNtoso → act)
│   ├── akn-pt-types.xsd      # tipos simples (regex, enums, inlines, blockList, table, img)
│   ├── akn-pt-metadata.xsd   # <meta> (FRBR triple, references, lifecycle, analysis)
│   └── akn-pt-structure.xsd  # preface, preamble, body, conclusions, attachments
├── schematron/
│   └── akn-pt-rules.sch      # ISO Schematron, 3 fases (drafting/review/publication)
└── tests/
    ├── positive/             # 9 (1 por tipo de ato) — passam XSD + Schematron
    ├── negative/             # 20 — devem FALHAR XSD
    ├── schematron-negative/  # 10 — passam XSD, devem FALHAR Schematron
    ├── generate_negatives.py
    ├── generate_schematron_negatives.py
    └── run_tests.py          # unified runner
```

## Uso

```bash
# Compilar e correr todo o test suite (lxml)
python schema/tests/run_tests.py

# Apenas validacao XSD (xmllint, se disponivel)
xmllint --noout --schema schema/xsd/akn-pt.xsd corpus/**/*.akn.xml

# Schematron via Python
python -c "
from lxml import etree, isoschematron
sch = isoschematron.Schematron(etree.parse('schema/schematron/akn-pt-rules.sch'))
doc = etree.parse('corpus/dec-lei/exemplo.akn.xml')
print('OK' if sch.validate(doc) else 'FAIL')
"
```

## Resultado do test suite (CP2)

```
Positive (9) — must pass XSD + Schematron:  9/9 OK
XSD negative (20) — must FAIL XSD:          20/20 OK
Schematron negative (10) — pass XSD, fail Schematron:  10/10 OK
Summary: 39/39 passed, 0 failed
```

## Decisões técnicas no XSD

| Decisão | Razão |
|---|---|
| Namespace OASIS canónico (não custom) | ADR-0005 — perfil identificado em `<FRBRformat>` |
| Auto-contido (não importa AKN base OASIS) | Pragmático para v0.1; migração para `xs:import + restriction` na v0.2 |
| `EIdType` aceita snake_case (articulado) **e** kebab-case (TLC actors) | Convenção dupla observada na prática AKN |
| `EliPtUriType` regex permite Work/Expression/Manifestation/fragment numa só | Reduz duplicação de tipos |
| `<analysis>` obrigatório mas pode estar vazio | Compatibilidade forward com consolidação v0.2+ |
| `<FRBRsubtype>` listado em enum exaustivo | Schematron valida coerência name↔subtype |
| `OntologyUriType` aceita `pt-20`/`pt-30` na pasta país | Suporte regiões autónomas |

## Decisões técnicas no Schematron

| Decisão | Razão |
|---|---|
| `queryBinding="xslt"` (XSLT 1.0) | Compatibilidade com `lxml.isoschematron`. Para Saxon usar `xslt2`. |
| 7 patterns: structural-integrity, referential-integrity, metadata-completeness, act-type-coherence, subtype-coherence, legistica-conventions, lifecycle-coherence, frbr-uri-consistency | Cada pattern isolado evita colisões de "first-rule-wins" |
| 3 phases: `drafting` (mínimo), `review` (+ coerências), `publication` (estricto) | ADR-0004 — phase passa-se ao validador via `--phase` |
| Comparação de datas via `number(translate(...,'-',''))` | XSLT 1.0 não suporta date-comparison; ISO dates como inteiros funcionam |
| Regras específicas de tipo ANTES da regra genérica `akn:act` | Schematron aplica apenas primeira regra que faz match dentro de cada pattern |

## Limitações conhecidas

1. **`<quotedStructure>`** está definido mas não tem regra Schematron a validar formato — feito em v0.2.
2. **`<analysis>/<activeModifications>`** está estruturalmente lá mas sem validação semântica — para a consolidação automática v0.2+.
3. **`matches()` regex em XSLT 2** desligada para compatibilidade lxml — quando o validador (CP5) usar Saxon, reabrir.
4. **Regras de coerência entre número de artigo e eId** (ex.: `<num>Artigo 5.º</num>` deve ter `eId="art_5"`) não estão implementadas — adicionar em v0.1.1.
