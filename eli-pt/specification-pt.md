# Especificação ELI-PT v0.1.0

**European Legislation Identifier — Perfil Nacional Português**

Versão: 0.1.0 (proposta) · Data: 2026-05-18 · Licença: EUPL-1.2

---

## 1. Introdução

### 1.1 Propósito

A especificação ELI-PT define o esquema canónico de identificadores URI para
atos normativos publicados em Portugal, em alinhamento com o standard
**European Legislation Identifier (ELI)** estabelecido pelas Conclusões do
Conselho de 6 de novembro de 2017 (2017/C 441/05) e mantido pelo
Publications Office da União Europeia.

ELI-PT é uma das três fundações técnicas do projeto AKN-PT, ao lado da
customização Akoma Ntoso e do validador de referência.

### 1.2 Audiência

- Equipas técnicas da SGGOV, INCM e AR responsáveis por publicação e consumo
  de legislação.
- Implementadores de sistemas que produzem, transformam ou indexam atos PT.
- Comunidade ELI europeia, para revisão e interoperabilidade.

### 1.3 Estado

ELI-PT v0.1.0 é uma **proposta técnica** desenvolvida pela DAPL/SGGOV no
âmbito do projeto AKN-PT. A formalização institucional, incluindo a escolha
final do domínio (ADR-0009), depende de coordenação com a Imprensa
Nacional-Casa da Moeda.

### 1.4 Notação

As palavras-chave **DEVE**, **NÃO DEVE**, **DEVERIA**, **PODE** são usadas no
sentido do RFC 2119.

Os exemplos URI usam o placeholder `eli.gov.pt`. A forma final será fixada
pela INCM em coordenação com a SGGOV; a estrutura de path mantém-se
independentemente do domínio escolhido.

---

## 2. Princípios

Todo identificador ELI-PT **DEVE** satisfazer simultaneamente:

1. **Persistência.** Uma vez emitido, o URI não muda. Eventuais reorganizações
   técnicas devem garantir continuidade por redireccionamento (HTTP 301).
2. **Resolubilidade.** O URI **DEVERIA** resolver para uma representação
   acessível do ato (HTML, AKN-PT XML, PDF, etc.) por content negotiation.
3. **Composicionalidade.** O URI é construído mecanicamente a partir de
   metadados do ato (tipo, ano, número, jurisdição, língua), sem necessidade
   de conhecimento adicional.
4. **Independência da apresentação.** O URI identifica o ato, não a sua
   representação visual no portal dre.pt.
5. **Compatibilidade com ELI europeu.** Mantém os campos obrigatórios do ELI
   `/eli/` na exacta semântica definida pelo PubOffice UE.
6. **Granularidade FRBR.** O URI exprime as camadas Work / Expression /
   Manifestation; URIs de fragmento exprimem sub-divisões internas.

---

## 3. Template canónico

```
{domain}/eli/{jurisdiction}/{type}/{year}/{number}/{language}[/{point-in-time}][.{format}][#{fragment}]
```

| Segmento | Cardinalidade | Descrição |
|---|---|---|
| `{domain}` | 1 | Domínio autoritativo. Placeholder: `eli.gov.pt`. Recomendação substantiva: `data.dre.pt`. |
| `eli` | 1 | Marcador literal do esquema ELI (compatibilidade europeia). |
| `{jurisdiction}` | 1 | Código ISO 3166-1 alpha-2 minúsculo + opcional ISO 3166-2 sub-divisão. Ver §4. |
| `{type}` | 1 | Tipo de ato (slug). Ver §5. |
| `{year}` | 1 | Ano de adopção, quatro dígitos (`YYYY`). |
| `{number}` | 1 | Número do ato dentro do ano e do tipo. |
| `{language}` | 1 | ISO 639-1 da expressão. Para PT é sempre `pt`. |
| `{point-in-time}` | 0..1 | Data de expressão consolidada (ver §6). |
| `{format}` | 0..1 | Manifestação requerida (`xml`, `html`, `pdf`). |
| `{fragment}` | 0..1 | Fragmento interno (artigo, número, alínea). Ver §7. |

### 3.1 Forma curta vs. completa

