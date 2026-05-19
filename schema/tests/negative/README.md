# Testes negativos — schemas devem rejeitar

Cada ficheiro contém um erro deliberado e deve produzir pelo menos um erro
de validação. O test runner em `../run_tests.py` confirma que cada um
falha pela razão esperada (indicada num comentário inicial).

| Ficheiro | Erro deliberado | Categoria |
|---|---|---|
| `n01-unknown-act-name.akn.xml` | `<act name="lei-bizarra">` (fora do enum) | XSD enum |
| `n02-bad-subtype.akn.xml` | `<FRBRsubtype value="inexistente">` | XSD enum |
| `n03-bad-jurisdiction.akn.xml` | `<FRBRcountry value="es">` | XSD enum |
| `n04-bad-language.akn.xml` | `<FRBRlanguage language="eng">` | XSD enum |
| `n05-malformed-eli-uri.akn.xml` | URI sem `/eli/` | XSD pattern |
| `n06-bad-eid.akn.xml` | `eId="ARTIGO 5"` (maiúsculas, espaço) | XSD pattern |
| `n07-bad-date.akn.xml` | `date="2026/03/15"` (formato errado) | XSD type |
| `n08-missing-meta.akn.xml` | `<act>` sem `<meta>` | XSD cardinality |
| `n09-missing-frbr-author.akn.xml` | `<FRBRWork>` sem `<FRBRauthor>` | XSD cardinality |
| `n10-bad-format.akn.xml` | `<FRBRformat value="application/zip">` | XSD enum |
| `n11-unknown-signature-role.akn.xml` | `<signature role="abracadabra">` | XSD enum |
| `n12-bad-formula-type.akn.xml` | `<formula type="random">` | XSD enum |
| `n13-bad-frbr-date-name.akn.xml` | `<FRBRdate name="nascimento">` | XSD enum |
| `n14-article-missing-heading.akn.xml` | `<article>` sem `<heading>` | XSD cardinality |
| `n15-bad-href.akn.xml` | `href="@@invalid"` | XSD type (anyURI) |
| `n16-extra-element.akn.xml` | `<dragon>` dentro de `<body>` | XSD validity |
| `n17-bad-ontology-href.akn.xml` | `href="bad-uri"` num TLCRole | XSD pattern |
| `n18-tlc-missing-attribute.akn.xml` | `<TLCRole>` sem `showAs` | XSD cardinality |
| `n19-lifecycle-bad-type.akn.xml` | `<eventRef type="death">` | XSD enum |
| `n20-bad-frbr-subtype-format.akn.xml` | `<FRBRsubtype value="DEC-LEI-ORDINARIO">` (uppercase) | XSD enum |
