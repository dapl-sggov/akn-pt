<?xml version="1.0" encoding="UTF-8"?>
<!--
  AKN-PT Schematron rules (v0.1.0)
  ================================
  Regras que o XSD nao consegue exprimir: invariantes cross-element,
  integridade referencial, coerencia entre tipo de ato e estrutura,
  convencoes de legistica.

  Tres fases (ADR-0004):
    drafting     warnings, sem errors estruturais
    review       muitas regras como errors mas legistica como warnings
    publication  estricto

  Licenca: EUPL-1.2
-->
<!--
  queryBinding: usamos xslt 1.0 para compatibilidade com lxml.isoschematron.
  Para produccao com Saxon-HE/EE, este atributo pode ser elevado para xslt2
  e a regra com matches() (artigo num pattern) pode ser activada.
-->
<sch:schema xmlns:sch="http://purl.oclc.org/dsdl/schematron"
            xmlns:akn="http://docs.oasis-open.org/legaldocml/ns/akn/3.0/CSD17"
            xmlns:akn-pt="http://eli.gov.pt/ns/akn-pt/1.0"
            queryBinding="xslt">

  <sch:title>AKN-PT validation rules v0.1.1</sch:title>

  <sch:ns prefix="akn" uri="http://docs.oasis-open.org/legaldocml/ns/akn/3.0/CSD17"/>
  <sch:ns prefix="akn-pt" uri="http://eli.gov.pt/ns/akn-pt/1.0"/>

  <!-- ===================================================================
       PHASES
       =================================================================== -->

  <sch:phase id="drafting">
    <sch:active pattern="structural-integrity"/>
    <sch:active pattern="referential-integrity"/>
  </sch:phase>

  <sch:phase id="review">
    <sch:active pattern="structural-integrity"/>
    <sch:active pattern="referential-integrity"/>
    <sch:active pattern="metadata-completeness"/>
    <sch:active pattern="act-type-coherence"/>
    <sch:active pattern="subtype-coherence"/>
    <sch:active pattern="legistica-conventions"/>
  </sch:phase>

  <sch:phase id="publication">
    <sch:active pattern="structural-integrity"/>
    <sch:active pattern="referential-integrity"/>
    <sch:active pattern="metadata-completeness"/>
    <sch:active pattern="act-type-coherence"/>
    <sch:active pattern="subtype-coherence"/>
    <sch:active pattern="legistica-conventions"/>
    <sch:active pattern="lifecycle-coherence"/>
    <sch:active pattern="frbr-uri-consistency"/>
    <sch:active pattern="legislative-footprint"/>
    <sch:active pattern="temporal-consistency"/>
  </sch:phase>

  <!-- ===================================================================
       PATTERN: structural-integrity
       =================================================================== -->

  <sch:pattern id="structural-integrity">
    <sch:title>Integridade estrutural</sch:title>

    <sch:rule context="akn:akomaNtoso">
      <sch:assert test="count(akn:act) = 1">
        [STR-0001] akomaNtoso deve conter exactamente um act.
      </sch:assert>
    </sch:rule>

    <sch:rule context="akn:article">
      <sch:assert test="akn:heading">
        [STR-0002] Artigo deve ter epigrafe (heading).
      </sch:assert>
      <sch:assert test="akn:num">
        [STR-0003] Artigo deve ter elemento num.
      </sch:assert>
    </sch:rule>

    <sch:rule context="akn:body">
      <sch:assert test="count(akn:article) + count(akn:paragraph) + count(akn:chapter) + count(akn:title) + count(akn:part) + count(akn:book) >= 1">
        [STR-0004] body deve ter pelo menos um articulado (article, paragraph, ou container superior).
      </sch:assert>
    </sch:rule>

    <sch:rule context="akn:chapter">
      <sch:assert test="count(akn:article) + count(akn:section) >= 1">
        [STR-0005] Capitulo deve ter pelo menos um artigo ou seccao.
      </sch:assert>
    </sch:rule>

    <sch:rule context="akn:paragraph">
      <sch:assert test="akn:content or akn:list">
        [STR-0006] paragraph deve conter content ou list.
      </sch:assert>
    </sch:rule>
  </sch:pattern>

  <!-- ===================================================================
       PATTERN: referential-integrity
       =================================================================== -->

  <sch:pattern id="referential-integrity">
    <sch:title>Integridade referencial</sch:title>

    <sch:rule context="akn:*[@eId]">
      <sch:let name="eid" value="@eId"/>
      <sch:assert test="count(//akn:*[@eId = $eid]) = 1">
        [REF-0001] eId deve ser unico no documento (encontrado: <sch:value-of select="$eid"/>).
      </sch:assert>
    </sch:rule>

    <sch:rule context="akn:ref[starts-with(@href, '#')]">
      <sch:let name="target" value="substring-after(@href, '#')"/>
      <sch:assert test="//akn:*[@eId = $target]">
        [REF-0002] Referencia interna (#<sch:value-of select="$target"/>) nao resolve para nenhum eId.
      </sch:assert>
    </sch:rule>

    <sch:rule context="akn:*[starts-with(@href, '#') or starts-with(@refersTo, '#') or starts-with(@source, '#') or starts-with(@as, '#')]">
      <sch:let name="ref" value="(@href|@refersTo|@source|@as)[1]"/>
      <sch:let name="target" value="substring-after($ref, '#')"/>
      <sch:assert test="//akn:*[@eId = $target]">
        [REF-0003] Referencia interna (<sch:value-of select="$ref"/>) nao resolve para nenhum eId em references.
      </sch:assert>
    </sch:rule>
  </sch:pattern>

  <!-- ===================================================================
       PATTERN: metadata-completeness
       =================================================================== -->

  <sch:pattern id="metadata-completeness">
    <sch:title>Completude de metadados</sch:title>

    <sch:rule context="akn:identification">
      <sch:assert test="akn:FRBRWork and akn:FRBRExpression and akn:FRBRManifestation">
        [META-0001] identification deve ter FRBRWork, FRBRExpression e FRBRManifestation.
      </sch:assert>
    </sch:rule>

    <sch:rule context="akn:FRBRWork">
      <sch:assert test="akn:FRBRdate[@name='adoption']">
        [META-0002] FRBRWork deve ter FRBRdate name='adoption'.
      </sch:assert>
      <sch:assert test="akn:FRBRsubtype">
        [META-0003] FRBRWork deve declarar FRBRsubtype (obrigatorio em AKN-PT v0.1.0).
      </sch:assert>
    </sch:rule>

    <sch:rule context="akn:FRBRExpression">
      <sch:assert test="akn:FRBRdate[@name='publication']">
        [META-0004] FRBRExpression deve ter FRBRdate name='publication'.
      </sch:assert>
      <sch:assert test="akn:FRBRlanguage[@language='por']">
        [META-0005] FRBRExpression deve declarar FRBRlanguage language='por'.
      </sch:assert>
    </sch:rule>

    <sch:rule context="akn:FRBRManifestation">
      <sch:assert test="akn:FRBRformat[starts-with(@value,'application/akn+xml')]">
        [META-0006] FRBRManifestation deve declarar FRBRformat com profile akn-pt.
      </sch:assert>
    </sch:rule>

    <sch:rule context="akn:preface">
      <sch:assert test=".//akn:docType">
        [META-0007] preface deve conter docType.
      </sch:assert>
      <sch:assert test=".//akn:docNumber">
        [META-0008] preface deve conter docNumber.
      </sch:assert>
      <sch:assert test=".//akn:shortTitle">
        [META-0009] preface deve conter shortTitle (ementa).
      </sch:assert>
    </sch:rule>
  </sch:pattern>

  <!-- ===================================================================
       PATTERN: act-type-coherence
       =================================================================== -->

  <sch:pattern id="act-type-coherence">
    <sch:title>Coerencia entre tipo de ato e estrutura</sch:title>

    <!-- IMPORTANTE: em Schematron, dentro de cada pattern apenas a primeira
         rule que matcha um node aplica-se. Por isso as rules especificas tem
         de vir ANTES da rule generica akn:act. -->

    <sch:rule context="akn:act[@name='dec-lei']">
      <sch:assert test="akn:conclusions/akn:signature[@role='promulgation']">
        [ACT-0001] Decreto-Lei deve ter signature role='promulgation' no conclusions (promulgacao pelo PR).
      </sch:assert>
      <sch:assert test="akn:conclusions/akn:signature[@role='countersignature']">
        [ACT-0002] Decreto-Lei deve ter pelo menos uma signature role='countersignature' (referenda PM/ministro).
      </sch:assert>
    </sch:rule>

    <sch:rule context="akn:act[@name='lei']">
      <sch:assert test="akn:conclusions/akn:signature[@role='promulgation']">
        [ACT-0003] Lei deve ter signature role='promulgation' no conclusions.
      </sch:assert>
      <sch:assert test="count(akn:conclusions/akn:signature[@role='countersignature']) = 1">
        [ACT-0004] Lei deve ter exactamente UMA signature role='countersignature' (PM, art. 140.o CRP).
      </sch:assert>
      <sch:assert test=".//akn:FRBRauthor[@href='#ar']">
        [ACT-0005] Lei deve ter FRBRauthor href='#ar' (Assembleia da Republica).
      </sch:assert>
    </sch:rule>

    <sch:rule context="akn:act[@name='res-cm']">
      <sch:assert test="not(akn:body//akn:article)">
        [ACT-0006] RCM nao deve conter article no body (usa paragraph). Erro frequente.
      </sch:assert>
      <sch:assert test="akn:body/akn:paragraph">
        [ACT-0007] RCM deve ter pelo menos um paragraph em body.
      </sch:assert>
      <sch:assert test="not(akn:conclusions/akn:signature[@role='promulgation'])">
        [ACT-0008] RCM nao tem promulgacao pelo PR; nao deve ter signature role='promulgation'.
      </sch:assert>
      <sch:assert test="count(akn:conclusions/akn:signature) = 1">
        [ACT-0009] RCM deve ter exactamente UMA signature (Primeiro-Ministro).
      </sch:assert>
    </sch:rule>

    <sch:rule context="akn:act[@name='portaria']">
      <sch:assert test="not(akn:conclusions/akn:signature[@role='promulgation'])">
        [ACT-0010] Portaria nao tem promulgacao; nao deve ter signature role='promulgation'.
      </sch:assert>
      <sch:assert test="akn:conclusions/akn:signature[@role='signature']">
        [ACT-0011] Portaria deve ter pelo menos uma signature role='signature' (ministerial).
      </sch:assert>
      <sch:assert test="akn:preamble//akn:ref">
        [ACT-0012] Portaria deve conter ref a lei ou DL habilitante no preambulo (principio da legalidade).
      </sch:assert>
    </sch:rule>

    <sch:rule context="akn:act[@name='res-ar']">
      <sch:assert test="not(akn:body//akn:article)">
        [ACT-0013] Resolucao da AR nao deve conter article no body (usa paragraph).
      </sch:assert>
      <sch:assert test="count(akn:conclusions/akn:signature) = 1">
        [ACT-0014] Resolucao da AR deve ter exactamente UMA signature (Presidente da AR).
      </sch:assert>
    </sch:rule>

    <sch:rule context="akn:act[@name='despacho-normativo']">
      <sch:assert test="akn:preamble//akn:ref">
        [ACT-0015] Despacho normativo deve conter ref a lei/DL habilitante no preambulo.
      </sch:assert>
      <sch:assert test="not(akn:conclusions/akn:signature[@role='promulgation'])">
        [ACT-0016] Despacho normativo nao tem promulgacao.
      </sch:assert>
    </sch:rule>

    <sch:rule context="akn:act[@name='dlr']">
      <sch:assert test=".//akn:FRBRcountry[@value='pt-20' or @value='pt-30']">
        [ACT-0017] DLR deve ter FRBRcountry pt-20 (Acores) ou pt-30 (Madeira).
      </sch:assert>
      <sch:assert test="not(akn:conclusions/akn:signature/akn:person[@as='#presidente-republica'])">
        [ACT-0018] DLR nao deve ser promulgado pelo Presidente da Republica (e' o Representante da Republica).
      </sch:assert>
    </sch:rule>

    <sch:rule context="akn:act[@name='drr']">
      <sch:assert test=".//akn:FRBRcountry[@value='pt-20' or @value='pt-30']">
        [ACT-0019] DRR deve ter FRBRcountry pt-20 ou pt-30.
      </sch:assert>
      <sch:assert test="akn:preamble//akn:ref">
        [ACT-0020] DRR deve referenciar DLR ou lei habilitante no preambulo.
      </sch:assert>
    </sch:rule>

  </sch:pattern>

  <!-- Pattern separado: a coerencia name<->subtype tem de viver fora do
       pattern act-type-coherence, senao colide com as rules especificas. -->
  <sch:pattern id="subtype-coherence">
    <sch:title>Coerencia entre act/@name e FRBRsubtype</sch:title>
    <sch:rule context="akn:act">
      <sch:let name="name" value="@name"/>
      <sch:let name="subtype" value=".//akn:FRBRsubtype/@value"/>
      <sch:assert test="not($subtype) or starts-with($subtype, $name) or $subtype = $name">
        [SUB-0001] FRBRsubtype (<sch:value-of select="$subtype"/>) deve comecar com o act/@name (<sch:value-of select="$name"/>).
      </sch:assert>
    </sch:rule>
  </sch:pattern>

  <!-- ===================================================================
       PATTERN: legistica-conventions
       =================================================================== -->

  <sch:pattern id="legistica-conventions">
    <sch:title>Convencoes de legistica portuguesa</sch:title>

    <sch:rule context="akn:recital//akn:p[@class='formula']">
      <sch:report test="not(starts-with(normalize-space(.), 'Considerando'))" role="warning">
        [LEG-0001] Considerando deveria comecar por 'Considerando que' (formula canonica).
      </sch:report>
    </sch:rule>

    <sch:rule context="akn:article/akn:heading">
      <sch:assert test="normalize-space(.) != ''">
        [LEG-0002] Epigrafe de artigo nao pode ser vazia.
      </sch:assert>
    </sch:rule>

    <sch:rule context="akn:article/akn:num">
      <sch:report test="not(starts-with(normalize-space(.), 'Artigo '))" role="warning">
        [LEG-0003] Num de artigo deveria comecar por 'Artigo' (padrao 'Artigo N.o').
      </sch:report>
    </sch:rule>
  </sch:pattern>

  <!-- ===================================================================
       PATTERN: lifecycle-coherence
       =================================================================== -->

  <sch:pattern id="lifecycle-coherence">
    <sch:title>Coerencia de eventos lifecycle</sch:title>

    <sch:rule context="akn:lifecycle">
      <sch:assert test="akn:eventRef[@refersTo='#publication']">
        [LIFE-0001] Lifecycle deve conter evento publication (todos os atos publicados).
      </sch:assert>
    </sch:rule>

    <sch:rule context="akn:eventRef[@refersTo='#publication']">
      <!-- XPath 1.0: traduzir ISO date para numero para comparar (20260315 >= 20260310). -->
      <sch:let name="pub_num" value="number(translate(@date, '-', ''))"/>
      <sch:let name="adoption_num" value="number(translate(//akn:FRBRWork/akn:FRBRdate[@name='adoption']/@date, '-', ''))"/>
      <sch:assert test="$pub_num >= $adoption_num">
        [LIFE-0002] Data de publicacao (<sch:value-of select="@date"/>) deve ser >= data de adopcao (<sch:value-of select="//akn:FRBRWork/akn:FRBRdate[@name='adoption']/@date"/>).
      </sch:assert>
    </sch:rule>
  </sch:pattern>

  <!-- ===================================================================
       PATTERN: legislative-footprint  (Lei n.o 5-A/2026)
       Aplica-se a actos publicados a partir de 2026-07-27.
       Activa apenas em publication phase.
       =================================================================== -->

  <sch:pattern id="legislative-footprint">
    <sch:title>Pegada legislativa (Lei n.o 5-A/2026)</sch:title>

    <!-- Threshold: 2026-07-27 -> 20260727 quando convertido para inteiro. -->

    <sch:rule context="akn:act">
      <sch:let name="pub_num" value="number(translate(.//akn:FRBRExpression/akn:FRBRdate[@name='publication']/@date, '-', ''))"/>
      <sch:let name="threshold" value="20260727"/>
      <sch:assert test="not($pub_num >= $threshold) or akn:meta/akn-pt:workflow">
        [FOOT-0001] Pegada legislativa: actos publicados a partir de 2026-07-27 devem ter bloco akn-pt:workflow em meta (Lei n.o 5-A/2026).
      </sch:assert>
    </sch:rule>

    <sch:rule context="akn-pt:workflow">
      <sch:let name="pub_num" value="number(translate(/akn:akomaNtoso/akn:act/akn:meta/akn:identification/akn:FRBRExpression/akn:FRBRdate[@name='publication']/@date, '-', ''))"/>
      <sch:let name="threshold" value="20260727"/>

      <!-- Para actos publicados a partir de 2026-07-27, exigir steps minimos. -->
      <sch:assert test="not($pub_num >= $threshold) or akn-pt:step[@refersTo='#iniciativa']">
        [FOOT-0002] Pegada legislativa: workflow deve incluir step refersTo='#iniciativa'.
      </sch:assert>
      <sch:assert test="not($pub_num >= $threshold) or akn-pt:step[@refersTo='#aprovacao-cm' or @refersTo='#aprovacao-ar' or @refersTo='#assinatura']">
        [FOOT-0003] Pegada legislativa: workflow deve incluir step de aprovacao (#aprovacao-cm, #aprovacao-ar ou #assinatura).
      </sch:assert>
      <sch:assert test="not($pub_num >= $threshold) or akn-pt:step[@refersTo='#publicacao']">
        [FOOT-0004] Pegada legislativa: workflow deve incluir step refersTo='#publicacao'.
      </sch:assert>
    </sch:rule>

    <sch:rule context="akn-pt:step">
      <!-- Cada step com inputs: input/@source deve resolver para um TLC actor. -->
      <sch:assert test="not(akn-pt:input) or count(akn-pt:input[starts-with(@source, '#')]) = count(akn-pt:input)">
        [FOOT-0005] Pegada legislativa: cada input deve ter @source que comece por '#' (referencia interna a TLC actor).
      </sch:assert>
    </sch:rule>

    <sch:rule context="akn-pt:input">
      <!-- Datas dos inputs devem estar dentro do periodo do step pai (mesma data ou anterior). -->
      <sch:let name="input_num" value="number(translate(@date, '-', ''))"/>
      <sch:let name="step_num" value="number(translate(../@date, '-', ''))"/>
      <sch:report test="$input_num > $step_num" role="warning">
        [FOOT-0006] Pegada legislativa: input com data posterior a' do step pai pode indicar incoerencia temporal.
      </sch:report>
    </sch:rule>
  </sch:pattern>

  <!-- ===================================================================
       PATTERN: frbr-uri-consistency
       =================================================================== -->

  <sch:pattern id="frbr-uri-consistency">
    <sch:title>Coerencia entre URIs FRBR e tipo de ato</sch:title>

    <sch:rule context="akn:FRBRWork/akn:FRBRuri">
      <sch:let name="actname" value="//akn:act/@name"/>
      <!-- Mapa <act name> AKN-PT -> slug ELI REAL da INCM (eli-pt/incm-eli-reference.md).
           A coerencia aceita o segmento do act/@name (forma proposta eli.gov.pt)
           OU o slug ELI da INCM (forma canonica data.dre.pt). -->
      <sch:let name="slugmap" value="'|dec-lei=dec-lei|lei=lei|portaria=port|res-cm=resolconsmin|res-ar=resolassrep|despacho-normativo=despnorm|dlr=declegreg|drr=decregulreg|decreto-ar=dec|'"/>
      <sch:let name="slug" value="substring-before(substring-after($slugmap, concat('|', $actname, '=')), '|')"/>
      <sch:assert test="contains(@value, concat('/', $actname, '/')) or ($slug != '' and contains(@value, concat('/', $slug, '/')))">
        [FRBR-0001] FRBRuri Work (<sch:value-of select="@value"/>) deve conter o segmento /<sch:value-of select="$actname"/>/ (forma proposta) ou /<sch:value-of select="$slug"/>/ (slug ELI da INCM), para coerencia com act/@name.
      </sch:assert>
    </sch:rule>

    <sch:rule context="akn:FRBRExpression/akn:FRBRuri">
      <sch:let name="work" value="//akn:FRBRWork/akn:FRBRuri/@value"/>
      <sch:assert test="starts-with(@value, $work)">
        [FRBR-0002] FRBRuri Expression deve estender o FRBRuri Work.
      </sch:assert>
    </sch:rule>

    <sch:rule context="akn:FRBRManifestation/akn:FRBRuri">
      <sch:let name="expr" value="//akn:FRBRExpression/akn:FRBRuri/@value"/>
      <sch:assert test="starts-with(@value, $expr)">
        [FRBR-0003] FRBRuri Manifestation deve estender o FRBRuri Expression.
      </sch:assert>
    </sch:rule>
  </sch:pattern>

  <!-- ===================================================================
       PATTERN: temporal-consistency  (v0.1.2 — TIMP-*)
       Coerencia temporal das Expressoes consolidadas / rectificadas.
       Apenas activo em publication phase. As Expressoes Work-originarias
       (primeira publicacao, sem consolidation/rectification) nao disparam
       estas regras.
       =================================================================== -->

  <sch:pattern id="temporal-consistency">
    <sch:title>Coerencia temporal — consolidacoes e rectificacoes</sch:title>

    <!-- TIMP-0001: Expressao consolidada/rectificada DEVE ter versionNumber >= 2.
         (A versao 1 esta reservada a Expressao Work-originaria.) -->
    <sch:rule context="akn:FRBRExpression[akn:FRBRdate[@name='consolidation'] or akn:FRBRdate[@name='rectification']]">
      <sch:let name="ver" value="number(akn:FRBRversionNumber/@value)"/>
      <sch:assert test="$ver >= 2">
        [TIMP-0001] Expressao com FRBRdate name='consolidation' ou 'rectification' deve ter FRBRversionNumber >= 2 (a versao 1 esta reservada a Expressao originaria).
      </sch:assert>
    </sch:rule>

    <!-- TIMP-0002: A data de consolidation/rectification DEVE ser >= data de
         publication originaria (nao se pode consolidar antes da publicacao). -->
    <sch:rule context="akn:FRBRdate[@name='consolidation' or @name='rectification']">
      <sch:let name="dt"  value="number(translate(@date, '-', ''))"/>
      <sch:let name="pub" value="number(translate(../akn:FRBRdate[@name='publication']/@date, '-', ''))"/>
      <sch:assert test="not($pub) or $dt >= $pub">
        [TIMP-0002] Data de <sch:value-of select="@name"/> (<sch:value-of select="@date"/>) deve ser >= data de publicacao (<sch:value-of select="../akn:FRBRdate[@name='publication']/@date"/>).
      </sch:assert>
    </sch:rule>

    <!-- TIMP-0003: Se ha passiveModifications/textualMod, a Expressao DEVE
         declarar FRBRdate name='consolidation' ou 'rectification' (e
         versionNumber >= 2). Caso contrario, a Expressao e' inconsistente
         (alteracoes registadas mas a Expressao apresenta-se como originaria). -->
    <sch:rule context="akn:passiveModifications[akn:textualMod]">
      <sch:let name="hasConsol" value="boolean(//akn:FRBRExpression/akn:FRBRdate[@name='consolidation' or @name='rectification'])"/>
      <sch:assert test="$hasConsol">
        [TIMP-0003] passiveModifications com textualMod indica Expressao consolidada/rectificada, mas FRBRExpression nao declara FRBRdate name='consolidation' nem 'rectification'.
      </sch:assert>
    </sch:rule>

    <!-- TIMP-0004 (informativo): cada textualMod deve ter source + destination
         (campos opcionais no XSD mas obrigatorios em consolidacoes reais para
         rastreabilidade da alteracao). -->
    <sch:rule context="akn:textualMod">
      <sch:report test="not(akn:source) or not(akn:destination)" role="warning">
        [TIMP-0004] textualMod sem source e/ou destination — recomendado para rastreabilidade (apenas warning, opcional no XSD).
      </sch:report>
    </sch:rule>
  </sch:pattern>

</sch:schema>
