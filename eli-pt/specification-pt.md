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

ELI-PT **v0.2** (2026-06-22) alinha-se com o **template de produção da INCM**.
A pesquisa de suporte à reunião INCM confirmou que **Portugal já é
implementador ELI registado desde 2016/2017**, operado pela INCM no domínio
**`data.dre.pt`**. Por isso, o template canónico do ELI-PT deixou de ser uma
forma proposta pela DAPL e passou a ser **o template `data.dre.pt` que está em
produção** (ver ADR-0009, revisão 2026-06-22, e
[`research/eli-pt-gap-analysis.md`](research/eli-pt-gap-analysis.md)).

A forma anterior da DAPL (`eli.gov.pt`, ano+número) mantém-se documentada como
**evolução a propor** (§16). A confirmação final (domínio, tabela de tipos,
forma das consolidadas, código de língua) fica para a reunião de 2026-07-01.

### 1.4 Notação

As palavras-chave **DEVE**, **NÃO DEVE**, **DEVERIA**, **PODE** são usadas no
sentido do RFC 2119.

Os exemplos URI usam o domínio **canónico `data.dre.pt`** (em produção). Onde
se ilustra a forma proposta anterior, usa-se `eli.gov.pt` e diz-se
explicitamente.

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

## 3. Template canónico (data.dre.pt — produção INCM)

```
https://data.dre.pt/eli/{type}/{number}/{year}/{month}/{day}[/{p|point-in-time}/dre/{language}[/{format}]][#{fragment}]
```

Exemplo real resolvível: `http://data.dre.pt/eli/dec-lei/83/2016/12/16/p/dre/pt/html`

| Segmento | Cardinalidade | Descrição |
|---|---|---|
| `data.dre.pt` | 1 | Domínio autoritativo (INCM/DRE). |
| `eli` | 1 | Marcador literal do esquema ELI. |
| `{type}` | 1 | Tipo de ato (slug). Ver §5. **Vem antes do número.** |
| `{number}` | 1 | Número do ato (aceita sufixo, ex. `205-B`, `442-A`). |
| `{year}/{month}/{day}` | 1 | **Data de publicação** completa no DR. |
| `p` | 0..1 | Marcador de versão "como publicada"; substituído pela `{point-in-time}` (data ISO) nas consolidadas. Ver §6. |
| `dre` | 0..1 | Agente (Diário da República). |
| `{language}` | 0..1 | `pt` (2 letras — convenção INCM). O `<FRBRlanguage>` AKN usa `por`. |
| `{format}` | 0..1 | Manifestação como **segmento** (`xml`, `html`, `pdf`) — **não extensão**. |
| `{fragment}` | 0..1 | Fragmento interno (= eId AKN-PT). Ver §7. |

> **Sem segmento de jurisdição** (ao contrário da forma proposta anterior). A
> jurisdição (`pt-20`/`pt-30`) permanece em `<FRBRcountry>`. Ver §4.

### 3.1 Camadas FRBR

- **Work:** termina em `/{p|a|m}/dre`. Identifica o ato como obra.
  `https://data.dre.pt/eli/dec-lei/83/2016/12/16/p/dre`
- **Expression (como publicada):** acrescenta `/{lang}`.
  `https://data.dre.pt/eli/dec-lei/83/2016/12/16/p/dre/pt`
- **Expression (consolidada):** o Work usa `/{ano}/{p|a|m}/cons/{AAAAMMDD}`.
  `https://data.dre.pt/eli/dec-lei/83/2016/p/cons/20240101/pt`
- **Manifestation:** acrescenta `/{format}` (segmento).
  `https://data.dre.pt/eli/dec-lei/83/2016/12/16/p/dre/pt/xml`
- **Fragmento:** acrescenta `#{fragment}`.
  `https://data.dre.pt/eli/dec-lei/83/2016/12/16/p/dre/pt#art_5__para_1__lit_a`

> **Nota sobre construtibilidade:** este template exige a data de publicação
> completa (ano/mês/dia). Essa data está presente na **citação legística
> completa** em português — ex. "Decreto-Lei n.º 43-B/2024, de 2 de julho" —
> pelo que o URI canónico **é construível a partir de uma citação completa**:
> basta o parser extrair a componente "..., de {dia} de {mês} [de {ano}]" e
> mapear o nome do mês para o seu número. **Caveat:** uma citação *abreviada*
> ("DL 43-B/2024", sem "de {dia} de {mês}") é insuficiente — mas isso é uma
> citação incompleta por padrão legístico, não uma falha do esquema. Ver §16
> (forma proposta, cujos méritos são jurisdição explícita + estética UE).

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

