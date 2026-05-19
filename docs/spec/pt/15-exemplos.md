# 15. Exemplos

Este capítulo ilustra a marcação AKN-PT com fragmentos curtos. O corpus
completo (Artefacto 6) contém 10 documentos reais marcados na íntegra; está
em `corpus/` no repositório, com README descritivo.

## 15.1 Decreto-Lei minimal

```xml
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0/CSD17">
  <act name="dec-lei">
    <meta>
      <identification source="#dapl">
        <FRBRWork>
          <FRBRthis value="https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt/!main"/>
          <FRBRuri value="https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt"/>
          <FRBRdate date="2026-03-10" name="adoption"/>
          <FRBRauthor href="#governo"/>
          <FRBRcountry value="pt"/>
          <FRBRsubtype value="dec-lei-ordinario"/>
          <FRBRnumber value="22"/>
        </FRBRWork>
        <!-- FRBRExpression e FRBRManifestation análogos -->
      </identification>
      <references source="#dapl">
        <TLCOrganization eId="governo" href="/akn/ontology/organization/pt/governo" showAs="Governo da República Portuguesa"/>
        <TLCRole eId="primeiro-ministro" href="/akn/ontology/role/pt/primeiro-ministro" showAs="Primeiro-Ministro"/>
        <TLCRole eId="presidente-republica" href="/akn/ontology/role/pt/presidente-republica" showAs="Presidente da República"/>
        <TLCPerson eId="pessoa-pm-2026-03" href="/akn/ontology/person/pt/pm-2026-03" showAs="Primeiro-Ministro"/>
        <TLCPerson eId="pessoa-pr-2026-03" href="/akn/ontology/person/pt/pr-2026-03" showAs="Presidente da República"/>
      </references>
      <lifecycle source="#dapl">
        <eventRef eId="e1" date="2026-03-10" source="#governo" type="generation" refersTo="#approval-cm"/>
        <eventRef eId="e2" date="2026-03-12" source="#governo" type="generation" refersTo="#promulgation"/>
        <eventRef eId="e3" date="2026-03-15" source="#dre" type="generation" refersTo="#publication"/>
      </lifecycle>
      <analysis source="#dapl"><activeModifications/><passiveModifications/></analysis>
    </meta>
    <preface>
      <p class="docTitle"><docType>Decreto-Lei</docType> <docNumber>n.º 22/2026</docNumber></p>
      <p class="docDate"><date date="2026-03-15">de 15 de março</date></p>
      <shortTitle>Estabelece o regime jurídico de X.</shortTitle>
    </preface>
    <preamble>
      <recital eId="rec_1"><p class="formula">Considerando que ...</p></recital>
      <formula type="enacting">
        <p>Assim: Nos termos da alínea a) do n.º 1 do artigo 198.º da Constituição, o Governo decreta o seguinte:</p>
      </formula>
    </preamble>
    <body>
      <article eId="art_1">
        <num>Artigo 1.º</num>
        <heading>Objeto</heading>
        <paragraph eId="art_1__para_1">
          <content><p>O presente decreto-lei estabelece ...</p></content>
        </paragraph>
      </article>
    </body>
    <conclusions>
      <formula type="conclusion"><p>Visto e aprovado em Conselho de Ministros de <date date="2026-03-10">10 de março de 2026</date>.</p></formula>
      <signature role="countersignature"><person refersTo="#pessoa-pm-2026-03" as="#primeiro-ministro"/></signature>
      <formula type="promulgation"><p>Promulgado em <date date="2026-03-12">12 de março de 2026</date>.</p></formula>
      <signature role="promulgation"><person refersTo="#pessoa-pr-2026-03" as="#presidente-republica"/></signature>
    </conclusions>
  </act>
</akomaNtoso>
```

## 15.2 Artigo com definições — `<list>` de `<point>`

```xml
<article eId="art_2">
  <num>Artigo 2.º</num>
  <heading>Definições</heading>
  <paragraph eId="art_2__para_1">
    <intro><p>Para efeitos do presente decreto-lei, entende-se por:</p></intro>
    <list>
      <point eId="art_2__para_1__lit_a">
        <num>a)</num>
        <content><p><b>«Autoridade competente»</b>, a entidade designada nos termos do <ref href="#art_3">artigo 3.º</ref>;</p></content>
      </point>
      <point eId="art_2__para_1__lit_b">
        <num>b)</num>
        <content><p><b>«Procedimento»</b>, o conjunto de actos descritos no Capítulo II.</p></content>
      </point>
    </list>
  </paragraph>
</article>
```

