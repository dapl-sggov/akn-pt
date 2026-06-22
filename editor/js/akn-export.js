// AKN-PT Editor — XML export
// Generates valid AKN-PT v0.1.0 XML from a doc state.
// EUPL-1.2

const AknExport = (() => {

  // Roles → actor mapping for FRBRauthor and signatures
  const ACTOR_FOR_TYPE = {
    'dec-lei': 'governo',
    'lei': 'ar',
    'decreto-ar': 'ar',
    'res-ar': 'ar',
    'portaria': 'ministro',
    'res-cm': 'cm',
    'despacho-normativo': 'ministro',
    'dlr': 'alra',
    'drr': 'gov-regional-acores',
  };

  function escapeXml(s) {
    if (s == null) return '';
    return String(s)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;');
  }

  // Texto com referências cruzadas resolvidas em `<ref href="…">`. Se o módulo
  // References não estiver carregado (compatibilidade), recorre a escapeXml.
  // Aceita um segundo argumento opcional `doc` (usado pelo resolver para refs
  // internas). Quem chama deve passar o doc corrente.
  function xmlText(s, doc) {
    if (typeof References !== 'undefined') {
      return References.toXmlEscaped(s, doc);
    }
    return escapeXml(s);
  }

  function id(s) {
    // Sanitize free text to a valid eId slug.
    return String(s || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unnamed';
  }

  // Constrói as URIs FRBR no template ELI-PT canónico = template de produção
  // da INCM (data.dre.pt), confirmado em 2026-06-22:
  //   Work:          https://data.dre.pt/eli/{tipo}/{nº}/{ano}/{mês}/{dia}
  //   Expression:    Work + /{p|data-consolidação}/dre/pt
  //   Manifestation: Expression + /{xml|html|pdf}   (formato é SEGMENTO)
  // A data no Work é a data de PUBLICAÇÃO (ex.: dec-lei/83/2016/12/16).
  // Língua no URI = 'pt' (2 letras, convenção INCM); o <FRBRlanguage> mantém
  // 'por' (ISO 639-2, convenção AKN). Sem segmento de jurisdição (decisão
  // 2026-06-22: data.dre.pt para todos os actos, incl. regionais); a
  // jurisdição permanece em <FRBRcountry>.
  function buildFrbr(doc) {
    const actor = ACTOR_FOR_TYPE[doc.actName] || 'governo';
    const num = doc.number || 'X';
    const pub = doc.publicationDate || doc.adoptionDate || `${doc.year}-01-01`;
    const [py, pm, pd] = pub.split('-');

    // Work: type/number/year/month/day (data de publicação original).
    const workUri = `https://data.dre.pt/eli/${doc.actName}/${num}/${py}/${pm}/${pd}`;

    // Consolidação/retificação: o segmento de versão ('p' = como publicado)
    // passa a ser a data de consolidação; a versão FRBR incrementa.
    // Sentinela '9999-12-31' do applyAll = sem consolidação.
    const isConsol = doc._consolidatedAt && doc._consolidatedAt !== '9999-12-31';
    const consolKind = doc._consolidationKind || 'consolidation';
    const versionSeg = isConsol ? doc._consolidatedAt : 'p';
    const exprUri = `${workUri}/${versionSeg}/dre/pt`;
    const manifUri = `${exprUri}/xml`;
    const version = isConsol ? (doc._consolidationVersion || 2) : 1;

    return `      <identification source="#dapl">
        <FRBRWork>
          <FRBRthis value="${workUri}/!main"/>
          <FRBRuri value="${workUri}"/>
          <FRBRdate date="${doc.adoptionDate}" name="adoption"/>
          <FRBRauthor href="#${actor}"/>
          <FRBRcountry value="${doc.country}"/>
          <FRBRsubtype value="${doc.subtype}"/>
          <FRBRnumber value="${escapeXml(num)}"/>
        </FRBRWork>
        <FRBRExpression>
          <FRBRthis value="${exprUri}/!main"/>
          <FRBRuri value="${exprUri}"/>
          <FRBRdate date="${doc.publicationDate}" name="publication"/>${isConsol ? `
          <FRBRdate date="${doc._consolidatedAt}" name="${consolKind}"/>` : ''}
          <FRBRauthor href="#${actor}"/>
          <FRBRlanguage language="por"/>
          <FRBRversionNumber value="${version}"/>
        </FRBRExpression>
        <FRBRManifestation>
          <FRBRthis value="${manifUri}/!main"/>
          <FRBRuri value="${manifUri}"/>
          <FRBRdate date="${doc.publicationDate}" name="publication"/>
          <FRBRauthor href="#dre"/>
          <FRBRformat value="application/akn+xml; profile=akn-pt-1.0"/>
        </FRBRManifestation>
      </identification>`;
  }

  function buildReferences(doc) {
    const actors = new Set();
    actors.add('dre'); actors.add('dapl');
    actors.add(ACTOR_FOR_TYPE[doc.actName] || 'governo');

    // From signatures — recolher também TÍTULOS específicos quando disponíveis
    // (e.g. "ministro-estado-financas" + showAs="Ministro de Estado e das Finanças")
    const signatureTitles = new Map();  // eId → titulo humano
    doc.signatures.forEach(s => {
      if (s.as) actors.add(s.as);
      if (s.as && s.title) signatureTitles.set(s.as, s.title);
    });

    // From footprint
    doc.workflow.forEach(step => {
      if (step.source) actors.add(step.source);
      step.inputs.forEach(inp => { if (inp.source) actors.add(inp.source); });
    });

    const isRole = (e) => /^(primeiro-ministro|presidente-republica|presidente-ar|presidente-alra|representante-republica|ministro|secretario|presidente-governo)/.test(e);

    const items = [...actors].map(eid => {
      const tag = isRole(eid) ? 'TLCRole' : 'TLCOrganization';
      const tipo = tag === 'TLCRole' ? 'role' : 'organization';
      // Privilegiar título específico se foi parsed da signature
      const showAs = signatureTitles.get(eid) || displayName(eid);
      return `        <${tag} eId="${eid}" href="/akn/ontology/${tipo}/pt/${eid}" showAs="${escapeXml(showAs)}"/>`;
    });

    // Persons referenced by signatures
    doc.signatures.forEach((s, i) => {
      const pid = `pessoa-${s.as || 'signatario'}-${(s.date || '').slice(0, 7)}`;
      items.push(`        <TLCPerson eId="${id(pid)}" href="/akn/ontology/person/pt/${id(pid)}" showAs="${escapeXml(s.name || s.title || displayName(s.as))}"/>`);
    });

    return `      <references source="#dapl">
${items.join('\n')}
      </references>`;
  }

  function displayName(eid) {
    const names = {
      'governo': 'Governo da República Portuguesa',
      'cm': 'Conselho de Ministros',
      'ar': 'Assembleia da República',
      'alra': 'Assembleia Legislativa da RA dos Açores',
      'alrm': 'Assembleia Legislativa da RA da Madeira',
      'gov-regional-acores': 'Governo Regional dos Açores',
      'gov-regional-madeira': 'Governo Regional da Madeira',
      'dre': 'Diário da República',
      'dapl': 'DAPL/SGGOV',
      'primeiro-ministro': 'Primeiro-Ministro',
      'presidente-republica': 'Presidente da República',
      'presidente-ar': 'Presidente da Assembleia da República',
      'presidente-alra': 'Presidente da ALR dos Açores',
      'representante-republica-acores': 'Representante da República para os Açores',
      'representante-republica-madeira': 'Representante da República para a Madeira',
      'presidente-governo-regional-acores': 'Presidente do Governo Regional dos Açores',
      'ministro': 'Ministro competente',
    };
    return names[eid] || eid;
  }

  function buildLifecycle(doc) {
    const events = [];
    let n = 1;
    const isAR = ['lei', 'decreto-ar', 'res-ar'].includes(doc.actName);
    const isDL = doc.actName === 'dec-lei' || doc.actName === 'res-cm';
    const actor = ACTOR_FOR_TYPE[doc.actName] || 'governo';

    if (isDL) events.push({ refers: 'approval-cm', source: 'cm' });
    else if (isAR) events.push({ refers: 'approval-ar', source: 'ar' });

    if (['dec-lei', 'lei', 'decreto-ar', 'dlr'].includes(doc.actName)) {
      events.push({ refers: 'promulgation', source: actor });
    } else {
      events.push({ refers: 'signature', source: actor });
    }
    events.push({ refers: 'publication', source: 'dre' });

    return `      <lifecycle source="#dapl">
${events.map((e, i) => `        <eventRef eId="e${i + 1}" date="${i === 0 ? doc.adoptionDate : doc.publicationDate}" source="#${e.source}" type="generation" refersTo="#${e.refers}"/>`).join('\n')}
      </lifecycle>`;
  }

  function buildWorkflow(doc) {
    if (!doc.workflow || doc.workflow.length === 0) return '';

    // Workflow vive no namespace akn-pt: (ADR-0011); o root <akomaNtoso>
    // declara xmlns:akn-pt em buildAkomaNtosoOpen.
    const steps = doc.workflow.map(step => {
      const desc = step.description ? `
          <akn-pt:description><p>${escapeXml(step.description)}</p></akn-pt:description>` : '';
      const inputs = step.inputs.map(inp => {
        const idesc = inp.description ? `
            <akn-pt:description><p>${escapeXml(inp.description)}</p></akn-pt:description>` : '';
        return `          <akn-pt:input eId="${inp.id}" date="${inp.date}" source="#${id(inp.source) || 'unknown'}" type="${inp.type}">${idesc}
          </akn-pt:input>`;
      }).join('\n');
      return `        <akn-pt:step eId="${step.id}" date="${step.date}" refersTo="#${step.refersTo}" source="#${id(step.source) || 'governo'}">${desc}${inputs ? '\n' + inputs : ''}
        </akn-pt:step>`;
    });

    return `      <akn-pt:workflow source="#dapl">
${steps.join('\n')}
      </akn-pt:workflow>`;
  }

  function buildAnalysis(doc) {
    // Em consolidações, doc._passiveModifications é uma lista de objectos
    // { id, type, sourceUri, eId } produzidos por Amendment.toAknXmlConsolidated.
    // type: 'substitution' | 'repeal' | 'insertion' | 'rectification'.
    const passive = (doc && doc._passiveModifications) || [];
    if (!passive.length) {
      return `      <analysis source="#dapl"><activeModifications/><passiveModifications/></analysis>`;
    }
    // destination usa URI absoluto (o eId vive no Work do diploma TARGET, não
    // no consolidado actual — onde pode até ter sido revogado). Construímos a
    // URI Work do target a partir do doc._consolidatedFrom (Amendment.fromTarget
    // preenche este campo).
    const targetWorkUri = doc._consolidatedFrom || '';
    const items = passive.map((m, i) =>
      `        <textualMod type="${escapeXml(m.type)}" eId="mod_${escapeXml(m.id || String(i + 1))}">
          <source href="${escapeXml(m.sourceUri)}"/>
          <destination href="${escapeXml(targetWorkUri)}#${escapeXml(m.eId)}"/>
        </textualMod>`).join('\n');
    return `      <analysis source="#dapl">
        <activeModifications/>
        <passiveModifications>
${items}
        </passiveModifications>
      </analysis>`;
  }

  function buildMeta(doc) {
    const blocks = [
      buildFrbr(doc),
      buildReferences(doc),
      buildLifecycle(doc),
    ];
    const wf = buildWorkflow(doc);
    if (wf) blocks.push(wf);
    blocks.push(buildAnalysis(doc));
    return `    <meta>\n${blocks.join('\n')}\n    </meta>`;
  }

  function buildPreface(doc) {
    const docType = displayActType(doc.actName);
    const docDateText = doc.docDateText || formatDate(doc.docDate);
    return `    <preface>
      <p class="docTitle"><docType>${escapeXml(docType)}</docType> <docNumber>n.º ${escapeXml(doc.number || 'X')}/${doc.year}${doc.country === 'pt-20' ? '/A' : doc.country === 'pt-30' ? '/M' : ''}</docNumber></p>
      <p class="docDate"><date date="${doc.docDate}">de ${escapeXml(docDateText)}</date></p>
      <shortTitle>${escapeXml(doc.shortTitle || '…')}</shortTitle>
    </preface>`;
  }

  function displayActType(actName) {
    const types = {
      'dec-lei': 'Decreto-Lei',
      'lei': 'Lei',
      'decreto-ar': 'Decreto da Assembleia da República',
      'res-ar': 'Resolução da Assembleia da República',
      'portaria': 'Portaria',
      'res-cm': 'Resolução do Conselho de Ministros',
      'despacho-normativo': 'Despacho normativo',
      'dlr': 'Decreto Legislativo Regional',
      'drr': 'Decreto Regulamentar Regional',
    };
    return types[actName] || actName;
  }

  function formatDate(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    return `${parseInt(d, 10)} de ${months[parseInt(m, 10) - 1]} de ${y}`;
  }

  function buildPreamble(doc) {
    const recitals = [];

    // Habilitante recital — injectado se preenchido (cumpre principio da legalidade
    // para Portaria, Despacho, DRR, DL autorizado, DLR autorizado, Res-AR cessacao)
    if (doc.habilitante) {
      const label = doc.habilitanteLabel || doc.habilitante;
      recitals.push(`      <recital eId="rec_habilitante"><p>Ao abrigo do disposto na <ref href="${escapeXml(doc.habilitante)}">${escapeXml(label)}</ref>.</p></recital>`);
    }

    doc.recitals.forEach(r => {
      recitals.push(`      <recital eId="${r.id}"><p class="formula">${xmlText(r.text, doc)}</p></recital>`);
    });

    const formula = doc.formula ? `
      <formula type="enacting"><p>${xmlText(doc.formula, doc)}</p></formula>` : '';

    if (!recitals.length && !formula) return '';
    return `    <preamble>
${recitals.join('\n')}${formula}
    </preamble>`;
  }

  function buildBody(doc) {
    if (doc.body.kind === 'articles') {
      const articles = doc.body.items.map(a => _buildArticleOrContainer(a, doc, '      ')).join('\n');
      return `    <body>\n${articles}\n    </body>`;
    } else if (doc.body.kind === 'hierarchic') {
      // Body com containers (book/part/title/chapter/section/subsection)
      // mais artigos folha. Cada item de doc.body.items pode ser um
      // Container ou um Article; rendering recursivo via _buildArticleOrContainer.
      const items = doc.body.items.map(it => _buildArticleOrContainer(it, doc, '      ')).join('\n');
      return `    <body>\n${items}\n    </body>`;
    } else {
      const paras = doc.body.items.map(p => buildParagraph(p, null, false, doc)).join('\n');
      return `    <body>\n${paras}\n    </body>`;
    }
  }

  // Container types AKN canónicos que aceitamos no body hierárquico.
  const CONTAINER_TYPES = new Set(['book', 'part', 'title', 'chapter', 'section', 'subsection']);

  // Renderiza um item do body — pode ser um Container (chapter/section/etc.)
  // que contém recursivamente outros Containers ou Articles, ou um Article
  // folha com paragraphs. Container distingue-se por ter `containerType`.
  function _buildArticleOrContainer(item, doc, indent) {
    if (item && CONTAINER_TYPES.has(item.containerType)) {
      const childrenIndent = indent + '  ';
      const children = (item.items || []).map(child =>
        _buildArticleOrContainer(child, doc, childrenIndent)).join('\n');
      const num = item.num ? `\n${indent}  <num>${escapeXml(item.num)}</num>` : '';
      const heading = item.heading ? `\n${indent}  <heading>${xmlText(item.heading, doc)}</heading>` : '';
      return `${indent}<${item.containerType} eId="${item.id}">${num}${heading}
${children}
${indent}</${item.containerType}>`;
    }
    // Article (folha)
    const a = item;
    const paras = (a.paragraphs || []).map(p => buildParagraph(p, a.id, true, doc)).join('\n');
    return `${indent}<article eId="${a.id}">
${indent}  <num>${escapeXml(a.num || '')}</num>
${indent}  <heading>${xmlText(a.heading || '…', doc)}</heading>
${paras}
${indent}</article>`;
  }

  function buildParagraph(p, parentId, isArticle, doc) {
    const indent = isArticle ? '        ' : '      ';
    const numTag = p.num ? `\n${indent}  <num>${escapeXml(p.num)}</num>` : '';
    if (p.subPoints && p.subPoints.length) {
      const intro = p.content ? `\n${indent}  <intro><p>${xmlText(p.content, doc)}</p></intro>` : '';
      const pts = p.subPoints.map(sp => buildPoint(sp, `${indent}    `, doc)).join('\n');
      return `${indent}<paragraph eId="${p.id}">${numTag}${intro}
${indent}  <list>
${pts}
${indent}  </list>
${indent}</paragraph>`;
    }
    return `${indent}<paragraph eId="${p.id}">${numTag}
${indent}  <content><p>${xmlText(p.content, doc)}</p></content>
${indent}</paragraph>`;
  }

  // Recursive point — supports nested subalineas via point.subPoints
  function buildPoint(pt, indent, doc) {
    if (pt.subPoints && pt.subPoints.length) {
      const intro = pt.content
        ? `\n${indent}  <intro><p>${xmlText(pt.content, doc)}</p></intro>`
        : '';
      const nested = pt.subPoints.map(ssp => buildPoint(ssp, `${indent}    `, doc)).join('\n');
      return `${indent}<point eId="${pt.id}">
${indent}  <num>${escapeXml(pt.num)}</num>${intro}
${indent}  <list>
${nested}
${indent}  </list>
${indent}</point>`;
    }
    return `${indent}<point eId="${pt.id}"><num>${escapeXml(pt.num)}</num><content><p>${xmlText(pt.content, doc)}</p></content></point>`;
  }

  function buildConclusions(doc) {
    if (!doc.signatures.length) return '';
    const sigs = doc.signatures.map(s => {
      const pid = `pessoa-${s.as || 'signatario'}-${(s.date || '').slice(0, 7)}`;
      return `      <signature role="${s.role}"><person refersTo="#${id(pid)}" as="#${s.as}"/></signature>`;
    }).join('\n');
    return `    <conclusions>
      <formula type="conclusion"><p>Visto e aprovado.</p></formula>
${sigs}
    </conclusions>`;
  }

  function buildAttachments(doc) {
    if (!doc.attachments.length) return '';
    const att = doc.attachments.map(a => `      <attachment eId="${a.id}">
        <heading>${escapeXml(a.heading)}</heading>${a.subheading ? `\n        <subheading>${escapeXml(a.subheading)}</subheading>` : ''}
        <mainBody>
          <p>${xmlText(a.content || '…', doc)}</p>
        </mainBody>
      </attachment>`).join('\n');
    return `    <attachments>\n${att}\n    </attachments>`;
  }

  function toXml(doc) {
    const parts = [
      buildMeta(doc),
      buildPreface(doc),
      buildPreamble(doc),
      buildBody(doc),
      buildConclusions(doc),
      buildAttachments(doc),
    ].filter(Boolean);

    // xmlns:akn-pt: declarado sempre, mesmo sem workflow — não tem custo
    // semântico em XML e simplifica round-trips de import/export.
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated by AKN-PT Editor v0.1.0 (demo) -->
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0/CSD17"
            xmlns:akn-pt="http://eli.gov.pt/ns/akn-pt/1.0">
  <act name="${doc.actName}">
${parts.join('\n')}
  </act>
</akomaNtoso>
`;
    // Opcionalmente injectar comentários como <note class="review">
    if (doc._exportWithComments && Array.isArray(doc.comments) && doc.comments.length) {
      xml = _injectComments(xml, doc);
    }
    return xml;
  }

  // Injecta comentários como `<authorialNote>` (inline AKN-PT) ancorados ao
  // elemento com o eId correspondente. `<authorialNote>` é elemento INLINE —
  // tem de estar dentro de um `<p>`. Por isso a estratégia é:
  //   1. Encontrar o eId alvo (artigo/parágrafo/ponto)
  //   2. Inserir a nota logo antes do `</p>` final desse elemento
  //   3. Se o elemento alvo é um <article> sem <p> directo, ancorar ao
  //      primeiro <paragraph>/<content><p> dentro dele
  // Formato: <authorialNote marker="✎" eId="note_…">texto</authorialNote>
  function _injectComments(xml, doc) {
    const open = doc.comments.filter(c => !c.resolved);
    open.forEach(c => {
      const noteId = `note_${c.id}`;
      const author = c.author ? ` [${c.author}]` : '';
      const note = `<authorialNote marker="✎" eId="${noteId}">${escapeXml(c.text + author)}</authorialNote>`;
      const idx = xml.indexOf(`eId="${c.eId}"`);
      if (idx < 0) return;
      // Encontrar o tag de abertura desse elemento
      const tagOpenIdx = xml.lastIndexOf('<', idx);
      const tagMatch = xml.slice(tagOpenIdx, idx).match(/<([a-zA-Z]+)/);
      if (!tagMatch) return;
      const tagName = tagMatch[1];
      const closeTag = `</${tagName}>`;
      // Encontrar o fecho balanceado deste elemento
      let depth = 1, scan = idx;
      while (depth > 0 && scan < xml.length) {
        const nextOpen = xml.indexOf(`<${tagName}`, scan + 1);
        const nextClose = xml.indexOf(closeTag, scan + 1);
        if (nextClose < 0) return;
        if (nextOpen > -1 && nextOpen < nextClose) { depth++; scan = nextOpen; }
        else { depth--; scan = nextClose; }
      }
      const elementEnd = scan;
      // Procurar o ÚLTIMO `</p>` dentro deste elemento
      const lastPClose = xml.lastIndexOf('</p>', elementEnd);
      if (lastPClose < tagOpenIdx) return;
      xml = xml.slice(0, lastPClose) + note + xml.slice(lastPClose);
    });
    return xml;
  }

  function download(doc) {
    const xml = toXml(doc);
    const filename = `${doc.actName}-${doc.number || 'X'}-${doc.year}.akn.xml`;
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return { toXml, download };
})();

if (typeof window !== "undefined") window.AknExport = AknExport;
