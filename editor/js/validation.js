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

    // Articles must have heading; non-empty content
    if (doc.body.kind === 'articles') {
      doc.body.items.forEach(a => {
        if (!a.heading || !a.heading.trim()) {
          issues.push({ level: 'warn', msg: `${a.num} sem epígrafe.` });
        }
        a.paragraphs.forEach(p => {
          if (!p.content && !p.subPoints.length) {
            issues.push({ level: 'warn', msg: `${a.num} ${p.num || ''} sem conteúdo.` });
          }
        });
      });
    } else {
      doc.body.items.forEach(p => {
        if (!p.content && !p.subPoints.length) {
          issues.push({ level: 'warn', msg: `Ponto ${p.num} sem conteúdo.` });
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

    return issues;
  }

  function collectEids(doc) {
    const ids = [];
    doc.recitals.forEach(r => ids.push(r.id));
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
