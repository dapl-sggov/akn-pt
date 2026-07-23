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
  // https, como o resto do modelo canónico (AUTH em eli-metadata.js).
  const BASE = 'https://data.dre.pt/eli/authority/legal-subject/';
  let _items = null;            // [[code, label], ...]
  let _folded = null;           // rótulos com diacríticos dobrados (índice paralelo)
  let _cwOk = false;            // o crosswalk EuroVoc carregou?
  let _byCode = null;           // { code: label }
  let _euByCode = null;         // { code: {eurovoc, euLabel} }  (crosswalk → EuroVoc)
  let _loading = null;

  function uri(code) { return BASE + code; }

  // Dobra diacríticos e caixa: "Água" e "agua" têm de encontrar-se.
  const _fold = (s) => String(s == null ? '' : s)
    .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  function _index(items) {
    _items = items;
    _byCode = Object.create(null);
    _folded = new Array(items.length);
    for (let i = 0; i < items.length; i++) {
      const [c, l] = items[i];
      _byCode[c] = l;
      _folded[i] = _fold(l);   // pré-computado: evita dobrar a cada pesquisa
    }
  }

  // Permite injetar dados (ex.: testes em Node) sem fetch.
  function setData(items, crosswalk) {
    _index(items);
    _cwOk = Array.isArray(crosswalk) && crosswalk.length > 0;
    _euByCode = Object.create(null);
    for (const x of (crosswalk || [])) _euByCode[x.code] = { eurovoc: x.eurovoc, euLabel: x.euLabel };
    return _items.length;
  }

  async function load() {
    if (_items) return;
    if (typeof fetch === 'undefined') {
      _items = []; _folded = []; _byCode = Object.create(null);
      _euByCode = Object.create(null); _cwOk = false; return;
    }
    if (_loading) return _loading;
    _loading = (async () => {
      const [si, cw] = await Promise.all([
        fetch('data/legal-subjects.json').then(r => { if (!r.ok) throw new Error(`legal-subjects.json: HTTP ${r.status}`); return r.json(); }),
        fetch('data/subject-eurovoc-crosswalk.json')
          .then(r => { _cwOk = r.ok; return r.ok ? r.json() : []; })
          .catch(() => { _cwOk = false; return []; }),
      ]);
      _index(si);
      _euByCode = Object.create(null);
      for (const x of cw) _euByCode[x.code] = { eurovoc: x.eurovoc, euLabel: x.euLabel };
    })();
    _loading = _loading.catch((e) => { _loading = null; throw e; });
    return _loading;
  }

  function label(code) { return (_byCode && _byCode[code]) || null; }
  // Mapeamento para EuroVoc (se existir no crosswalk): { eurovoc, euLabel } | null
  function eurovoc(code) { return (_euByCode && _euByCode[code]) || null; }

  function search(q, limit = 20) {
    if (!_items || !q) return [];
    const needle = _fold(q).trim();
    if (!needle) return [];
    // Procura directa por código: colar um código da INCM deve resolver.
    if (/^\d+$/.test(needle) && _byCode && _byCode[needle]) {
      return [{ code: needle, label: _byCode[needle] }];
    }
    const pref = [], sub = [];
    for (let i = 0; i < _items.length; i++) {
      const ll = _folded[i];
      if (ll.startsWith(needle)) pref.push({ code: _items[i][0], label: _items[i][1] });
      else if (ll.includes(needle)) sub.push({ code: _items[i][0], label: _items[i][1] });
      if (pref.length >= limit) break;
    }
    return pref.concat(sub).slice(0, limit);
  }

  return { load, setData, search, label, uri, eurovoc,
    get crosswalkReady() { return _cwOk; },
    get size() { return _items ? _items.length : 0; } };
})();

if (typeof window !== 'undefined') window.SubjectVocab = SubjectVocab;
if (typeof globalThis !== 'undefined') globalThis.SubjectVocab = SubjectVocab;
