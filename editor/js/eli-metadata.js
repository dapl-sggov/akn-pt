// AKN-PT Editor — emissão de metadados ELI (JSON-LD + RDFa)
// EUPL-1.2
//
// Gera os metadados machine-readable ELI (European Legislation Identifier)
// a partir do doc state, na ontologia ELI v1.5 (http://data.europa.eu/eli/ontology).
//
// Porquê: a pesquisa de 2026-06-22 confirmou que Portugal É implementador ELI
// registado (operado pela INCM em data.dre.pt) mas o portal OutSystems deixou
// de servir RDFa/JSON-LD. Este módulo produz exactamente a marcação que falta,
// como activo de demonstração para a reunião INCM e como base de alinhamento.
//
// Duas formas de URI são suportadas (ver eli-pt/research/eli-pt-gap-analysis.md):
//   - scheme 'dre'      (CANÓNICO — produção INCM): /eli/{type}/{number}/{year}/{mm}/{dd}/p/dre/pt
//   - scheme 'proposed' (forma DAPL anterior, evolução a propor): /eli/{jur}/{type}/{year}/{number}/pt
//
// Sem dependências de DOM no núcleo — corre em Node (smoke test) e no browser.

const EliMetadata = (() => {
  const PLACEHOLDER_DOMAIN = 'https://eli.gov.pt';   // ADR-0009 placeholder
  const INCM_DOMAIN = 'https://data.dre.pt';          // domínio de produção INCM
  // Tabelas de autoridade da INCM. O segmento /eli/ é obrigatório (ver
  // eli-pt/incm-eli-reference.md §5) e NÃO acompanha opts.domain/scheme: mesmo
  // na forma 'proposed', as autoridades são sempre as da INCM.
  const AUTH = `${INCM_DOMAIN}/eli/authority`;
  const ELI_ONTOLOGY = 'http://data.europa.eu/eli/ontology#';
  const LANG_AUTHORITY = 'http://publications.europa.eu/resource/authority/language/';
  const FILETYPE_AUTHORITY = 'http://publications.europa.eu/resource/authority/file-type/';

  const TYPE_LABEL = {
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

  // FRBRauthor (passed_by) por tipo de acto.
  const AUTHOR = {
    'dec-lei': { slug: 'governo', label: 'Governo da República Portuguesa' },
    'lei': { slug: 'assembleia-republica', label: 'Assembleia da República' },
    'decreto-ar': { slug: 'assembleia-republica', label: 'Assembleia da República' },
    'res-ar': { slug: 'assembleia-republica', label: 'Assembleia da República' },
    'portaria': { slug: 'governo', label: 'Governo da República Portuguesa' },
    'res-cm': { slug: 'conselho-ministros', label: 'Conselho de Ministros' },
    'despacho-normativo': { slug: 'governo', label: 'Governo da República Portuguesa' },
    'dlr': { slug: 'alr-acores', label: 'Assembleia Legislativa da Região Autónoma' },
    'drr': { slug: 'governo-regional', label: 'Governo Regional' },
  };

  // AKN-PT <act name> → slug ELI REAL da INCM (ver eli-pt/incm-eli-reference.md).
  const ELI_SLUG = {
    'dec-lei': 'dec-lei', 'lei': 'lei', 'portaria': 'port', 'res-cm': 'resolconsmin',
    'res-ar': 'resolassrep', 'despacho-normativo': 'despnorm', 'dlr': 'declegreg',
    'drr': 'decregulreg', 'decreto-ar': 'dec',
  };
  function _slug(doc) { return ELI_SLUG[doc.actName] || doc.actName; }
  // Marcador de território INCM (slot do 'p'): pt→p, pt-20 (Açores)→a, pt-30 (Madeira)→m.
  function _terr(doc) { return doc.country === 'pt-20' ? 'a' : doc.country === 'pt-30' ? 'm' : 'p'; }

  function _jur(doc) { return doc.country || 'pt'; }
  // Identificador local tal como a INCM o apresenta: n.º/ano, com sufixo
  // regional /A (Açores) ou /M (Madeira). Partilhado por JSON-LD e RDFa.
  function _idLocal(doc) {
    const suffix = doc.country === 'pt-20' ? '/A' : doc.country === 'pt-30' ? '/M' : '';
    return `${doc.number || 'X'}/${doc.year}${suffix}`;
  }
  function _num(doc) { return doc.number || 'X'; }
  function _numUri(doc) { return String(_num(doc)).toLowerCase(); }
  function _isConsolidated(doc) {
    return !!(doc._consolidatedAt && doc._consolidatedAt !== '9999-12-31');
  }
  // Data que entra no path do URI Work. O modelo da INCM exige a data de
  // PUBLICAÇÃO; a cadeia de recurso existe só para rascunhos ainda não
  // publicados (o validation.js avisa quando a data de publicação falta, para
  // que um URI provisório não passe por canónico). Zero-padding obrigatório.
  function _pad2(v) { return String(v == null ? '' : v).padStart(2, '0'); }
  function _ymd(doc) {
    const iso = doc.publicationDate || doc.adoptionDate || `${doc.year}-01-01`;
    const [y, m, d] = String(iso).split('-');
    return {
      y: y || String(doc.year),
      m: _pad2(m || '01'),
      d: _pad2(d || '01'),
      provisoria: !doc.publicationDate,
    };
  }

  // ----- URIs -------------------------------------------------------------
  //
  // Esquema CANÓNICO = 'dre' (template REAL de produção da INCM, data.dre.pt;
  // ver eli-pt/incm-eli-reference.md):
  //   Work publicada:    /eli/{slug}/{nº}/{ano}/{mês}/{dia}/{p|a|m}/dre
  //   Work consolidada:  /eli/{slug}/{nº}/{ano}/{p|a|m}/cons/{AAAAMMDD}
  //   Expression:        Work + /pt ; Manifestation: + /{xml|html|pdf} (SEGMENTO)
  // Esquema 'proposed' = forma anterior da DAPL (eli.gov.pt, ano+número,
  // jurisdição-first), mantida só para comparação/registo (evolução a propor).

  function workUri(doc, opts = {}) {
    const scheme = opts.scheme || 'dre';
    if (scheme === 'proposed') {
      const domain = opts.domain || PLACEHOLDER_DOMAIN;
      return `${domain}/eli/${_jur(doc)}/${doc.actName}/${doc.year}/${_num(doc)}/pt`;
    }
    // Canónico (INCM): Work publicada = /eli/{slug}/{nº}/{ano}/{mês}/{dia}/{terr}/dre;
    // Work consolidada = /eli/{slug}/{nº}/{ano}/{terr}/cons/{AAAAMMDD} (só ano).
    const domain = opts.domain || INCM_DOMAIN;
    const { y, m, d } = _ymd(doc);
    // {ano} é o ano de NUMERAÇÃO do acto (o par nº/ano que o identifica), não o
    // ano da data usada em {mês}/{dia}. Numa consolidação, publicationDate pode
    // já ser a do diploma alterador — usar o ano dela produziria um Work errado.
    const ano = String(doc.year || y);
    if (_isConsolidated(doc)) {
      const compact = doc._consolidatedAt.replace(/-/g, '');
      return `${domain}/eli/${_slug(doc)}/${_numUri(doc)}/${ano}/${_terr(doc)}/cons/${compact}`;
    }
    return `${domain}/eli/${_slug(doc)}/${_numUri(doc)}/${ano}/${m}/${d}/${_terr(doc)}/dre`;
  }

  function expressionUri(doc, opts = {}) {
    const base = workUri(doc, opts);
    if ((opts.scheme || 'dre') === 'proposed') {
      return _isConsolidated(doc) ? `${base}/${doc._consolidatedAt}` : base;
    }
    // Canónico: Expression = Work + /{lang}
    return `${base}/pt`;
  }

  function manifestationUri(doc, opts = {}, fmt = 'xml') {
    const expr = expressionUri(doc, opts);
    // Canónico: formato como SEGMENTO (/xml). 'proposed': extensão (.xml).
    if ((opts.scheme || 'dre') === 'proposed') return `${expr}.${fmt}`;
    return `${expr}/${fmt}`;
  }

  // Comparação das duas formas — para a UI e a reunião INCM.
  function uriComparison(doc) {
    return {
      canonical: {
        scheme: 'data.dre.pt (INCM — produção, canónico)',
        work: workUri(doc, { scheme: 'dre' }),
        expression: expressionUri(doc, { scheme: 'dre' }),
        manifestation: manifestationUri(doc, { scheme: 'dre' }, 'xml'),
      },
      proposed: {
        scheme: 'eli.gov.pt (forma DAPL anterior — evolução a propor)',
        work: workUri(doc, { scheme: 'proposed' }),
        expression: expressionUri(doc, { scheme: 'proposed' }),
        manifestation: manifestationUri(doc, { scheme: 'proposed' }, 'xml'),
      },
    };
  }

  // ----- JSON-LD ----------------------------------------------------------

  function buildJsonLd(doc, opts = {}) {
    const work = workUri(doc, opts);
    const expr = expressionUri(doc, opts);
    const author = AUTHOR[doc.actName] || AUTHOR['dec-lei'];
    const title = doc.shortTitle
      || `${TYPE_LABEL[doc.actName] || doc.actName} n.º ${_num(doc)}/${doc.year}`;

    const expression = {
      '@id': expr,
      '@type': 'eli:LegalExpression',
      'eli:language': { '@id': `${LANG_AUTHORITY}PRT` },
      'eli:title': { '@value': title, '@language': 'pt' },
      'eli:is_embodied_by': [
        { '@id': manifestationUri(doc, opts, 'xml'), '@type': 'eli:Format',
          'eli:format': { '@id': `${FILETYPE_AUTHORITY}XML` } },
        { '@id': manifestationUri(doc, opts, 'html'), '@type': 'eli:Format',
          'eli:format': { '@id': `${FILETYPE_AUTHORITY}HTML` } },
      ],
    };
    if (doc.publicationDate) {
      expression['eli:date_publication'] = { '@value': doc.publicationDate, '@type': 'xsd:date' };
    }
    if (_isConsolidated(doc)) {
      expression['eli:version'] = { '@value': String(doc._consolidationVersion || 2), '@type': 'xsd:positiveInteger' };
      // consolidates → Expression ORIGINAL publicada (não a consolidada). Usa a
      // data de publicação do acto originário, preservada pelo Amendment.
      const pubDoc = Object.assign({}, doc, {
        _consolidatedAt: null,
        publicationDate: doc._originalPublicationDate || doc.publicationDate,
      });
      expression['eli:consolidates'] = { '@id': expressionUri(pubDoc, opts) };
    }

    const obj = {
      '@context': {
        eli: ELI_ONTOLOGY,
        skos: 'http://www.w3.org/2004/02/skos/core#',
        xsd: 'http://www.w3.org/2001/XMLSchema#',
      },
      '@id': work,
      '@type': 'eli:LegalResource',
      'eli:id_local': _idLocal(doc),
      'eli:type_document': {
        '@id': `${AUTH}/resource-type/${_slug(doc)}`,
        'skos:prefLabel': { '@value': TYPE_LABEL[doc.actName] || doc.actName, '@language': 'pt' },
      },
      'eli:passed_by': {
        '@id': `${AUTH}/corporate-body/${author.slug}`,
        'skos:prefLabel': { '@value': author.label, '@language': 'pt' },
      },
      'eli:title': { '@value': title, '@language': 'pt' },
      // Constantes alinhadas com os metadados ELI da INCM (paridade com data.dre.pt).
      'eli:uri_schema': { '@id': 'https://dre.pt/identificador-europeu-legislacao' },
      'eli:publisher': { '@value': 'INCM' },
      'eli:publisher_agent': { '@id': `${AUTH}/legal-institution/incm` },
      'eli:rightsholder_agent': { '@id': `${AUTH}/legal-institution/incm` },
      'eli:legal_value': { '@id': `${ELI_ONTOLOGY}LegalValue-unofficial` },
      'eli:is_realized_by': expression,
    };
    if (doc.adoptionDate) {
      obj['eli:date_document'] = { '@value': doc.adoptionDate, '@type': 'xsd:date' };
    }
    if (doc.entryIntoForceDate) {
      obj['eli:first_date_entry_in_force'] = { '@value': doc.entryIntoForceDate, '@type': 'xsd:date' };
    }
    // Relação habilitante → based_on (INCM); transposição de directiva → transposes.
    if (doc.habilitante) {
      obj['eli:based_on'] = { '@id': doc.habilitante };
    }
    // Assuntos (descritores nacionais INCM) → eli:is_about, com os URIs
    // canónicos data.dre.pt/eli/authority/legal-subject/{código}.
    if (Array.isArray(doc.subjects) && doc.subjects.length) {
      // Emite o descritor nacional (INCM) e, quando há crosswalk, também o
      // conceito EuroVoc correspondente — ponte para a interoperabilidade UE.
      obj['eli:is_about'] = doc.subjects.flatMap((s) => {
        const code = typeof s === 'string' ? s : s.code;
        const lbl = typeof s === 'object' ? s.label : null;
        const out = [];
        const nat = { '@id': `http://data.dre.pt/eli/authority/legal-subject/${code}` };
        if (lbl) nat['skos:prefLabel'] = { '@value': lbl, '@language': 'pt' };
        out.push(nat);
        if (typeof s === 'object' && s.eurovoc) {
          const eu = { '@id': s.eurovoc };
          if (s.euLabel) eu['skos:prefLabel'] = { '@value': s.euLabel, '@language': 'pt' };
          out.push(eu);
        }
        return out;
      });
    }
    if (doc.subtype === 'dec-lei-transposicao' && doc.transposesUri) {
      obj['eli:transposes'] = { '@id': doc.transposesUri };
    }
    return obj;
  }

  function toJsonLdString(doc, opts = {}) {
    return JSON.stringify(buildJsonLd(doc, opts), null, 2);
  }

  function toScriptTag(doc, opts = {}) {
    return `<script type="application/ld+json">\n${toJsonLdString(doc, opts)}\n</script>`;
  }

  // ----- RDFa (forma alternativa, dominante na maioria dos países) --------
  // Devolve um bloco HTML com atributos RDFa ELI — para comparação visual.
  function toRdfa(doc, opts = {}) {
    const work = workUri(doc, opts);
    const expr = expressionUri(doc, opts);
    const author = AUTHOR[doc.actName] || AUTHOR['dec-lei'];
    const title = doc.shortTitle
      || `${TYPE_LABEL[doc.actName] || doc.actName} n.º ${_num(doc)}/${doc.year}`;
    const esc = (s) => String(s == null ? '' : s)
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
    const rows = [];
    // Prefixos: xsd é usado nos datatype= das datas, skos nos rótulos.
    rows.push(`<div prefix="eli: ${ELI_ONTOLOGY} xsd: http://www.w3.org/2001/XMLSchema# skos: http://www.w3.org/2004/02/skos/core#" about="${esc(work)}" typeof="eli:LegalResource">`);
    rows.push(`  <span property="eli:id_local" content="${esc(_idLocal(doc))}"></span>`);
    rows.push(`  <span property="eli:type_document" resource="${AUTH}/resource-type/${esc(_slug(doc))}"></span>`);
    rows.push(`  <span property="eli:title" lang="pt">${esc(title)}</span>`);
    if (doc.adoptionDate) rows.push(`  <span property="eli:date_document" content="${esc(doc.adoptionDate)}" datatype="xsd:date"></span>`);
    if (doc.entryIntoForceDate) rows.push(`  <span property="eli:first_date_entry_in_force" content="${esc(doc.entryIntoForceDate)}" datatype="xsd:date"></span>`);
    rows.push(`  <span property="eli:passed_by" resource="${AUTH}/corporate-body/${esc(author.slug)}">${esc(author.label)}</span>`);
    // Paridade com a INCM (as mesmas constantes emitidas no JSON-LD).
    rows.push(`  <span property="eli:uri_schema" resource="https://dre.pt/identificador-europeu-legislacao"></span>`);
    rows.push(`  <span property="eli:publisher" content="INCM"></span>`);
    rows.push(`  <span property="eli:publisher_agent" resource="${AUTH}/legal-institution/incm"></span>`);
    rows.push(`  <span property="eli:rightsholder_agent" resource="${AUTH}/legal-institution/incm"></span>`);
    rows.push(`  <span property="eli:legal_value" resource="${ELI_ONTOLOGY}LegalValue-unofficial"></span>`);
    if (doc.habilitante) rows.push(`  <span property="eli:based_on" resource="${esc(doc.habilitante)}"></span>`);
    if (doc.transposesUri) rows.push(`  <span property="eli:transposes" resource="${esc(doc.transposesUri)}"></span>`);
    if (Array.isArray(doc.subjects)) {
      for (const s of doc.subjects) {
        const code = typeof s === 'string' ? s : s && s.code;
        if (code) rows.push(`  <span property="eli:is_about" resource="http://data.dre.pt/eli/authority/legal-subject/${esc(code)}"></span>`);
        if (typeof s === 'object' && s && s.eurovoc) rows.push(`  <span property="eli:is_about" resource="${esc(s.eurovoc)}"></span>`);
      }
    }
    rows.push(`  <div property="eli:is_realized_by" resource="${esc(expr)}" typeof="eli:LegalExpression">`);
    rows.push(`    <span property="eli:language" resource="${LANG_AUTHORITY}PRT"></span>`);
    rows.push(`    <span property="eli:title" lang="pt">${esc(title)}</span>`);
    if (doc.publicationDate) rows.push(`    <span property="eli:date_publication" content="${esc(doc.publicationDate)}" datatype="xsd:date"></span>`);
    if (_isConsolidated(doc)) {
      rows.push(`    <span property="eli:version" content="${esc(String(doc._consolidationVersion || 2))}" datatype="xsd:positiveInteger"></span>`);
      const pubDoc = Object.assign({}, doc, { _consolidatedAt: null });
      rows.push(`    <span property="eli:consolidates" resource="${esc(expressionUri(pubDoc, opts))}"></span>`);
    }
    for (const [fmt, key] of [['xml', 'XML'], ['html', 'HTML']]) {
      rows.push(`    <div property="eli:is_embodied_by" resource="${esc(manifestationUri(doc, opts, fmt))}" typeof="eli:Format">`);
      rows.push(`      <span property="eli:format" resource="${FILETYPE_AUTHORITY}${key}"></span>`);
      rows.push(`    </div>`);
    }
    rows.push(`  </div>`);
    rows.push(`</div>`);
    return rows.join('\n');
  }

  return {
    workUri, expressionUri, manifestationUri, uriComparison,
    buildJsonLd, toJsonLdString, toScriptTag, toRdfa,
    PLACEHOLDER_DOMAIN, INCM_DOMAIN,
  };
})();

if (typeof window !== 'undefined') window.EliMetadata = EliMetadata;
if (typeof globalThis !== 'undefined') globalThis.EliMetadata = EliMetadata;
