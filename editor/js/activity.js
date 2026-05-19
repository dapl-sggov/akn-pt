// AKN-PT Editor — Régua de actividade (feed cronológico)
// EUPL-1.2
//
// Substitui as 4 tabs (Informação / Revisão / Ligações / Saída) por um
// único feed cronológico inverso de tudo o que acontece no documento.
//
// Eventos:
//   * validation   — erros e avisos da Validation.check (recomputados em cada refresh)
//   * comment      — comentário adicionado/resolvido
//   * snapshot     — snapshot manual ou auto
//   * ia           — sugestão IA aceite/rejeitada
//   * footprint    — step do workflow adicionado
//   * ref          — referência cruzada detectada
//   * import       — diploma importado
//
// O feed combina:
//   (a) estados computados a partir do doc (validation, refs, footprint),
//       que são "live" — não persistem entre sessões mas são sempre exactos.
//   (b) eventos discretos persistidos em localStorage (comments, snapshots,
//       IA invocations, imports), que aparecem em ordem cronológica.

const Activity = (() => {
  const FEED_KEY = 'akn-pt-activity-v1';
  const MAX_PERSISTED = 200;

  function _readPersisted() {
    try { return JSON.parse(localStorage.getItem(FEED_KEY) || '[]'); }
    catch { return []; }
  }
  function _writePersisted(arr) {
    try { localStorage.setItem(FEED_KEY, JSON.stringify(arr.slice(0, MAX_PERSISTED))); }
    catch (e) {}
  }

  function log(kind, data) {
    const arr = _readPersisted();
    arr.unshift({
      id: 'act_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 5),
      kind,
      data: data || {},
      timestamp: new Date().toISOString(),
      docId: typeof Stack !== 'undefined' ? Stack.activeId() : null,
    });
    _writePersisted(arr);
  }

  // Devolve apenas eventos do doc activo
  function persisted() {
    const activeDoc = typeof Stack !== 'undefined' ? Stack.activeId() : null;
    return _readPersisted().filter(e => !activeDoc || e.docId === activeDoc || e.docId === null);
  }

  // Computa eventos "live" a partir do estado actual do doc.
  function liveFromDoc(doc) {
    if (!doc) return [];
    const out = [];
    // 1. Validação
    if (typeof Validation !== 'undefined') {
      const issues = Validation.check(doc);
      issues.forEach((i, idx) => out.push({
        id: `live_val_${idx}`,
        kind: 'validation',
        live: true,
        data: { level: i.level, msg: i.msg, eId: i.eId || null },
        timestamp: new Date().toISOString(),
      }));
    }
    // 2. Footprint summary
    if (doc.workflow && doc.workflow.length) {
      out.push({
        id: 'live_footprint_summary',
        kind: 'footprint',
        live: true,
        data: { steps: doc.workflow.length, summary: `${doc.workflow.length} step(s) registado(s)` },
        timestamp: new Date().toISOString(),
      });
    }
    // 3. Refs cruzadas (sumário)
    if (typeof References !== 'undefined') {
      const s = References.statsForDoc(doc);
      if (s.total > 0) {
        out.push({
          id: 'live_refs_summary',
          kind: 'ref',
          live: true,
          data: { internal: s.internal, externalPt: s.externalPt, externalUe: s.externalUe, total: s.total },
          timestamp: new Date().toISOString(),
        });
      }
    }
    // 4. Comments abertos (sumário)
    if (typeof Comments !== 'undefined') {
      const n = Comments.count(doc);
      if (n > 0) {
        out.push({
          id: 'live_comments_summary',
          kind: 'comment',
          live: true,
          data: { open: n },
          timestamp: new Date().toISOString(),
        });
      }
    }
    return out;
  }

  // Combina live + persisted, ordenado por timestamp desc
  function allForDoc(doc) {
    const live = liveFromDoc(doc);
    const past = persisted();
    return [...live, ...past].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  }

  function clear() {
    localStorage.removeItem(FEED_KEY);
  }

  return { log, persisted, liveFromDoc, allForDoc, clear };
})();

if (typeof window !== "undefined") window.Activity = Activity;
