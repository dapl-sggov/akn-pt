// AKN-PT Editor — vocabulário nacional de assunto (Lista de Descritores INCM)
// EUPL-1.2
//
// Índice compacto (código → rótulo PT) extraído do RDF/SKOS oficial da INCM
// (dre-incm-pt-legal-subject.rdf, ~35k descritores ativos). Alimenta o
// `eli:is_about` com os MESMOS URIs que a INCM usa:
//   http://data.dre.pt/eli/authority/legal-subject/{código}
//
// Carregamento LAZY: o índice (~1.7 MB) só é obtido quando o picker de
// assuntos é usado, via fetch('data/legal-subjects.json') (mesma origem).
//
// API
//   SubjectVocab.load()            → Promise<void> (idempotente)
//   SubjectVocab.search(q, limit)  → [{code, label}]   (prefixo + substring)
//   SubjectVocab.label(code)       → string | null
//   SubjectVocab.uri(code)         → string

const SubjectVocab = (() => {
  const BASE = 'http://data.dre.pt/eli/authority/legal-subject/';
  let _items = null;            // [[code, label], ...]
  let _byCode = null;           // { code: label }
  let _loading = null;

  function uri(code) { return BASE + code; }

  function _index(items) {
    _items = items;
    _byCode = Object.create(null);
    for (const [c, l] of items) _byCode[c] = l;
  }

  // Permite injetar o índice (ex.: testes em Node) sem fetch.
  function setData(items) { _index(items); return _items.length; }

  async function load() {
    if (_items) return;
    if (_loading) return _loading;
    _loading = (async () => {
      const res = await fetch('data/legal-subjects.json');
      if (!res.ok) throw new Error(`legal-subjects.json: HTTP ${res.status}`);
      _index(await res.json());
    })();
    return _loading;
  }

  function label(code) { return (_byCode && _byCode[code]) || null; }

  function search(q, limit = 20) {
    if (!_items || !q) return [];
    const needle = String(q).toLowerCase().trim();
    if (!needle) return [];
    const pref = [], sub = [];
    for (const [code, l] of _items) {
      const ll = l.toLowerCase();
      if (ll.startsWith(needle)) pref.push({ code, label: l });
      else if (ll.includes(needle)) sub.push({ code, label: l });
      if (pref.length >= limit) break;
    }
    return pref.concat(sub).slice(0, limit);
  }

  return { load, setData, search, label, uri, get size() { return _items ? _items.length : 0; } };
})();

if (typeof window !== 'undefined') window.SubjectVocab = SubjectVocab;
if (typeof globalThis !== 'undefined') globalThis.SubjectVocab = SubjectVocab;
