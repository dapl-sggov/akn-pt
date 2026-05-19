// AKN-PT Editor — Pilha de rascunhos (multi-documento)
// EUPL-1.2
//
// Substitui o modelo de "1 draft só" por uma pilha persistente em
// localStorage. O draft activo continua a viver na chave legada
// 'akn-pt-editor-draft-v1' (backwards-compat com State e Collab); a pilha
// adiciona uma camada de gestão.
//
// Modelo:
//   akn-pt-stack-v1                  = JSON array {id,actName,number,year,
//                                                  shortTitle,lastModified}
//   akn-pt-stack-v1:doc:{id}         = JSON do doc completo (cópia profunda)
//   akn-pt-stack-v1:active           = id do draft activo (null se vazio)
//
// Ao trocar de draft activo, gravamos o doc actual no seu slot e
// carregamos o novo doc para State.

const Stack = (() => {
  const LIST_KEY = 'akn-pt-stack-v1';
  const DOC_PREFIX = 'akn-pt-stack-v1:doc:';
  const ACTIVE_KEY = 'akn-pt-stack-v1:active';

  function _readList() {
    try { return JSON.parse(localStorage.getItem(LIST_KEY) || '[]'); }
    catch { return []; }
  }
  function _writeList(arr) {
    try { localStorage.setItem(LIST_KEY, JSON.stringify(arr)); } catch (e) {}
  }
  function _newId() {
    return 'doc_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 5);
  }
  function _summarize(doc) {
    return {
      actName: doc.actName,
      subtype: doc.subtype,
      number: doc.number || '',
      year: doc.year || '',
      shortTitle: (doc.shortTitle || '').slice(0, 80),
      kind: doc.kind || 'normal',  // 'normal' ou 'amender'
    };
  }

  function list() {
    return _readList().sort((a, b) => (b.lastModified || '').localeCompare(a.lastModified || ''));
  }
  function activeId() {
    return localStorage.getItem(ACTIVE_KEY);
  }
  function loadDoc(id) {
    try { return JSON.parse(localStorage.getItem(DOC_PREFIX + id) || 'null'); }
    catch { return null; }
  }
  function saveDoc(id, doc) {
    try { localStorage.setItem(DOC_PREFIX + id, JSON.stringify(doc)); return true; }
    catch (e) { return false; }
  }

  // Persiste o doc actual (do State) no seu slot da pilha.
  // Se for um draft novo (sem entry na pilha), cria-o.
  function persistActive() {
    const doc = (typeof State !== 'undefined') ? State.get() : null;
    if (!doc) return null;
    let id = activeId();
    const arr = _readList();
    let entry = id ? arr.find(e => e.id === id) : null;
    if (!entry) {
      id = _newId();
      entry = { id, ..._summarize(doc), lastModified: new Date().toISOString() };
      arr.push(entry);
      localStorage.setItem(ACTIVE_KEY, id);
    } else {
      Object.assign(entry, _summarize(doc), { lastModified: new Date().toISOString() });
    }
    _writeList(arr);
    saveDoc(id, doc);
    return id;
  }

  // Cria explicitamente um novo slot a partir do doc passado.
  function add(doc) {
    const id = _newId();
    const arr = _readList();
    arr.push({ id, ..._summarize(doc), lastModified: new Date().toISOString() });
    _writeList(arr);
    saveDoc(id, doc);
    localStorage.setItem(ACTIVE_KEY, id);
    return id;
  }

  // Activa um draft existente, devolvendo o doc para o caller carregar no State.
  function activate(id) {
    // primeiro persiste o que está em State (no slot do anterior)
    persistActive();
    const doc = loadDoc(id);
    if (!doc) return null;
    localStorage.setItem(ACTIVE_KEY, id);
    return doc;
  }

  function remove(id) {
    _writeList(_readList().filter(e => e.id !== id));
    localStorage.removeItem(DOC_PREFIX + id);
    if (activeId() === id) localStorage.removeItem(ACTIVE_KEY);
  }

  function rename(id, slug) {
    const arr = _readList();
    const e = arr.find(x => x.id === id);
    if (!e) return;
    e.slug = slug;
    _writeList(arr);
  }

  function clear() {
    _readList().forEach(e => localStorage.removeItem(DOC_PREFIX + e.id));
    localStorage.removeItem(LIST_KEY);
    localStorage.removeItem(ACTIVE_KEY);
  }

  // Migração leve: se ainda não houver entries mas existir o draft legacy
  // (chave 'akn-pt-editor-draft-v1'), criar um slot para ele.
  function migrateLegacyIfNeeded() {
    if (_readList().length) return;
    const legacy = localStorage.getItem('akn-pt-editor-draft-v1');
    if (!legacy) return;
    try {
      const doc = JSON.parse(legacy);
      const id = _newId();
      _writeList([{ id, ..._summarize(doc), lastModified: new Date().toISOString() }]);
      saveDoc(id, doc);
      localStorage.setItem(ACTIVE_KEY, id);
    } catch (e) {}
  }

  return {
    list, activeId, loadDoc, persistActive, add, activate,
    remove, rename, clear, migrateLegacyIfNeeded,
  };
})();

if (typeof window !== "undefined") window.Stack = Stack;
