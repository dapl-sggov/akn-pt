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
//   ActIndex.findAct(numero, ano, slug) → entrada | null   (procura exacta)
//   ActIndex.byUri(uri)       → entrada | null   (Work, Expression ou Manifestation)
//   ActIndex.setData(items)   → nº de entradas  (injecção para testes)
//   ActIndex.size             → nº de entradas carregadas

const ActIndex = (() => {
  let _items = null, _loading = null;

  function setData(items) {
    _items = Array.isArray(items) ? items : [];
    _loading = null;   // invalida um fetch pendente
    return _items.length;
  }

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

  // Dobra diacríticos e ruído de citação ('n.º', pontos) dos dois lados.
  const _norm = (s) => String(s == null ? '' : s)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/n\.\s*[ºo°]\s*|n\s*[º°]\s*/g, ' ').replace(/[.,]/g, ' ')
    .replace(/\s+/g, ' ').trim();

  function search(q, limit = 6) {
    if (!_items || !q) return [];
    const termos = _norm(q).split(' ').filter(Boolean);
    if (!termos.length) return [];
    const out = [];
    for (const a of _items) {
      // Só a parte identificadora do ELI entra: o prefixo invariante fazia
      // qualquer token genérico corresponder a todo o índice.
      const hay = _norm(`${a.titulo || ''} ${a.tipo} ${a.numero}/${a.ano} `
        + String(a.eli || '').replace('https://data.dre.pt/eli/', ''));
      if (termos.every(t => hay.includes(t))) out.push(a);
      if (out.length >= limit) break;
    }
    return out;
  }

  // Resolve um URI ELI (Work, Expression ou Manifestation) para a entrada do
  // índice, truncando ao Work e normalizando esquema e caixa do número.
  function byUri(uri) {
    if (!_items || !uri) return null;
    const work = String(uri).trim().toLowerCase()
      .replace(/^http:/, 'https:')
      .replace(/\/(pt)(\/(xml|html|pdf))?$/, '');
    return _items.find(a => String(a.eli || '').toLowerCase().replace(/^http:/, 'https:') === work) || null;
  }

  // Procura EXACTA por número + ano, opcionalmente restrita ao slug ELI da
  // INCM presente no URI. Serve a resolução de citações (references.js), que
  // precisa do ELI canónico real e não de uma correspondência aproximada.
  // Síncrona por desenho: devolve null se o índice ainda não foi carregado.
  function findAct(numero, ano, slug) {
    if (!_items || numero == null || ano == null) return null;
    const n = String(numero).toLowerCase();
    const y = String(ano);
    return _items.find((a) =>
      String(a.numero).toLowerCase() === n &&
      String(a.ano) === y &&
      (!slug || String(a.eli || '').includes(`/eli/${slug}/`))
    ) || null;
  }

  return { load, setData, search, findAct, byUri, get size() { return _items ? _items.length : 0; } };
})();

if (typeof window !== 'undefined') window.ActIndex = ActIndex;
if (typeof globalThis !== 'undefined') globalThis.ActIndex = ActIndex;
