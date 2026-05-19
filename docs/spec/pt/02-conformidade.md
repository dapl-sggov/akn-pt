# 2. Conformidade

## 2.1 Em que sentido um documento "é AKN-PT"

Um documento XML é um documento AKN-PT v0.1.0 conforme se, e só se, satisfaz
**todos** os requisitos abaixo:

1. É bem-formado segundo XML 1.0.
2. Tem como elemento raiz `<akomaNtoso>` no namespace
   `http://docs.oasis-open.org/legaldocml/ns/akn/3.0/CSD17`.
3. Contém exactamente um elemento `<act>` com atributo `@name` pertencente ao
   catálogo definido no [capítulo 4](04-tipologia-atos.md).
4. Valida contra o XSD AKN-PT v0.1.0 (`schema/xsd/akn-pt.xsd`).
5. Valida contra o Schematron AKN-PT v0.1.0 na fase declarada no atributo
   externo `--phase` do validador.
6. Declara, em `<FRBRManifestation>/<FRBRformat>`, o valor exacto
   `application/akn+xml; profile=akn-pt-1.0`.

## 2.2 Os três níveis de validação

O AKN-PT adopta um modelo de validação **em três fases** (per ADR-0004),
reconhecendo que a legística real tem latitude no momento de redacção que
não tem no momento da publicação. As fases são propriedades do **validador**,
não do documento — o mesmo XML pode ser validado em fases diferentes por
consumidores diferentes.

| Fase | Quem invoca | Regras activas | Severidade da maioria das regras |
|---|---|---|---|
| `drafting` | Drafter durante composição (editor SmartLegis) | Estruturais + referenciais | warning |
| `review` | Revisor antes do envio | Drafting + metadados + coerência tipo + legística | error em estruturais, warning em legística |
| `publication` | INCM antes da publicação no DR | Tudo, inclusive lifecycle e consistência de URIs | error em quase tudo |

Esta separação evita o pior cenário documentado em sistemas comparáveis: o
drafter recebe centenas de erros enquanto ainda está a compor, abandona a
ferramenta, e o standard nunca chega a ser usado em produção.

## 2.3 O que NÃO é conformidade

Não constitui conformance:

- Marcação "aproximada" sem validação automática — um documento "que parece
  AKN-PT" mas não passa o XSD **não é** AKN-PT.
- Conformance subjectiva ("o nosso sistema produz qualquer coisa parecida com
  AKN-PT") — só o validador de referência decide.
- Uso parcial — não há "AKN-PT level 1" e "level 2". Há ou não há conformance
  à fase declarada.

## 2.4 Componentes do validador

A validação de um documento candidato envolve:

```
   documento.akn.xml
        │
        ▼
   ┌───────────────────────────┐
   │ Validação XML 1.0 well-formed │
   └───────────────────────────┘
        │
        ▼
   ┌───────────────────────────┐
   │ Validação XSD              │
   │ schema/xsd/akn-pt.xsd      │
   └───────────────────────────┘
        │
        ▼
   ┌───────────────────────────┐
   │ Validação Schematron       │
   │ schema/schematron/         │
   │ akn-pt-rules.sch           │
   │ phase=drafting|review|publication │
   └───────────────────────────┘
        │
        ▼
   Relatório (PT default; EN com --lang en)
```

A implementação de referência do validador (Artefacto 7, Python) está
descrita no [capítulo 13](13-validacao.md).

## 2.5 Conformance com o standard base (Akoma Ntoso 1.0)

O AKN-PT **não modifica** o Akoma Ntoso 1.0; declara-se conforme com o
standard OASIS na versão CSD17 e identifica-se como perfil nacional via
mecanismo standard (`<FRBRformat>` com parâmetro `profile=`).

Ferramentas Akoma Ntoso genéricas (e.g. Akoma Ntoso Editor, AKN Viewer)
**devem** abrir e renderizar correctamente um documento AKN-PT, ainda que sem
conhecimento das invariantes adicionais; aplicações que tirem partido das
invariantes AKN-PT **devem** validar contra os schemas deste perfil.

## 2.6 Conformance com AKN4EU

AKN4EU é o perfil supranacional UE mantido pelo Publications Office da UE,
governado pelo Interinstitutional Metadata and Formats Committee (IMFC).
O AKN-PT é **paralelo** ao AKN4EU, não derivado dele:

- Onde AKN4EU define padrões para metadados de actos legislativos UE
  (eurovoc, IRP, autores institucionais UE), o AKN-PT define o equivalente
  para actos nacionais portugueses.
- Onde AKN4EU define identificação por ELI europeu sob `data.europa.eu`, o
  AKN-PT define a ELI-PT sob domínio nacional (placeholder `eli.gov.pt`,
  recomendação substantiva `data.dre.pt`).
- Onde AKN4EU define vocabulários institucionais UE, o AKN-PT define os
  equivalentes PT.

Pontos de interoperabilidade:

- Um Decreto-Lei de transposição **deve** referenciar a directiva UE
  transposta pelo seu URI ELI europeu (`http://data.europa.eu/eli/dir/...`).
- Documentos AKN4EU referenciados em AKN-PT (e.g. regulamentos UE citados em
  RCM) usam o URI ELI europeu sem modificação.
- A renderização HTML, RDFa metadata e content negotiation seguem os mesmos
  princípios em ambos os perfis (ELI Council Conclusions 2017/C 441/05).

## 2.7 Conformance estrita vs. conformance básica

Uma implementação (sistema que produz ou consome AKN-PT) tem dois níveis de
conformance:

**Conformance básica** — produz/consome documentos que satisfazem 2.1.

**Conformance estrita** — adicionalmente:

- Suporta as três fases de validação Schematron;
- Para documentos com versão consolidada (`{point-in-time}` no URI), expõe a
  versão originária e todas as consolidadas posteriores via content
  negotiation HTTP;
- Para qualquer URI ELI-PT canónico, suporta as manifestações `xml`, `html` e
  `json` (PDF facsimile facultativo);
- Publica metadata ELI em RDFa, Schema.org ou JSON-LD (ver [cap. 9](09-metadados.md)).

## 2.8 Conformance temporal — política de evolução

O AKN-PT segue SemVer (MAJOR.MINOR.PATCH).

- **PATCH** (e.g. 0.1.0 → 0.1.1): correcções e clarificações. Documentos
  válidos em 0.1.0 continuam válidos em 0.1.1.
- **MINOR** (e.g. 0.1.0 → 0.2.0): novos elementos opcionais; novos tipos de
  ato; novos subtipos. Documentos válidos em 0.1.0 continuam válidos em 0.2.0.
- **MAJOR** (e.g. 0.2.0 → 1.0.0): pode introduzir mudanças não-compatíveis.
  Documentos antigos validam para sempre contra a sua versão de schema
  (cada versão de schema fica congelada num path próprio).

A versão do AKN-PT a que o documento se conforma é declarada implicitamente
pelo `<FRBRformat value="application/akn+xml; profile=akn-pt-1.0">` (com
o número de versão no parâmetro `profile`).
