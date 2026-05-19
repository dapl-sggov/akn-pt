// AKN-PT Editor — comentários ancorados em eId
// EUPL-1.2
//
// Os comentários vivem dentro do próprio doc state (`doc.comments`) para
// circularem com o ficheiro — não são puramente "browser side". Cada comentário
// tem `id`, `eId` alvo (artigo, parágrafo, alínea, ...), texto, autor opcional,
// timestamp e flag `resolved`. Threads (replies) modelam-se com `parent`.
//
// Persistência: através de `State.update`/`saveDraft` (já existente).
//
// Exportação AKN-PT: comentários NÃO entram no XML por defeito (correctness
// vs. legística — anotações não normativas não pertencem ao acto). Há porém um
// modo `exportWithComments` que injecta-os como `<note>`s — útil para entrega
// "rascunho-comentado" via XML, mantendo o documento estruturalmente válido.
// O bloco principal só lê/escreve o estado.

const Comments = (() => {

  function _ensureArr(doc) {
    if (!Array.isArray(doc.comments)) doc.comments = [];
    return doc.comments;
  }

  function list(doc, eId) {
    const arr = _ensureArr(doc);
    return eId ? arr.filter(c => c.eId === eId) : arr.slice();
  }

  function listByEid(doc) {
    const arr = _ensureArr(doc);
    const map = new Map();
    arr.forEach(c => {
      if (!map.has(c.eId)) map.set(c.eId, []);
      map.get(c.eId).push(c);
    });
    return map;
  }

  function count(doc, eId) {
    const arr = _ensureArr(doc);
    return eId
      ? arr.filter(c => c.eId === eId && !c.resolved).length
      : arr.filter(c => !c.resolved).length;
  }

  function add(doc, eId, text, opts = {}) {
    const arr = _ensureArr(doc);
    const c = {
      id: 'c_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 5),
      eId,
      text: String(text || ''),
      author: opts.author || '',
      date: new Date().toISOString(),
      resolved: false,
      parent: opts.parent || null,
    };
    arr.push(c);
    return c;
  }

  function update(doc, id, patch) {
    const arr = _ensureArr(doc);
    const c = arr.find(x => x.id === id);
    if (c) Object.assign(c, patch);
    return c;
  }

  function remove(doc, id) {
    const arr = _ensureArr(doc);
    // remove o comentário + qualquer reply directa
    const idx = arr.findIndex(x => x.id === id);
    if (idx < 0) return;
    arr.splice(idx, 1);
    // cascata simples — remove descendentes
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i].parent && !arr.find(c => c.id === arr[i].parent)) {
          arr.splice(i, 1); changed = true;
        }
      }
    }
  }

  function resolve(doc, id) {
    return update(doc, id, { resolved: true, resolvedDate: new Date().toISOString() });
  }
  function unresolve(doc, id) {
    return update(doc, id, { resolved: false, resolvedDate: null });
  }

  function reply(doc, parentId, text, opts = {}) {
    return add(doc, list(doc).find(c => c.id === parentId)?.eId || '', text, { ...opts, parent: parentId });
  }

  // ---- Render helpers (UI) ----

  function renderBadge(n) {
    if (!n) return null;
    const span = document.createElement('span');
    span.className = 'comment-badge';
    span.textContent = `💬 ${n}`;
    span.title = `${n} comentário(s) por resolver`;
    return span;
  }

  function thread(doc, eId) {
    const arr = list(doc, eId);
    // construir árvore por parent
    const top = arr.filter(c => !c.parent);
    return top.map(c => ({ ...c, replies: _children(arr, c.id) }));
  }
  function _children(arr, parentId) {
    return arr.filter(c => c.parent === parentId).map(c => ({ ...c, replies: _children(arr, c.id) }));
  }

  return {
    list, listByEid, count, add, update, remove, resolve, unresolve, reply, thread, renderBadge,
  };
})();

if (typeof window !== "undefined") window.Comments = Comments;
