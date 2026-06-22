// AKN-PT Editor — Suggestions accept/reject (LEOS-style)
// EUPL-1.2
//
// Sugestões são propostas de alteração textual a uma RANGE específica dentro
// de um campo de texto (paragraph.content, recital.text, article.heading,
// subPoint.content, ...). Conceptualmente diferente de:
//
//   - COMENTÁRIO: discussão livre ancorada a um eId, não muta o documento.
//   - AMENDMENT (wholesale): substitui artigo/n.º inteiro, próprio do modo
//     "alterador" para alteração de diploma EXTERNO.
//   - LODA INLINE: edição directa do alvo no modo alterador, gera amendments
//     ao nível do parágrafo.
//
// Sugestões existem durante a redacção do PRÓPRIO diploma (workflow editorial
// interno: drafter ⇄ revisor): "trocar esta palavra por aquela", "reformular
// esta frase". Quando aceites, são aplicadas in-place — `paragraph.content`
// muta. Quando rejeitadas, ficam em `doc.suggestions` com status='rejected'
// para auditoria, mas nunca tocam o conteúdo.
//
// Modelo:
//   doc.suggestions = [{
//     id, eId, field, range: {start, end},
//     originalText,                 // snapshot do texto da range — usado
//                                   // para detectar drift (stale)
//     proposedText, author, date,
//     status: 'pending' | 'accepted' | 'rejected' | 'stale',
//     note,                         // justificação opcional
//     resolvedDate                  // ISO quando accepted/rejected
//   }]
//
// Persistência: vivem dentro de `doc.suggestions`, portanto viajam no
// rascunho, snapshots, share-URL. NÃO entram no XML AKN-PT por defeito —
// flag `doc._exportWithSuggestions` injecta-as como `<authorialNote
// marker="∆">` (paralelo a `<authorialNote marker="✎">` para comentários).
//
// Eventos de re-anchor: quando outra sugestão na mesma (eId, field) é aceite,
// as restantes ficam potencialmente desalinhadas. `_reanchorAfterAccept`
// percorre-as e: (a) ajusta offsets se a range ainda corresponde a
// `originalText`; (b) marca 'stale' se já não corresponde.