| Camada FRBR | Componente ELI-PT (canónico) |
|---|---|
| Work | `https://data.dre.pt/eli/{type}/{number}/{year}/{month}/{day}` |
| Expression | Work + `/{p\|point-in-time}/dre/{language}` |
| Manifestation | Expression + `/{format}` |
| Item | Não tem URI ELI próprio (instância física, e.g. um download concreto) |

Esta correspondência é a mesma usada em AKN-PT no bloco `<meta>/<identification>`.
Notar: a **data de publicação** está no path do Work; nova consolidação cria
nova Expression (segmento `p` → data) mantendo o Work.

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

## 14. Open questions (a confirmar na reunião INCM 2026-07-01)

1. **Domínio final** — **decidido (2026-06-22): `data.dre.pt`** (já em produção
   pela INCM). A confirmar formalmente.
2. **Forma das consolidadas** — confirmar com a INCM o segmento exacto da
   versão consolidada (assumimos `/{YYYY-MM-DD}/dre/pt`).
3. **Código de língua** — `pt` (no URI, convenção INCM) vs `por` (ISO 639-2,
   `<FRBRlanguage>`). Confirmar.
4. **Construtibilidade** — o template `data.dre.pt` é construível a partir de
   uma **citação legística completa** (que inclui "..., de {dia} de {mês}").
   Confirmar com a INCM uma tabela canónica de nomes de mês → número e,
   opcionalmente, um serviço de resolução para o caso de **citações
   abreviadas** (sem a data) — não como remédio para uma falha do esquema.
5. **EuroVoc** — indexação `eli:is_about`. Proposta: v0.2+.
6. **Granularidade abaixo da alínea** — fora do escopo; cobrir se houver caso real.
7. **Directivas UE transpostas** — pelo ELI europeu directo (`data.europa.eu/eli/dir/…`).
8. **Actos regionais (DLR/DRR)** — resolução ELI via jornais regionais
   (JORAA/JORAM) ou via data.dre.pt? A coordenar.

---

## 15. Referências

- ELI Council Conclusions, 2012/C 325/02 e 2017/C 441/05.
- ELI ontology v1.5 (2024), Publications Office UE — `http://data.europa.eu/eli/ontology`.
- DRE — Identificador Europeu de Legislação (template em produção, data.dre.pt).
- Akoma Ntoso 1.0 OASIS LegalDocML — §10 (identification, FRBR).
- AKN-PT mapping v0.1.0 (`/mapping/v0.1.0/`).
- ADR-0009 (ELI-PT domain — revisão 2026-06-22).
- [`research/eli-international-dossier.md`](research/eli-international-dossier.md) e [`research/eli-pt-gap-analysis.md`](research/eli-pt-gap-analysis.md).

---

## 16. Forma proposta anterior (DAPL) — evolução a propor à INCM

Antes de confirmar que Portugal já tinha ELI em produção, a DAPL desenhou uma
forma mais limpa e alinhada com a escola UE/França:

```
https://eli.gov.pt/eli/{jurisdiction}/{type}/{year}/{number}/{language}[/{point-in-time}][.{format}][#{fragment}]
ex.: https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt
```

Vantagens face ao template `data.dre.pt` em produção:

- **Auto-suficiente face a citações abreviadas:** construível mesmo a partir de
  uma citação *abreviada* (`Decreto-Lei n.º 22/2026`, sem "de {dia} de {mês}"),
  enquanto o template `data.dre.pt` exige a data completa. **Nota franca:** a
  citação legística *completa* inclui sempre a data ("Decreto-Lei n.º 22/2026,
  de {dia} de {mês}"), pelo que o template `data.dre.pt` também é construível a
  partir dela; esta vantagem da forma `eli.gov.pt` aplica-se só ao caso da
  citação abreviada.
- **Jurisdição explícita** (`pt-20`/`pt-30`) para actos regionais.
- Alinhamento estético com o padrão **ano+número** da UE
  (`data.europa.eu/eli/reg/2016/679/oj`).

Esta forma **não é canónica** em v0.2 — fica registada como contributo técnico
para a reunião. **Análise franca:** a forma da INCM (tipo/número/data) **não é
errada** — é a tradição legística portuguesa, em que o acto se cita pela data;
a forma `eli.gov.pt` (ano+número) é apenas uma alternativa estética alinhada
com a UE. O validador AKN-PT aceita ambas (tolerância, cf. `EliPtUriType`); o
conversor (`conversion.py`) produz as duas.
