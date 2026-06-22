# ADR-0011 — Namespace `akn-pt:` para extensões PT (workflow, step, input)

- **Estado:** Accepted
- **Data:** 2026-05-25
- **Substitui parcialmente:** ADR-0005 (refina a sinalização de extensões)

## Contexto

O ADR-0005 decidiu manter todos os elementos AKN-PT no namespace OASIS canónico
(`http://docs.oasis-open.org/legaldocml/ns/akn/3.0/CSD17`), sinalizando o
perfil PT apenas via `<FRBRformat value="application/akn+xml; profile=akn-pt-1.0"/>`.

Durante a redacção de v0.1.0 introduzimos três elementos PT-específicos para
a **pegada legislativa** (Lei n.º 5-A/2026, obrigatória a partir de 2026-07-27):
`<workflow>`, `<step>` e `<input>` (cf. cap. 12 da spec). Estes elementos
**não existem** na spec OASIS Akoma Ntoso canónica.

O documento `LESSONS-AND-OPEN-QUESTIONS.md` (linhas 5 e 166-167) identificou
o risco de Monica Palmirani (OASIS LegalDocML TC) rejeitar esta abordagem
como **"extensão mascarada"**: declarar elementos nacionais no namespace OASIS
sem prefixo distintivo viola o princípio canónico AKN de que extensões devem
ser inequivocamente identificáveis.

O risco é load-bearing: se for confirmado, todo o modelo de pegada legislativa
em AKN-PT precisaria de refactor (impacto na spec, schema, validator, editor,
corpus). Quanto mais tarde for feito, mais caro.

**Janela de migração ideal:** v0.1.1, antes do corte 2026-07-27. À data desta
ADR (2026-05-25) o corpus tem **zero** diplomas com `<workflow>` — migração
trivial em código, sem migrar dados.

## Decisão

**Os elementos PT-específicos vivem no namespace nacional dedicado:**

```
http://eli.gov.pt/ns/akn-pt/1.0
```

Prefixo recomendado em documentos: `akn-pt:`.

**Elementos abrangidos em v0.1.1:**
- `akn-pt:workflow` (raiz da pegada)
- `akn-pt:step` (fase do procedimento)
- `akn-pt:input` (contributo de entidade externa num step)

**Reservado para v0.2+** (não migrado em v0.1.1 porque ainda não existem
no schema):
- `akn-pt:rectification` (modelo de retificação — ver cap. 11)
- `akn-pt:representacao-interesse` (campos da Lei 5-A/2026 ainda não consensuais)

## Exemplo

Antes (v0.1.0 — namespace OASIS canónico, **deprecated**):

```xml
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0/CSD17">
  <act name="dec-lei">
    <meta>
      <workflow source="#dapl">
        <step eId="step_iniciativa" date="..." refersTo="#iniciativa" source="#governo"/>
      </workflow>
    </meta>
  </act>
</akomaNtoso>
```

Depois (v0.1.1 — namespace `akn-pt:` explícito):

```xml
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0/CSD17"
            xmlns:akn-pt="http://eli.gov.pt/ns/akn-pt/1.0">
  <act name="dec-lei">
    <meta>
      <akn-pt:workflow source="#dapl">
        <akn-pt:step eId="step_iniciativa" date="..." refersTo="#iniciativa" source="#governo"/>
      </akn-pt:workflow>
    </meta>
  </act>
</akomaNtoso>
```

## Implementação técnica

- `schema/xsd/akn-pt-extensions.xsd` (novo) — `targetNamespace="http://eli.gov.pt/ns/akn-pt/1.0"` com as definições migradas. Importa tipos de `akn-pt-types.xsd` via `xs:import`.
- `schema/xsd/akn-pt-metadata.xsd` — `<xs:import>` o novo XSD; `<meta>` aceita `<akn-pt:workflow>` em vez de `<workflow>`.
- `schema/schematron/akn-pt-rules.sch` — `<sch:ns prefix="akn-pt" ...>` + 5 rules adaptadas (FOOT-0001..0006).
- `validator/src/akn_pt/core.py` — XPath de `_extract_metadata` passa a usar o novo prefixo.
- `editor/js/akn-export.js` — emite `xmlns:akn-pt` no `<akomaNtoso>` e `<akn-pt:workflow>` no `<meta>`.
- `tools/sync_schemas.py` — inclui `akn-pt-extensions.xsd` na cópia para o validador.

## Migração de documentos existentes

O ficheiro `validator/scripts/migrate-ns.xsl` (planeado) será disponibilizado
para converter diplomas no formato antigo para o novo via:

```bash
xsltproc validator/scripts/migrate-ns.xsl doc.akn.xml > doc.migrated.akn.xml
```

À data desta ADR, **nenhum diploma de produção utiliza ainda `<workflow>`**
(corpus = 0). Ferramentas que ainda emitem o formato antigo (versões legadas
do editor < v0.1.1) devem ser actualizadas; documentos antigos em circulação
devem ser migrados.

## Consequências

**Positivas:**
- Extensão explícita — elimina risco de rejeição por OASIS LegalDocML TC.
- Padrão canónico AKN — o mesmo modelo usado por AKN4EU e outros perfis nacionais.
- Tooling AKN canónico (Bungeni, LEOS) continua a ler o documento sem erro (basta ignorar elementos de namespace desconhecido).
- Validador AKN-PT continua a distinguir entre OASIS e PT — Schematron usa prefixos diferentes; XSD usa `xs:import`.

**Negativas:**
- Breaking change: diplomas v0.1.0 com `<workflow>` no namespace OASIS deixam de validar contra o XSD/Schematron v0.1.1.
- Corpus tem 0 diplomas afectados, mas qualquer pipeline externo que emita o formato antigo terá de ser migrado.

**Neutras:**
- Documentos sem `<workflow>` (pré 2026-07-27) não são afectados; o namespace `akn-pt:` pode estar declarado mas vazio.

## Alternativas consideradas

1. **Manter no namespace OASIS canónico (status quo do ADR-0005)** — rejeitado porque o risco identificado em LESSONS-166 é load-bearing.

2. **Namespace genérico ad-hoc (ex.: `http://akn-pt.org/ns`)** — rejeitado por não ter governança institucional. O sub-path `/ns/akn-pt/` em `eli.gov.pt` partilha a mesma autoridade do ELI-PT (cf. ADR-0009).

3. **Versionamento granular do namespace (`.../akn-pt/1.0/workflow`)** — rejeitado por complexidade desnecessária; a evolução far-se-á via novo URI completo se for incompatível, ou aditiva no mesmo URI.

## Referências

- ADR-0005 — Namespace OASIS CSD17 (sinalização via FRBRformat).
- ADR-0009 — ELI-PT domain placeholder.
- LESSONS-AND-OPEN-QUESTIONS.md (linhas 5, 46, 166-167).
- OASIS LegalDocML 1.0 spec — secção sobre extensões em namespaces nacionais.
- AKN4EU profile — usa namespace `http://publications.europa.eu/resource/akn4eu/...` para extensões EU.