- **URI de Work:** até `{language}`. Identifica o ato como obra.
  `https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt`
- **URI de Expression:** acrescenta `{point-in-time}`. Identifica a versão.
  `https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt/2027-01-15`
- **URI de Manifestation:** acrescenta `.{format}`.
  `https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt/2027-01-15.xml`
- **URI de fragmento:** acrescenta `#{fragment}`.
  `https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt#art_5__para_1__lit_a`

---

## 4. Jurisdição

| Código | Significado |
|---|---|
| `pt` | República Portuguesa (atos nacionais) |
| `pt-20` | Região Autónoma dos Açores |
| `pt-30` | Região Autónoma da Madeira |

Decretos Legislativos Regionais e Decretos Regulamentares Regionais **DEVEM**
usar `pt-20` ou `pt-30` consoante a Região emanante.

---

## 5. Tipos de ato (escopo v0.1.0)

| Slug | Tipo PT | Subtipos relevantes (`<FRBRsubtype>`) |
|---|---|---|
| `dec-lei` | Decreto-Lei | ordinario, autorizado, parlamentar, transposicao, alterador |
| `lei` | Lei (AR) | comum, organica, de-bases, autorizacao, revisao |
| `decreto-ar` | Decreto da AR | tratado, mandato, outros |
| `res-ar` | Resolução da AR | recomendacao, aprovacao, politica, cessacao-vigencia |
| `portaria` | Portaria | regulamentar, execucao, extensao |
| `res-cm` | Resolução do CM | normativa, politica, administrativa |
| `despacho-normativo` | Despacho normativo | normativo, conjunto |
| `dlr` | Decreto Legislativo Regional | ordinario, autorizado |
| `drr` | Decreto Regulamentar Regional | execucao, regulamentar |

Tipos fora deste escopo (jurisprudência, atos administrativos, pré-1976,
orçamentais) ficam reservados para v0.2+ e não devem ser identificados sob
estes slugs.

---

## 6. Point-in-time (versão consolidada)

O `{point-in-time}` é a data a partir da qual a expressão produz efeitos —
isto é, a data da última alteração que entrou em vigor incorporada nessa
versão.

- Formato: ISO 8601 (`YYYY-MM-DD`).
- Ausência: URI refere a versão originária.
- A URI da versão originária **PODE** omitir o segmento ou usar a data de
  entrada em vigor da versão originária; recomenda-se omitir para concisão.

Exemplos:
- `…/dec-lei/2026/22/pt` — versão originária.
- `…/dec-lei/2026/22/pt/2027-01-15` — versão consolidada a 15-01-2027.

---

## 7. Fragmentos internos

Fragmentos correspondem ao `eId` AKN-PT, mantido literalmente após `#`.

| Granularidade | Fragmento |
|---|---|
| Artigo | `#art_5` |
| Número de artigo | `#art_5__para_2` |
| Alínea | `#art_5__para_2__lit_a` |
| Subalínea | `#art_5__para_2__lit_a__sublit_i` |
| Capítulo | `#cap_2` |
| Anexo | `#anx_1` |
| Considerando | `#rec_3` |

A granularidade até à alínea é **OBRIGATÓRIA**. Subalínea é opcional. Profundidades
superiores (palavra individual, frase) ficam fora do escopo ELI-PT.

---

## 8. Mapeamento FRBR ↔ ELI-PT

| Camada FRBR | Componente ELI-PT |
|---|---|
| Work | `{domain}/eli/{jurisdiction}/{type}/{year}/{number}` |
| Expression | Work + `/{language}[/{point-in-time}]` |
| Manifestation | Expression + `.{format}` |
| Item | Não tem URI ELI próprio (item é instância física, e.g. um download concreto) |

Esta correspondência é a mesma usada em AKN-PT no bloco `<meta>/<identification>`.

---

## 9. Conteúdo dos metadados ELI obrigatórios

Quando a representação HTML/dados de um ato é servida, **DEVEM** estar
presentes os seguintes metadados ELI em RDFa, Schema.org ou JSON-LD:

