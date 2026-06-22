// AKN-PT Editor — índice de atos recentes (Atom feed ELI do DR)
// EUPL-1.2
//
// Índice estático (data/acts-index.json) derivado offline do Atom update feed
// oficial do Diário da República (files.diariodarepublica.pt/eli/eli-update-feed.atom).
// Cada entrada: {eli, tipo, numero, ano, data, titulo}.
//
// Porquê estático: o runtime do editor (página estática) NÃO pode fazer fetch
// ao feed da INCM (sem CORS); por isso o índice é construído offline e servido
// como asset. COBERTURA: só atos RECENTES (janela móvel ~2 meses do feed) —
// não é um índice histórico. Complementa o DreMock (diplomas de referência).
//
// API
//   ActIndex.load()           → Promise<void> (lazy, idempotente)
//   ActIndex.search(q, limit) → [{eli, tipo, numero, ano, data, titulo}]

const ActIndex = (() => {
  let _items = null, _loading = null;

  function setData(items) { _items = items; return _items.length; }

  async function load() {
    if (_items) return;
    if (typeof fetch === 'undefined') { _items = []; return; }
    if (_loading) return _loading;
    _loading = fetch('data/acts-index.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { _items = Array.isArray(d) ? d : []; })
      .catch(() => { _items = []; });
    return _loading;
  }

  function search(q, limit = 6) {
    if (!_items || !q) return [];
    const n = String(q).toLowerCase().trim();
    if (!n) return [];
    const out = [];
    for (const a of _items) {
      const hay = `${a.titulo || ''} ${a.tipo} ${a.numero}/${a.ano}`.toLowerCase();
      if (hay.includes(n)) out.push(a);
      if (out.length >= limit) break;
    }
    return out;
  }

  return { load, setData, search, get size() { return _items ? _items.length : 0; } };
})();

if (typeof window !== 'undefined') window.ActIndex = ActIndex;
if (typeof globalThis !== 'undefined') globalThis.ActIndex = ActIndex;