Notas:
- O parágrafo **não tem `<num>`** — é o único parágrafo do artigo, convenção
  legística PT (ver [cap. 5 §5.4](05-estrutura-documento.md)).
- Quando o artigo passar a ter mais que um parágrafo, **todos** ganham número.

## 15.2.1 Alínea com subalíneas (i, ii, iii)

Quando uma alínea precisa de subdivisões, o `<point>` da alínea contém uma
`<list>` interna com `<point>`s — estrutura recursiva permitida pelo schema.

```xml
<article eId="art_2">
  <num>Artigo 2.º</num>
  <heading>Definições</heading>
  <paragraph eId="art_2__para_1">
    <intro><p>Para efeitos do presente diploma, entende-se por:</p></intro>
    <list>
      <point eId="art_2__para_1__lit_a">
        <num>a)</num>
        <content><p><b>«Termo A»</b>, definição simples;</p></content>
      </point>
      <point eId="art_2__para_1__lit_b">
        <num>b)</num>
        <intro><p><b>«Termo B»</b>, definição que se desdobra em:</p></intro>
        <list>
          <point eId="art_2__para_1__lit_b__sublit_i">
            <num>i)</num>
            <content><p>sub-condição 1;</p></content>
          </point>
          <point eId="art_2__para_1__lit_b__sublit_ii">
            <num>ii)</num>
            <content><p>sub-condição 2;</p></content>
          </point>
          <point eId="art_2__para_1__lit_b__sublit_iii">
            <num>iii)</num>
            <content><p>sub-condição 3.</p></content>
          </point>
        </list>
      </point>
      <point eId="art_2__para_1__lit_c">
        <num>c)</num>
        <content><p><b>«Termo C»</b>, definição final.</p></content>
      </point>
    </list>
  </paragraph>
</article>
```

- Subalíneas em romano minúsculo: `i)`, `ii)`, `iii)`, `iv)`, …
- eId: prefixo `__sublit_` (e.g. `art_2__para_1__lit_b__sublit_i`).
- O ponto da alínea `b)` tem `<intro>` (texto antes da lista interna) + `<list>` (com 3 subalíneas).
- A alínea `c)` continua o nível superior — não está aninhada na `b)`.

## 15.3 RCM (sem `<article>`!)

```xml
<act name="res-cm">
  <!-- meta, preface análogos, com FRBRauthor="#cm" e FRBRsubtype="res-cm-normativa" -->
  <preamble>
    <recital eId="rec_1"><p class="formula">Considerando que é necessário aprovar a estratégia.</p></recital>
  </preamble>
  <body>
    <paragraph eId="para_1">
      <num>1 -</num>
      <content><p>Aprovar a Estratégia Nacional para X, constante do anexo I à presente resolução.</p></content>
    </paragraph>
    <paragraph eId="para_2">
      <num>2 -</num>
      <intro><p>Determinar que:</p></intro>
      <list>
        <point eId="para_2__lit_a">
          <num>a)</num>
          <content><p>O acompanhamento da Estratégia compete ...</p></content>
        </point>
      </list>
    </paragraph>
  </body>
  <conclusions>
    <formula type="conclusion"><p>Presidência do Conselho de Ministros, <date date="2026-04-20">20 de abril de 2026</date>.</p></formula>
    <signature role="signature"><person refersTo="#pessoa-pm-2026-04" as="#primeiro-ministro"/></signature>
  </conclusions>
  <attachments>
    <attachment eId="anx_1">
      <heading>Anexo I</heading>
      <subheading>Estratégia Nacional para X</subheading>
      <mainBody><!-- conteúdo da estratégia --></mainBody>
    </attachment>
  </attachments>
</act>
```

## 15.4 Alteração com `<quotedStructure>`

```xml
<article eId="art_2">
  <num>Artigo 2.º</num>
  <heading>Alteração ao Decreto-Lei n.º 22/2025, de 5 de novembro</heading>
  <paragraph eId="art_2__para_1">
    <intro>
      <p>São alterados os artigos 3.º e 5.º do <ref href="https://eli.gov.pt/eli/pt/dec-lei/2025/22/pt">Decreto-Lei n.º 22/2025, de 5 de novembro</ref>, que passam a ter a seguinte redação:</p>
    </intro>
    <quotedStructure>
      <article eId="quoted__art_3">
        <num>Artigo 3.º</num>
        <heading>Autoridade competente</heading>
        <paragraph eId="quoted__art_3__para_1">
          <content><p>A autoridade competente para os efeitos do presente decreto-lei é o INFARMED, I.P.</p></content>
        </paragraph>
      </article>
    </quotedStructure>
  </paragraph>
</article>
```

