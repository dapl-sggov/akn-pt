// AKN-PT Editor — Client-side basic validation
// EUPL-1.2
// Note: Full validation requires the akn-pt CLI (XSD + Schematron).
// This module catches the most common errors live as the user types.

const Validation = (() => {

  function check(doc) {
    const issues = [];

    // Metadata
    if (!doc.number || !String(doc.number).trim()) {
      issues.push({ level: 'error', msg: 'Número do diploma em falta.' });
    }
    if (!doc.shortTitle || doc.shortTitle.trim().length < 10) {
      issues.push({ level: 'error', msg: 'Ementa (short title) em falta ou muito curta.' });
    }
    if (!doc.adoptionDate) {
      issues.push({ level: 'error', msg: 'Data de aprovação em falta.' });
    }
    if (!doc.publicationDate) {
      issues.push({ level: 'error', msg: 'Data de publicação em falta.' });
    }
    if (doc.publicationDate && doc.adoptionDate && doc.publicationDate < doc.adoptionDate) {
      issues.push({ level: 'error', msg: 'Data de publicação anterior à data de adopção.' });
    }

    // Formula required for most types
    const noFormulaTypes = ['res-cm'];
    if (!noFormulaTypes.includes(doc.actName) && !doc.formula) {
      issues.push({ level: 'warn', msg: 'Fórmula promulgatória/dispositiva em falta.' });
    }

    // Body must have at least one element
    if (!doc.body.items.length) {
      issues.push({ level: 'error', msg: 'Body sem artigos / pontos resolutivos.' });
    }

    // Articles must have heading; non-empty content. Para body hierárquico,
    // walk recursivo nas folhas (articles dentro de containers).
    const _checkArticle = (a) => {
      if (!a.heading || !a.heading.trim()) {
        issues.push({ level: 'warn', msg: `${a.num} sem epígrafe.`, eId: a.id });
      }
      (a.paragraphs || []).forEach(p => {
        if (!p.content && !(p.subPoints || []).length) {
          issues.push({ level: 'warn', msg: `${a.num} ${p.num || ''} sem conteúdo.`, eId: p.id });
        }
      });
    };
    const _CONTAINERS_VAL = new Set(['book', 'part', 'title', 'chapter', 'section', 'subsection']);
    const _walkItems = (items) => {
      (items || []).forEach(it => {
        if (it && _CONTAINERS_VAL.has(it.containerType)) {
          _walkItems(it.items);
        } else {
          _checkArticle(it);
        }
      });
    };
    if (doc.body.kind === 'articles') {
      doc.body.items.forEach(_checkArticle);
    } else if (doc.body.kind === 'hierarchic') {
      _walkItems(doc.body.items);
    } else {
      doc.body.items.forEach(p => {
        if (!p.content && !p.subPoints.length) {
          issues.push({ level: 'warn', msg: `Ponto ${p.num} sem conteúdo.`, eId: p.id });
        }
      });
    }

    // Signatures by type
    if (doc.actName === 'dec-lei') {
      const hasProm = doc.signatures.some(s => s.role === 'promulgation');
      const hasCS = doc.signatures.some(s => s.role === 'countersignature');
      if (!hasProm) issues.push({ level: 'error', msg: 'DL: falta signature role="promulgation" (PR).' });
      if (!hasCS) issues.push({ level: 'error', msg: 'DL: falta signature role="countersignature" (PM).' });
    } else if (doc.actName === 'lei') {
      const hasProm = doc.signatures.some(s => s.role === 'promulgation');
      if (!hasProm) issues.push({ level: 'error', msg: 'Lei: falta signature role="promulgation" (PR).' });
    } else if (doc.actName === 'res-cm') {
      const onlyPM = doc.signatures.length === 1
                     && doc.signatures[0].role === 'signature'
                     && doc.signatures[0].as === 'primeiro-ministro';
      if (!onlyPM) issues.push({ level: 'warn', msg: 'RCM: única signature deve ser do PM (role="signature", as="primeiro-ministro").' });
    } else if (doc.actName === 'portaria') {
      const noProm = !doc.signatures.some(s => s.role === 'promulgation');
      if (!noProm) issues.push({ level: 'error', msg: 'Portaria: não deve ter signature role="promulgation".' });
    }

    // RCM/Res-AR don't use <article>
    if (['res-cm', 'res-ar'].includes(doc.actName) && doc.body.kind === 'articles') {
      issues.push({ level: 'error', msg: `${doc.actName.toUpperCase()}: body deve usar <paragraph>, não <article>.` });
    }

    // Pegada legislativa — check if required
    const pubDate = doc.publicationDate;
    const cutoff = '2026-07-27';
    if (pubDate && pubDate >= cutoff) {
      if (!doc.workflow || doc.workflow.length === 0) {
        issues.push({ level: 'error', msg: `Pegada legislativa: actos publicados a partir de ${cutoff} devem ter <workflow>.` });
      } else {
        const refersTo = doc.workflow.map(s => s.refersTo);
        if (!refersTo.includes('iniciativa')) {
          issues.push({ level: 'error', msg: 'Pegada: falta step "iniciativa".' });
        }
        if (!refersTo.some(r => ['aprovacao-cm', 'aprovacao-ar', 'assinatura'].includes(r))) {
          issues.push({ level: 'error', msg: 'Pegada: falta step de aprovação (aprovacao-cm, aprovacao-ar ou assinatura).' });
        }
        if (!refersTo.includes('publicacao')) {
          issues.push({ level: 'error', msg: 'Pegada: falta step "publicacao".' });
        }
      }
    }

    // EId uniqueness
    const ids = collectEids(doc);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dupes.length) {
      issues.push({ level: 'error', msg: `eIds duplicados: ${[...new Set(dupes)].join(', ')}.` });
    }

    // (STR-0010) Coerência eId ↔ número apresentado — o nº no eId (art_N, __para_M)
    // deve corresponder ao número visível. (A coerência das URIs FRBR é garantida
    // por construção no buildFrbr, logo não há nada a verificar do estado.)
    const numIssues = [];
    // Normalização que inclui o SUFIXO ALFABÉTICO: "Artigo 5.º-A" → "5a" e
    // "art_5_a" → "5a". Sem isto, um artigo 5.º-A com eId art_5 passava.
    const _normNum = (s) => String(s || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/^\s*artigo\s*/, '')
      .replace(/[º°.\s)\-_]/g, '');
    const _normEid = (id, re) => {
      const m = String(id || '').match(re);
      return m ? m[1].replace(/[-_]/g, '') : null;
    };
    // IMPORTANTE: os eId são POSICIONAIS por desenho (art_3 é o 3.º artigo do
    // ficheiro, mesmo que se apresente como "Artigo 5.º"). Comparar o valor
    // numérico gerava erros em documentos válidos e colidia com o renumerador.
    // Só se compara quando o eId TRAZ sufixo alfabético — aí a letra tem mesmo
    // de coincidir com a do número apresentado (art_5_a ↔ "Artigo 5.º-A").
    eachArticle(doc, (a) => {
      const eArt = _normEid(a.id, /^art_(\d+[-_][a-z])/i);
      const nArt = _normNum(a.num);
      if (eArt && nArt && eArt !== nArt) numIssues.push(`${a.id} ↔ "${a.num}"`);
      (a.paragraphs || []).forEach((p) => {
        const eP = _normEid(p.id, /__para_(\d+[-_][a-z])/i);
        const nP = _normNum(p.num);
        if (eP && nP && eP !== nP) numIssues.push(`${p.id} ↔ "${p.num}"`);
        // Alíneas/subpontos: __lit_x contra "x)".
        (p.subPoints || []).forEach((sp) => {
          const eL = _normEid(sp.id, /__lit_([a-z0-9]+)/i);
          const nL = _normNum(sp.num);
          if (eL && nL && eL.toLowerCase() !== nL) numIssues.push(`${sp.id} ↔ "${sp.num}"`);
        });
      });
    });
    if (numIssues.length) {
      issues.push({ level: 'error', msg: `eId não corresponde ao número: ${numIssues.slice(0, 5).join('; ')}.` });
    }

    // ----- Invariantes ELI (alinhamento com o modelo da INCM) --------------
    // Estas regras protegem a identidade do acto: tudo o que entra no URI ELI
    // (tipo, número, ano, data de publicação, território) tem de ser coerente,
    // sob pena de se emitir um identificador com aparência canónica e conteúdo
    // errado. Ver eli-pt/incm-eli-reference.md e ADR-0012.
    // Fonte única do vocabulário de slugs: eli-metadata.js. O mapa duplicado
    // contrariava a regra que o próprio projecto impôs no Lote 2.
    const _slugConhecido = (n) => (typeof EliMetadata !== 'undefined' && EliMetadata.hasSlug)
      ? EliMetadata.hasSlug(n)
      : ['dec-lei', 'lei', 'portaria', 'res-cm', 'res-ar', 'despacho-normativo', 'dlr', 'drr', 'decreto-ar'].includes(n);
    const REGIONAIS = new Set(['dlr', 'drr']);
    const PAISES = new Set(['pt', 'pt-20', 'pt-30']);
    const EXIGEM_HABILITANTE = new Set(['portaria', 'despacho-normativo', 'drr']);
    const SUBTIPOS_EXIGEM_HABILITANTE = new Set(['dec-lei-autorizado', 'dec-lei-transposicao', 'dlr-autorizado']);

    if (doc.subtype === 'lei-organica') {
      issues.push({ level: 'warn', msg: 'Lei Orgânica: o vocabulário da INCM usa o slug "leiorg"; confirme o URI antes de exportar.' });
    }
    if (doc.actName && !_slugConhecido(doc.actName)) {
      issues.push({ level: 'warn', msg: `Tipo "${doc.actName}" não consta do vocabulário de slugs ELI da INCM — o URI usará o nome do acto.` });
    }
    if (doc.country && !PAISES.has(doc.country)) {
      issues.push({ level: 'error', msg: `FRBRcountry "${doc.country}" inválido (esperado pt, pt-20 ou pt-30).` });
    }
    if (REGIONAIS.has(doc.actName) && doc.country !== 'pt-20' && doc.country !== 'pt-30') {
      issues.push({ level: 'error', msg: 'Acto regional (DLR/DRR) exige FRBRcountry pt-20 (Açores) ou pt-30 (Madeira) — o URI ficaria com o território /p.' });
    }
    if (!REGIONAIS.has(doc.actName) && (doc.country === 'pt-20' || doc.country === 'pt-30')) {
      issues.push({ level: 'error', msg: `Acto nacional com FRBRcountry "${doc.country}" — o território regional só se aplica a DLR/DRR.` });
    }
    if (doc.number && !/^\d+(-[A-Za-z])?$/.test(String(doc.number).trim())) {
      issues.push({ level: 'warn', msg: `Número "${doc.number}" fora da forma habitual (N ou N-L) — confirme o segmento do URI ELI.` });
    }
    [['adoptionDate', 'aprovação'], ['publicationDate', 'publicação']].forEach(([k, label]) => {
      if (doc[k] && !/^\d{4}-\d{2}-\d{2}$/.test(String(doc[k]))) {
        issues.push({ level: 'error', msg: `Data de ${label} fora do formato ISO (AAAA-MM-DD).` });
      }
    });
    if (!/^\d{4}$/.test(String(doc.year || ''))) {
      issues.push({ level: 'error', msg: 'Ano do diploma em falta ou inválido (AAAA) — é o segmento {ano} do URI ELI.' });
    }
    if (doc._consolidatedAt && doc._consolidatedAt !== '9999-12-31'
        && !/^\d{4}-\d{2}-\d{2}$/.test(String(doc._consolidatedAt))) {
      issues.push({ level: 'error', msg: 'Data de consolidação inválida — entra no URI como /cons/{AAAAMMDD}.' });
    }
    (doc._importWarnings || []).forEach((w) => issues.push({ level: 'warn', msg: 'Importação: ' + w }));
    if (doc._publicationDateInferida) {
      issues.push({ level: 'warn', msg: 'Data de publicação inferida na importação — o URI ELI é provisório até ser confirmada.' });
    }
    if (doc.year && /^\d{4}/.test(String(doc.publicationDate || ''))) {
      const anoPub = parseInt(String(doc.publicationDate).slice(0, 4), 10);
      if (anoPub !== Number(doc.year)) {
        issues.push({ level: 'warn', msg: `Ano do diploma (${doc.year}) difere do ano da publicação (${anoPub}) — o URI usa o ano do diploma; confirme.` });
      }
    }
    if ((EXIGEM_HABILITANTE.has(doc.actName) || SUBTIPOS_EXIGEM_HABILITANTE.has(doc.subtype)) && !doc.habilitante) {
      issues.push({ level: 'error', msg: 'Diploma regulamentar sem lei habilitante (eli:based_on) — exigido pelo princípio da legalidade.' });
    }
    if (doc.habilitante && !/^https?:\/\/data\.dre\.pt\/eli\//.test(String(doc.habilitante))) {
      issues.push({ level: 'warn', msg: 'Lei habilitante fora da forma canónica data.dre.pt/eli/… — o eli:based_on não ligará ao grafo da INCM.' });
    }
    if (doc.subtype === 'dec-lei-transposicao' && !doc.transposesUri) {
      issues.push({ level: 'error', msg: 'Subtipo de transposição sem URI da directiva (eli:transposes).' });
    }
    if (doc.transposesUri && !/^https?:\/\/data\.europa\.eu\/eli\//.test(String(doc.transposesUri))) {
      issues.push({ level: 'warn', msg: 'URI da directiva fora da forma ELI europeia (data.europa.eu/eli/…).' });
    }
    if (Array.isArray(doc.subjects) && doc.subjects.some(s => !(typeof s === 'string' ? s : s && s.code))) {
      issues.push({ level: 'warn', msg: 'Há assuntos sem código de descritor da INCM — esses não entram no eli:is_about.' });
    }

    return issues;
  }

  // Percorre os articles (body articles + hierárquico), ignorando containers e
  // bodies de pontos resolutivos (RCM).
  function eachArticle(doc, fn) {
    const CONT = new Set(['book', 'part', 'title', 'chapter', 'section', 'subsection']);
    const walk = (items) => (items || []).forEach((it) => {
      if (it && CONT.has(it.containerType)) walk(it.items);
      else if (it && it.paragraphs) fn(it);
    });
    if (doc.body.kind === 'hierarchic') walk(doc.body.items);
    else if (doc.body.kind === 'articles') doc.body.items.forEach(fn);
  }

  function collectEids(doc) {
    const ids = [];
    doc.recitals.forEach(r => ids.push(r.id));
    const _CONTAINERS_COLL = new Set(['book', 'part', 'title', 'chapter', 'section', 'subsection']);
    const _collectFromArticle = (a) => {
      ids.push(a.id);
      (a.paragraphs || []).forEach(p => {
        ids.push(p.id);
        (p.subPoints || []).forEach(sp => {
          ids.push(sp.id);
          (sp.subPoints || []).forEach(ssp => ids.push(ssp.id));
        });
      });
    };
    const _collectItems = (items) => {
      (items || []).forEach(it => {
        if (it && _CONTAINERS_COLL.has(it.containerType)) {
          if (it.id) ids.push(it.id);
          _collectItems(it.items);
        } else {
          _collectFromArticle(it);
        }
      });
    };
    if (doc.body.kind === 'hierarchic') {
      _collectItems(doc.body.items);
      doc.attachments.forEach(a => ids.push(a.id));
      return ids;
    }
    if (doc.body.kind === 'articles') {
      doc.body.items.forEach(a => {
        ids.push(a.id);
        a.paragraphs.forEach(p => {
          ids.push(p.id);
          p.subPoints.forEach(sp => ids.push(sp.id));
        });
      });
    } else {
      doc.body.items.forEach(p => {
        ids.push(p.id);
        p.subPoints.forEach(sp => ids.push(sp.id));
      });
    }
    doc.attachments.forEach(a => ids.push(a.id));
    return ids;
  }

  function badge(issues) {
    const errors = issues.filter(i => i.level === 'error').length;
    const warns = issues.filter(i => i.level === 'warn').length;
    if (errors) return { cls: 'badge-error', text: `${errors} erros`, status: 'invalid' };
    if (warns) return { cls: 'badge-warn', text: `${warns} avisos`, status: 'warn' };
    return { cls: 'badge-ok', text: 'OK', status: 'valid' };
  }

  return { check, badge };
})();

if (typeof window !== "undefined") window.Validation = Validation;
