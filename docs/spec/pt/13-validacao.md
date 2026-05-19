# 13. Modelo de validação

## 13.1 Os dois motores de validação

A validação de um documento AKN-PT envolve duas tecnologias complementares,
aplicadas em sequência:

| Motor | Tecnologia | Verifica | Mensagens |
|---|---|---|---|
| 1. XSD | W3C XML Schema 1.0 | Estrutura, tipos, enums, regex de identificadores | Curtas, em EN (mensagem do parser) |
| 2. Schematron | ISO Schematron (XSLT) | Invariantes cross-element, integridade referencial, coerência semântica, legística | Em PT por defeito, EN com `--lang en` |

O XSD é executado primeiro. Se falhar, o Schematron não é executado (o
documento não vale o trabalho de análise semântica). Se o XSD passar, o
Schematron é executado na fase declarada pelo invocador.

## 13.2 As três fases Schematron

Por ADR-0004, o Schematron AKN-PT tem três fases:

| Fase | Quem invoca | Patterns activos |
|---|---|---|
| `drafting` | Drafter durante composição | structural-integrity, referential-integrity |
| `review` | Revisor antes do envio | + metadata-completeness, act-type-coherence, subtype-coherence, legistica-conventions |
| `publication` | INCM antes da publicação | + lifecycle-coherence, frbr-uri-consistency, legislative-footprint |

A fase é parâmetro do validador (`--phase`), não atributo do documento. O
mesmo XML pode ser validado em fases diferentes por consumidores diferentes:
um drafter em SmartLegis vê warnings sobre legística, mas o seu fluxo não
fica bloqueado; o validador da INCM, antes de aceitar para publicação, exige
tudo.

## 13.3 Padrões Schematron implementados

| Pattern | O que verifica | Severidade |
|---|---|---|
| `structural-integrity` | `<akomaNtoso>` tem 1 `<act>`; `<article>` tem heading + num; `<chapter>` tem pelo menos 1 artigo/secção; `<paragraph>` tem content ou list | error |
| `referential-integrity` | eIds únicos no documento; `<ref href="#xxx">` resolve para eId existente; `@refersTo`, `@source`, `@as` resolvem | error |
| `metadata-completeness` | FRBR Work/Expression/Manifestation presentes; FRBRsubtype obrigatório; FRBRlanguage="por"; preface contém docType, docNumber, shortTitle | error |
| `act-type-coherence` | Por tipo (DL, Lei, Portaria, RCM, …): cardinalidade de signatures, presença de habilitante, ausência de promulgação onde não aplicável, body sem `<article>` em RCM/Res-AR | error |
| `subtype-coherence` | FRBRsubtype começa com act/@name | error |
| `legistica-conventions` | Considerandos começam por "Considerando"; epígrafes não vazias; num de artigo começa por "Artigo " | warning |
| `lifecycle-coherence` | `<lifecycle>` tem evento `publication`; data de publicação ≥ data de adopção | error |
| `frbr-uri-consistency` | FRBRuri Work contém `/{type}/`; Expression estende Work; Manifestation estende Expression | error |
| `legislative-footprint` | Pegada legislativa (Lei n.º 5-A/2026): para actos publicados a partir de 27-07-2026, `<workflow>` é obrigatório com steps mínimos (`#iniciativa`, aprovação, `#publicacao`); `<input>/@source` deve resolver para TLC actor | error (warning para coerência cronológica) |

Mais detalhe em `schema/schematron/akn-pt-rules.sch` no repositório, e
para o pattern `legislative-footprint` ver [cap. 12](12-pegada-legislativa.md).

## 13.4 Output do validador

O validador de referência produz três formatos de saída:

### Modo texto (default)

```
$ akn-pt validate examples/dl-22-2026.akn.xml --phase publication
✓ XSD válido
✓ Schematron válido (publication)
✓ Validação completa: 0 erros, 0 avisos

Documento: Decreto-Lei n.º 22/2026
Tipo: dec-lei (dec-lei-ordinario)
Tempo: 230 ms
```

Em caso de erro:

```
$ akn-pt validate corpus/exemplo-com-erros.akn.xml --phase publication
✗ XSD passou
✗ Schematron falhou (publication):
  
  ERRO em /act[1]/conclusions[1]
    Decreto-Lei deve ter signature role='promulgation' no conclusions (promulgação pelo PR).
    (pattern: act-type-coherence; regra: akn:act[@name='dec-lei'])
  
  AVISO em /act[1]/preamble[1]/recital[3]
    Considerando deveria começar por 'Considerando que' (formula canónica).
    (pattern: legistica-conventions)

1 erro, 1 aviso
```

### Modo JSON (`--json`)

```json
{
  "input": "corpus/exemplo-com-erros.akn.xml",
  "phase": "publication",
  "xsd": {"valid": true, "errors": []},
  "schematron": {
    "valid": false,
    "errors": [
      {
        "severity": "error",
        "pattern": "act-type-coherence",
        "rule": "akn:act[@name='dec-lei']",
        "location": "/act[1]/conclusions[1]",
        "message": "Decreto-Lei deve ter signature role='promulgation' no conclusions (promulgação pelo PR)."
      }
    ],
    "warnings": [...]
  },
  "summary": {"errors": 1, "warnings": 1, "valid": false}
}
```

### Modo SVRL puro (`--svrl`)

Devolve o relatório Schematron Validation Reporting Language (SVRL) sem
processamento. Útil para tooling intermédio.

## 13.5 Mensagens em PT vs. EN

Por defeito, as mensagens são em PT (público-alvo é o drafter PT). Com
`--lang en`, são traduzidas. A tradução é feita por look-up — cada mensagem
do Schematron tem chave estável; o ficheiro de tradução está em
`validator/src/akn_pt/i18n/`.

## 13.6 Performance esperada

Numa máquina razoável (laptop 2024+), com `lxml` em Python 3.12:

| Tipo de documento | Tamanho XML | Tempo XSD | Tempo Schematron | Total |
|---|---|---|---|---|
| Decreto-Lei pequeno (5-10 art.) | 10–30 KB | < 50 ms | < 200 ms | < 300 ms |
| Lei média (20-50 art.) | 50–150 KB | < 100 ms | < 500 ms | < 700 ms |
| Código grande (200+ art.) | 500 KB–2 MB | < 500 ms | 2–5 s | < 6 s |
| RCM com anexo extenso | 100 KB–1 MB | < 200 ms | < 1 s | < 1.5 s |

Estes tempos servem como meta. A optimização (compilação Schematron para
XSLT 3.0, caching de schemas, etc.) é trabalho do validador, não do schema
em si.

## 13.7 Como integrar a validação em CI/CD

O fluxo recomendado para um repositório que produz AKN-PT:

```yaml
# .github/workflows/validate-corpus.yml
name: Validate corpus
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: {python-version: '3.12'}
      - run: pip install akn-pt
      - run: |
          for f in corpus/**/*.akn.xml; do
            akn-pt validate "$f" --phase publication --json > /dev/null
          done
```

A SGGOV publica este workflow como GitHub Action reusável em
`SGGoverno/akn-pt-validate-action@v1` (planeado).

## 13.8 Quando o validador deve mudar

Mudanças ao validador (Artefacto 7) são independentes do schema; usar SemVer
próprio (e.g. `akn-pt-validator 1.2.3` pode validar schemas AKN-PT 0.1.x e
0.2.x simultaneamente). A regra: o validador **deve** sempre saber validar
todas as versões publicadas do schema; novas regras são introduzidas em
patches sem quebrar compatibilidade.

## 13.9 Para além da validação automática — revisão humana

A validação automática captura o que é mecanicamente verificável. **Não
substitui revisão jurídica humana** dos seguintes aspectos:

- Conformidade substantiva com a CRP e com a lei habilitante.
- Qualidade da redacção legística (clareza, precisão, simplicidade).
- Adequação substantiva da escolha de subtipo, ementa, fórmula.
- Coerência sistémica com a ordem jurídica em vigor.

O AKN-PT é infraestrutura técnica; o juízo legístico continua a ser do
jurista.