## 15.5 DLR (Açores)

```xml
<act name="dlr">
  <meta>
    <identification source="#dapl">
      <FRBRWork>
        <FRBRthis value="https://eli.gov.pt/eli/pt-20/dlr/2026/3/pt/!main"/>
        <FRBRuri value="https://eli.gov.pt/eli/pt-20/dlr/2026/3/pt"/>
        <FRBRdate date="2026-03-15" name="adoption"/>
        <FRBRauthor href="#alra"/>
        <FRBRcountry value="pt-20"/>
        <FRBRsubtype value="dlr-ordinario"/>
        <FRBRnumber value="3"/>
      </FRBRWork>
      <!-- Expression, Manifestation análogos -->
    </identification>
    <!-- references com #alra, #presidente-alra, #representante-republica-acores, etc. -->
  </meta>
  <preface>
    <p class="docTitle"><docType>Decreto Legislativo Regional</docType> <docNumber>n.º 3/2026/A</docNumber></p>
    <shortTitle>Aprova o regime regional de X.</shortTitle>
  </preface>
  <preamble>
    <formula type="enacting">
      <p>A Assembleia Legislativa da Região Autónoma dos Açores decreta, nos termos da alínea a) do n.º 1 do artigo 227.º e do n.º 1 do artigo 232.º da Constituição da República Portuguesa, e da alínea c) do n.º 1 do artigo 31.º do Estatuto Político-Administrativo da Região Autónoma dos Açores, o seguinte:</p>
    </formula>
  </preamble>
  <body>
    <article eId="art_1">
      <num>Artigo 1.º</num>
      <heading>Objeto</heading>
      <paragraph eId="art_1__para_1">
        <content><p>O presente decreto legislativo regional ...</p></content>
      </paragraph>
    </article>
  </body>
  <conclusions>
    <signature role="signature"><person refersTo="#pessoa-palra-2026-03" as="#presidente-alra"/></signature>
    <formula type="promulgation"><p>Assinado em Ponta Delgada, em <date date="2026-03-18">18 de março de 2026</date>.</p></formula>
    <signature role="promulgation"><person refersTo="#pessoa-rr-acores-2026-03" as="#representante-republica-acores"/></signature>
  </conclusions>
</act>
```

## 15.6 Portaria conjunta

Particularidades: múltiplos `<FRBRauthor>` no Work e múltiplas `<signature
role="signature">` no `<conclusions>`.

```xml
<FRBRWork>
  <FRBRthis value=".../portaria/2026/87/pt/!main"/>
  <FRBRuri value=".../portaria/2026/87/pt"/>
  <FRBRdate date="2026-05-10" name="adoption"/>
  <FRBRauthor href="#ministro-financas"/>
  <FRBRauthor href="#ministro-saude"/>
  <FRBRcountry value="pt"/>
  <FRBRsubtype value="portaria-regulamentar"/>
  <FRBRnumber value="87"/>
</FRBRWork>

...

<conclusions>
  <signature role="signature"><person refersTo="#pessoa-min-fin-2026-05" as="#ministro-financas-role"/></signature>
  <signature role="signature"><person refersTo="#pessoa-min-sau-2026-05" as="#ministro-saude-role"/></signature>
</conclusions>
```

## 15.7 Onde estão os exemplos completos

O corpus de 10 documentos reais está em `corpus/`:

```
corpus/
├── dec-lei/      (3 ficheiros — DL simples; DL com anexos; DL alterador com republicação)
├── lei/          (1 ficheiro)
├── decreto-ar/   (1 ficheiro — aprovação de tratado)
├── portaria/     (1 ficheiro)
├── res-cm/       (1 ficheiro)
├── despacho/     (1 ficheiro — despacho normativo)
└── dlr/          (1 ficheiro)

+ 1 ficheiro de texto consolidado (versão consolidada de um dos DLs)
```

Cada ficheiro tem comentário inicial com:

- Tipo, número, ano, ementa.
- Fonte (URL dre.pt do diploma real).
- Coverage demonstrada por aquele exemplo (que aspectos do AKN-PT exercita).
- Aspectos não cobertos (deixados para outros exemplos do corpus).

Cada ficheiro **deve** validar contra `schema/xsd/akn-pt.xsd` e
`schema/schematron/akn-pt-rules.sch` na fase publication. O runner
`schema/tests/run_tests.py` garante isto em CI.
