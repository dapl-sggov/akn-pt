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
  let _euByCode = null;         // { code: {eurovoc, euLabel} }  (crosswalk → EuroVoc)
  let _loading = null;

  function uri(code) { return BASE + code; }

  function _index(items) {
    _items = items;
    _byCode = Object.create(null);
    for (const [c, l] of items) _byCode[c] = l;
  }

  // Permite injetar dados (ex.: testes em Node) sem fetch.
  function setData(items, crosswalk) {
    _index(items);
    _euByCode = Object.create(null);
    for (const x of (crosswalk || [])) _euByCode[x.code] = { eurovoc: x.eurovoc, euLabel: x.euLabel };
    return _items.length;
  }

  async function load() {
    if (_items) return;
    if (typeof fetch === 'undefined') { _items = []; _euByCode = Object.create(null); return; }
    if (_loading) return _loading;
    _loading = (async () => {
      const [si, cw] = await Promise.all([
        fetch('data/legal-subjects.json').then(r => { if (!r.ok) throw new Error(`legal-subjects.json: HTTP ${r.status}`); return r.json(); }),
        fetch('data/subject-eurovoc-crosswalk.json').then(r => r.ok ? r.json() : []).catch(() => []),
      ]);
      _index(si);
      _euByCode = Object.create(null);
      for (const x of cw) _euByCode[x.code] = { eurovoc: x.eurovoc, euLabel: x.euLabel };
    })();
    return _loading;
  }

  function label(code) { return (_byCode && _byCode[code]) || null; }
  // Mapeamento para EuroVoc (se existir no crosswalk): { eurovoc, euLabel } | null
  function eurovoc(code) { return (_euByCode && _euByCode[code]) || null; }

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

  return { load, setData, search, label, uri, eurovoc, get size() { return _items ? _items.length : 0; } };
})();

if (typeof window !== 'undefined') window.SubjectVocab = SubjectVocab;
if (typeof globalThis !== 'undefined') globalThis.SubjectVocab = SubjectVocab;