const Suggestions = (() => {

  function _ensureArr(doc) {
    if (!Array.isArray(doc.suggestions)) doc.suggestions = [];
    return doc.suggestions;
  }

  function list(doc, eId) {
    const arr = _ensureArr(doc);
    return eId ? arr.filter(s => s.eId === eId) : arr.slice();
  }

  function listByEid(doc) {
    const arr = _ensureArr(doc);
    const m = new Map();
    arr.forEach(s => {
      if (!m.has(s.eId)) m.set(s.eId, []);
      m.get(s.eId).push(s);
    });
    return m;
  }

  function count(doc, eId) {
    const arr = _ensureArr(doc);
    return eId
      ? arr.filter(s => s.eId === eId && s.status === 'pending').length
      : arr.filter(s => s.status === 'pending').length;
  }

  // Resolve o objecto-host (article, paragraph, …) para um (eId, field).
  // Devolve { host, field, getter, setter } ou null se não encontrado.
  function _resolveHost(doc, eId, field) {
    if (!doc || !eId) return null;
    // recital_N
    if (eId.startsWith('rec_')) {
      const r = (doc.recitals || []).find(x => x.id === eId);
      if (!r || field !== 'text') return null;
      return { host: r, field, get: () => r.text, set: (v) => { r.text = v; } };
    }
    // pseudo-eId para metadados top-level
    if (eId === '__meta__') {
      return { host: doc, field, get: () => doc[field], set: (v) => { doc[field] = v; } };
    }
    // article-level: art_N (heading)
    let mArt = eId.match(/^(art_\d+)$/);
    if (mArt && doc.body) {
      const a = (doc.body.items || []).find(x => x.id === eId);
      if (!a) return null;
      return { host: a, field, get: () => a[field] || '', set: (v) => { a[field] = v; } };
    }
    // paragraph-level: art_N__para_M  OR  para_M (RCM)
    let mPara = eId.match(/^(art_\d+)__para_(\d+)$/) || eId.match(/^(para_\d+)$/);
    if (mPara && doc.body) {
      if (mPara.length === 3) {
        const a = (doc.body.items || []).find(x => x.id === mPara[1]);
        if (!a) return null;
        const p = (a.paragraphs || []).find(x => x.id === eId);
        if (!p) return null;
        return { host: p, field, get: () => p[field] || '', set: (v) => { p[field] = v; } };
      } else {
        const p = (doc.body.items || []).find(x => x.id === eId);
        if (!p) return null;
        return { host: p, field, get: () => p[field] || '', set: (v) => { p[field] = v; } };
      }
    }
    // subpoint-level: <para>__lit_X  OR  <para>__lit_X__sublit_Y
    const mLit = eId.match(/^(.+)__lit_[a-z]$/) || eId.match(/^(.+)__sublit_[a-z]+$/);
    if (mLit && doc.body) {
      // Search recursively
      const walk = (items) => {
        for (const item of items) {
          if (item.id === eId) return item;
          if (item.paragraphs) {
            for (const p of item.paragraphs) {
              if (p.id === eId) return p;
              for (const sp of (p.subPoints || [])) {
                if (sp.id === eId) return sp;
                for (const ssp of (sp.subPoints || [])) {
                  if (ssp.id === eId) return ssp;
                }
              }
            }
          }
          if (item.subPoints) {
            for (const sp of item.subPoints) {
              if (sp.id === eId) return sp;
              for (const ssp of (sp.subPoints || [])) {
                if (ssp.id === eId) return ssp;
              }
            }
          }
        }
        return null;
      };
      const host = walk(doc.body.items || []);
      if (!host) return null;
      return { host, field, get: () => host[field] || '', set: (v) => { host[field] = v; } };
    }
    return null;
  }

  // Cria uma sugestão. `range` é {start, end} sobre o conteúdo actual do
  // (eId, field). `proposedText` é o que vai substituir esse intervalo.
  // Devolve a sugestão criada; lança se inputs forem inválidos.
  function add(doc, eId, field, range, proposedText, opts = {}) {
    const r = _resolveHost(doc, eId, field);
    if (!r) throw new Error(`Suggestion: não encontrei o host para ${eId}/${field}`);
    const text = r.get();
    const start = Math.max(0, Math.min(text.length, range.start | 0));
    const end = Math.max(start, Math.min(text.length, range.end | 0));
    const arr = _ensureArr(doc);
    const sug = {
      id: 's_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 5),
      eId,
      field,
      range: { start, end },
      originalText: text.slice(start, end),
      proposedText: String(proposedText == null ? '' : proposedText),
      author: opts.author || '',
      date: new Date().toISOString(),
      status: 'pending',
      note: opts.note || '',
    };
    arr.push(sug);
    return sug;
  }

  function update(doc, id, patch) {
    const arr = _ensureArr(doc);
    const s = arr.find(x => x.id === id);
    if (!s) return null;
    Object.assign(s, patch);
    return s;
  }

  function remove(doc, id) {
    const arr = _ensureArr(doc);
    const i = arr.findIndex(x => x.id === id);
    if (i >= 0) arr.splice(i, 1);
  }

  // Aceitar: aplica splice no conteúdo, marca status='accepted', e ajusta
  // (ou marca 'stale') as restantes sugestões pending sobre o mesmo (eId,field).
  function accept(doc, id) {
    const arr = _ensureArr(doc);
    const s = arr.find(x => x.id === id);
    if (!s || s.status !== 'pending') return null;
    const r = _resolveHost(doc, s.eId, s.field);
    if (!r) { s.status = 'stale'; return s; }
    const text = r.get();
    // Validar drift: a range deve ainda apontar para `originalText`.
    if (text.slice(s.range.start, s.range.end) !== s.originalText) {
      s.status = 'stale';
      return s;
    }
    const newText = text.slice(0, s.range.start) + s.proposedText + text.slice(s.range.end);
    r.set(newText);
    s.status = 'accepted';
    s.resolvedDate = new Date().toISOString();
    _reanchorAfterAccept(doc, s);
    return s;
  }

  function reject(doc, id) {
    const arr = _ensureArr(doc);
    const s = arr.find(x => x.id === id);
    if (!s || s.status !== 'pending') return null;
    s.status = 'rejected';
    s.resolvedDate = new Date().toISOString();
    return s;
  }

  // Re-anchor das sugestões pending restantes na mesma (eId, field), após
  // aceitação de `accepted`. Para cada outra:
  //   - se a range cai antes da aceite → preserva offsets;
  //   - se cai depois → shifta por (proposedText.length - originalText.length);
  //   - se sobrepõe → marca 'stale'.
  function _reanchorAfterAccept(doc, accepted) {
    const delta = accepted.proposedText.length - accepted.originalText.length;
    const accStart = accepted.range.start;
    const accEnd = accepted.range.end;
    (doc.suggestions || []).forEach(other => {
      if (other.id === accepted.id) return;
      if (other.status !== 'pending') return;
      if (other.eId !== accepted.eId || other.field !== accepted.field) return;
      const oStart = other.range.start;
      const oEnd = other.range.end;
      if (oEnd <= accStart) {
        // antes do aceite — sem shift
        return;
      }
      if (oStart >= accEnd) {
        // depois do aceite — shifta
        other.range = { start: oStart + delta, end: oEnd + delta };
        return;
      }
      // sobrepõe — frágil; marca stale
      other.status = 'stale';
    });
  }

  // Helper: lista detalhada para UI/AKN export.
  function unresolved(doc) {
    return _ensureArr(doc).filter(s => s.status === 'pending');
  }

  // Render diff word-level para preview (depende de Diff.js).
  function renderDiffHtml(s) {
    if (typeof Diff === 'undefined') return _esc(s.proposedText);
    const tokens = Diff.words(s.originalText, s.proposedText);
    return tokens.map(t => {
      if (t.op === '=') return _esc(t.text);
      if (t.op === '+') return `<ins>${_esc(t.text)}</ins>`;
      if (t.op === '-') return `<del>${_esc(t.text)}</del>`;
      return _esc(t.text);
    }).join('');
  }

  function _esc(s) {
    if (typeof document === 'undefined') {
      return String(s || '').replace(/[&<>"']/g, c =>
        ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
    }
    const div = document.createElement('div');
    div.textContent = String(s || '');
    return div.innerHTML;
  }

  return { list, listByEid, count, add, update, remove, accept, reject, unresolved, renderDiffHtml };
})();

if (typeof window !== 'undefined') window.Suggestions = Suggestions;