| Propriedade ELI | Fonte AKN-PT |
|---|---|
| `eli:type_document` | `<FRBRsubtype>` ou `<act name>` |
| `eli:date_document` | `<FRBRWork>/<FRBRdate name="adoption">` |
| `eli:date_publication` | `<FRBRExpression>/<FRBRdate name="publication">` |
| `eli:date_entry_in_force` | `<lifecycle>` evento `entry-into-force` |
| `eli:date_no_longer_in_force` | (se revogado, v0.2+) |
| `eli:passed_by` | `<FRBRauthor>` |
| `eli:title` | `<preface>/<shortTitle>` |
| `eli:id_local` | `<FRBRnumber>` |
| `eli:language` | `<FRBRlanguage>` |
| `eli:is_about` | Classificações temáticas (EuroVoc, quando disponível) |

---

## 10. Política de permanência e versionamento

Ver [`permanence-policy.md`](permanence-policy.md) — síntese:

- URIs de Work são **permanentes para sempre**.
- URIs de Expression são **permanentes** para sempre, mesmo após nova consolidação.
- URIs de Manifestation **podem** ser regenerados se a representação binária mudar (e.g. correção de XML); o conteúdo na nova manifestação **DEVE** ser semanticamente equivalente.
- Toda alteração de URI **DEVE** ser acompanhada de redireccionamento HTTP 301 permanente a partir do URI antigo, mesmo que o destino mude.

---

## 11. Negociação de conteúdo

Implementações **DEVERIAM** suportar HTTP content negotiation:

| `Accept` header | Devolve |
|---|---|
| `application/akn+xml; profile=akn-pt-1.0` | XML AKN-PT |
| `application/xml` | XML AKN-PT (fallback) |
| `application/json` | JSON estruturado com os metadados ELI + corpo simplificado |
| `application/pdf` | PDF facsimile |
| `text/html` | HTML legível (representação corrente do portal) |

Quando não houver representação no formato pedido, devolver HTTP 406 (Not
Acceptable) com lista das representações disponíveis.

---

## 12. Compatibilidade com URLs legados (dre.pt)

URLs actuais do portal `dre.pt` da forma
`https://dre.pt/dre/detalhe/decreto-lei/22-2026-XXXXXXXX` são reconhecidos
mas não normativos. A INCM **DEVERIA** publicar mapeamentos canónicos e
redireccionamentos 301 dos URLs legados para os ELI-PT correspondentes,
preservando rastreabilidade.

O conversor de referência ([`conversion.py`](conversion.py)) fornece a
operação bidirecional.

---

## 13. Conformidade

Uma implementação **conforma** com ELI-PT v0.1.0 se:

1. Produz URIs com a estrutura definida em §3.
2. Mantém a permanência definida em §10.
3. Suporta os metadados ELI obrigatórios definidos em §9.
4. Respeita as restrições de §4 (jurisdição), §5 (tipos), §6 (point-in-time), §7 (fragmentos).

Uma implementação **conforma estrita** acresce:

5. Suporta content negotiation (§11).
6. Publica mapeamentos para URLs legados (§12).

---

## 14. Open questions (registadas; resolução em iterações posteriores)

1. **Domínio final** — `data.dre.pt` (preferência ELI-PT), `eli.gov.pt`, `dados.gov.pt/eli`, ou outro? Decisão depende de INCM.
2. **EuroVoc / classificação temática** — em que momento se introduz no AKN-PT/ELI-PT a indexação EuroVoc? Proposta: v0.2.
3. **Granularidade abaixo da alínea** — número, frase, palavra? Hoje fora do escopo; cobrir se houver caso de uso real (consolidação automatizada).
4. **Versionamento de directivas UE transpostas** — referenciar a directiva pelo ELI europeu (`data.europa.eu/eli/dir/2024/123/oj`) ou por proxy nacional? Resposta hoje: ELI europeu directamente.

---

## 15. Referências

- ELI Council Conclusions, 2017/C 441/05.
- W3C ELI Implementation Methodology, PubOffice UE.
- Akoma Ntoso 1.0 OASIS LegalDocML — §10 (identification, FRBR).
- Constituição da República Portuguesa.
- AKN-PT mapping v0.1.0 (`/mapping/v0.1.0/`).
- ADR-0009 (ELI-PT domain strategy).
