// AKN-PT Editor — State management + persistence
// EUPL-1.2

const STORAGE_KEY = 'akn-pt-editor-draft-v1';
const State = (() => {
  let doc = null;
  // Snapshot in-memory para suporte ao botão "Anular" após renumber cascading.
  // NÃO entra no localStorage (seria duplicar o doc inteiro a cada move).
  // Limpo automaticamente quando consumido pela UI ou na próxima renumber-op
  // que NÃO produz alterações textuais.
  let _renumberUndoSnap = null;

  function init(d) { doc = d; return doc; }
  function get() { return doc; }

  function update(patch) {
    Object.assign(doc, patch);
    saveDraft();
    if (typeof Editor !== 'undefined' && Editor.refresh) Editor.refresh();
  }

  function saveDraft() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
    } catch (e) {
      console.warn('Could not save draft:', e);
    }
  }

  function loadDraft() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function clearDraft() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // -------------------------- Mutations ----------------------------------
  function addRecital() {
    const n = doc.nextRecitalNum++;
    doc.recitals.push({ id: `rec_${n}`, text: 'Considerando que …' });
    saveDraft();
  }
  function removeRecital(id) {
    doc.recitals = doc.recitals.filter(r => r.id !== id);
    saveDraft();
  }
  function updateRecital(id, text) {
    const r = doc.recitals.find(x => x.id === id);
    if (r) { r.text = text; saveDraft(); }
  }

  function addArticle() {
    insertArticleAt(null);  // append at end
  }

  // Insert article at a specific position.
  // afterArticleId === null    → prepend
  // afterArticleId === string  → insert immediately after that article
  // afterArticleId === undef   → append at end
  function insertArticleAt(afterArticleId) {
    if (doc.body.kind !== 'articles') return;
    _withRenumberUndo(() => {
      // ID temporário; renumberArticles atribui o eId final.
      const tmpId = `__tmp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const newArt = {
        id: tmpId, num: '', heading: '',
        paragraphs: [{ id: `${tmpId}__para_1`, num: '', content: '', subPoints: [] }],
      };
      if (afterArticleId === null) {
        doc.body.items.unshift(newArt);
      } else if (afterArticleId === undefined) {
        doc.body.items.push(newArt);
      } else {
        const idx = doc.body.items.findIndex(a => a.id === afterArticleId);
        if (idx < 0) doc.body.items.push(newArt);
        else doc.body.items.splice(idx + 1, 0, newArt);
      }
    });
  }

  function moveArticleUp(articleId) {
    if (doc.body.kind !== 'articles') return;
    const idx = doc.body.items.findIndex(a => a.id === articleId);
    if (idx <= 0) return;
    _withRenumberUndo(() => {
      [doc.body.items[idx - 1], doc.body.items[idx]] =
        [doc.body.items[idx], doc.body.items[idx - 1]];
    });
  }

  function moveArticleDown(articleId) {
    if (doc.body.kind !== 'articles') return;
    const idx = doc.body.items.findIndex(a => a.id === articleId);
    if (idx < 0 || idx >= doc.body.items.length - 1) return;
    _withRenumberUndo(() => {
      [doc.body.items[idx], doc.body.items[idx + 1]] =
        [doc.body.items[idx + 1], doc.body.items[idx]];
    });
  }

  // Reordena articulado segundo a sequência de eIds fornecida. IDs em falta
  // (ou desconhecidos) são silenciosamente ignorados; itens não-incluídos
  // preservam-se no fim na ordem original — robusto a chamadas parciais.
  // Aciona renumber cascading via _withRenumberUndo.
  function reorderArticles(newOrderIds) {
    if (doc.body.kind !== 'articles') return;
    if (!Array.isArray(newOrderIds) || !newOrderIds.length) return;
    const byId = new Map(doc.body.items.map(a => [a.id, a]));
    const seen = new Set();
    const next = [];
    newOrderIds.forEach(id => {
      if (byId.has(id) && !seen.has(id)) { next.push(byId.get(id)); seen.add(id); }
    });
    doc.body.items.forEach(a => {
      if (!seen.has(a.id)) next.push(a);
    });
    // Se a ordem é igual à actual, sair cedo.
    let same = next.length === doc.body.items.length;
    for (let i = 0; same && i < next.length; i++) {
      if (next[i].id !== doc.body.items[i].id) same = false;
    }
    if (same) return;
    _withRenumberUndo(() => {
      doc.body.items = next;
    });
  }

  // Renumera todos os artigos com base na posicao actual:
  //  - <num> visivel: "Artigo 1.º", "Artigo 2.º", ...  (apenas se o num
  //    actual seguir o padrao standard; "Artigo 5.º-A" preserva-se)
  //  - eId: art_1, art_2, ... (e propagado a todos os ids descendentes)
  //
  // Renumber cascading (cf. LEOS, ver editor/js/renumber.js):
  // ANTES da mutação estrutural, o helper Renumber.prepareRenumber reescreve
  // referências cruzadas em texto livre (artigo N → novo N), re-anchora
  // comentários e amendments. O sumário fica em doc._lastRenumberSummary
  // para a UI poder mostrar um toast com "anular" — o snapshot anterior
  // fica em doc._lastRenumberUndo (limpo por consumidores; in-memory, não
  // entra no localStorage).
  function renumberArticles() {
    if (doc.body.kind !== 'articles') return;
    // 1) Cascading (antes da mutação estrutural) — reescreve text refs +
    //    remap comments + remap amendments. Modifica os mesmos obj-refs
    //    que vão ser depois clonados via spread em _renameArticleSubtree,
    //    pelo que os novos objects herdam o conteúdo já reescrito.
    let summary = null;
    if (typeof Renumber !== 'undefined') {
      summary = Renumber.prepareRenumber(doc);
    }
    // 2) Mutação estrutural — reescreve eIds e <num> visíveis.
    const STD_NUM = /^Artigo\s+\d+\.[ºo°]?\s*$/i;
    doc.body.items = doc.body.items.map((a, i) => {
      const newId = `art_${i + 1}`;
      const oldId = a.id;
      const isStd = !a.num || STD_NUM.test(a.num);
      const newNum = isStd ? `Artigo ${i + 1}.º` : a.num;
      const renamed = _renameArticleSubtree(a, oldId, newId);
      renamed.id = newId;
      renamed.num = newNum;
      return renamed;
    });
    doc.nextArticleNum = doc.body.items.length + 1;
    // 3) Expor sumário para a UI consumir após o refresh.
    //    O snapshot de undo é capturado mais acima na cadeia (em moveArticleUp/
    //    Down/insertArticleAt), de modo a representar o estado PRÉ-swap.
    //    O sumário viaja no doc (pequeno); o undo snap fica em memória de
    //    módulo (não vai a localStorage nem ao share-URL — seria pesado e a
    //    janela de undo é curta).
    if (summary && (summary.textRewrites || summary.commentsRemapped || summary.amendmentsRemapped)) {
      doc._lastRenumberSummary = { ...summary, ts: Date.now() };
    } else {
      delete doc._lastRenumberSummary;
    }
  }

  // Wrapper interno usado pelas mutações que disparam renumber. Captura
  // snapshot ANTES da mutação (i.e. o verdadeiro estado a restaurar no
  // "anular"), executa `fn`, chama renumber + saveDraft, e mantém o snap
  // só se o renumber detectou rewrites/re-anchors com impacto.
  function _withRenumberUndo(fn) {
    let snap = null;
    try { snap = JSON.parse(JSON.stringify(doc)); } catch (e) { snap = null; }
    fn();
    renumberArticles();
    saveDraft();
    _renumberUndoSnap = (doc._lastRenumberSummary && snap) ? snap : null;
  }

  // Consome o snapshot de undo (devolve e limpa). UI chama isto ao processar
  // o botão "Anular".
  function consumeRenumberUndo() {
    const s = _renumberUndoSnap;
    _renumberUndoSnap = null;
    return s;
  }
  function hasRenumberUndo() { return !!_renumberUndoSnap; }

  function _renameArticleSubtree(article, oldId, newId) {
    if (oldId === newId) return article;
    const replaceId = (id) => id && id.startsWith(oldId) ? newId + id.slice(oldId.length) : id;
    return {
      ...article,
      paragraphs: article.paragraphs.map(p => ({
        ...p,
        id: replaceId(p.id),
        subPoints: (p.subPoints || []).map(sp => ({
          ...sp,
          id: replaceId(sp.id),
          subPoints: (sp.subPoints || []).map(ssp => ({
            ...ssp,
            id: replaceId(ssp.id),
          })),
        })),
      })),
    };
  }
  function removeArticle(id) {
    if (doc.body.kind === 'hierarchic') {
      const found = _findItemAndParent(id);
      if (!found) return;
      found.parentItems.splice(found.idx, 1);
      saveDraft();
      return;
    }
    if (doc.body.kind !== 'articles') return;
    doc.body.items = doc.body.items.filter(a => a.id !== id);
    saveDraft();
  }
  function updateArticle(id, patch) {
    if (doc.body.kind === 'hierarchic') {
      const found = _findItemAndParent(id);
      if (found && found.item && !_isContainer(found.item)) {
        Object.assign(found.item, patch);
        saveDraft();
      }
      return;
    }
    const a = doc.body.items.find(x => x.id === id);
    if (a) { Object.assign(a, patch); saveDraft(); }
  }

  // ===== Containers (book/part/title/chapter/section/subsection) ============
  // v0.1.2: o editor passa a permitir CRIAR e MOVER containers hierárquicos
  // dentro do body. Containers vivem em doc.body.items quando
  // doc.body.kind === 'hierarchic' (cf. ADR-0011 e cap. 5 da spec).
  //
  // eIds — abreviaturas PT (consistentes com corpus#11 CIRS):
  //   liv_  (livro)        sec_   (secção)
  //   prt_  (parte)        sub_   (subsecção)
  //   tit_  (título)       art_   (artigo — flat)
  //   cap_  (capítulo)
  //
  // Numeração: art_N permanece flat (continua através de capítulos —
  // convenção legística PT). Containers têm contador próprio por tipo
  // (cap_1, cap_2, sec_1, sec_2, ...). renumberHierarchy() reescreve tudo.

  const _CONTAINER_TYPES = new Set(['book', 'part', 'title', 'chapter', 'section', 'subsection']);
  const _CONTAINER_EID_PREFIX = {
    book: 'liv', part: 'prt', title: 'tit',
    chapter: 'cap', section: 'sec', subsection: 'sub',
  };
  const _CONTAINER_DISPLAY_NUM = {
    book: 'LIVRO', part: 'PARTE', title: 'TÍTULO',
    chapter: 'CAPÍTULO', section: 'SECÇÃO', subsection: 'SUBSECÇÃO',
  };
  // Numerais romanos para containers (cap I, sec II, etc.) — convenção PT.
  function _toRoman(n) {
    const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
    const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
    let out = '';
    for (let i = 0; i < vals.length; i++) {
      while (n >= vals[i]) { out += syms[i]; n -= vals[i]; }
    }
    return out;
  }

  function _isContainer(item) {
    return item && _CONTAINER_TYPES.has(item.containerType);
  }

  // Walk a árvore body.items à procura de um item por eId. Devolve
  // { item, parentItems, idx } ou null se não encontrado. Para itens no
  // root level, parentItems === doc.body.items.
  function _findItemAndParent(eId, items, parentItems) {
    items = items || doc.body.items;
    parentItems = parentItems || items;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it) continue;
      if (it.id === eId) return { item: it, parentItems: items, idx: i };
      if (_isContainer(it) && it.items) {
        const sub = _findItemAndParent(eId, it.items, items);
        if (sub) return sub;
      }
    }
    return null;
  }

  // Promove body de 'articles' para 'hierarchic' (in-place, idempotente).
  // Necessário antes de adicionar o primeiro container num doc que ainda
  // está no modo flat.
  function ensureHierarchicBody() {
    if (!doc.body) return;
    if (doc.body.kind === 'hierarchic') return;
    if (doc.body.kind !== 'articles') return;  // RCM/Res-AR (paragraphs) — não suporta containers
    doc.body = { kind: 'hierarchic', items: doc.body.items || [] };
  }

  // Adiciona um container ao body. opts: { parentEId, afterEId }.
  //   - parentEId === null/undefined → root level
  //   - afterEId === undefined       → append a final dentro do scope
  //   - afterEId === null            → prepend dentro do scope
  //   - afterEId === string          → inserir após esse irmão
  // Após inserção, renumberHierarchy reescreve eIds + nums sequencialmente.
  function addContainer(containerType, opts) {
    if (!_CONTAINER_TYPES.has(containerType)) {
      throw new Error(`Tipo de container desconhecido: ${containerType}`);
    }
    opts = opts || {};
    ensureHierarchicBody();
    if (doc.body.kind !== 'hierarchic') return;

    // Determinar a lista alvo de items
    let targetItems;
    if (opts.parentEId) {
      const parent = _findItemAndParent(opts.parentEId);
      if (!parent || !_isContainer(parent.item)) {
        throw new Error(`Parent ${opts.parentEId} não existe ou não é container.`);
      }
      if (!parent.item.items) parent.item.items = [];
      targetItems = parent.item.items;
    } else {
      targetItems = doc.body.items;
    }

    // Criar container temporário (renumber atribui eId final)
    const tmpId = `__tmpc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newContainer = {
      id: tmpId,
      containerType,
      num: '',  // será preenchido pelo renumberHierarchy
      heading: '',
      items: [],
    };

    // Inserir na posição certa
    if (opts.afterEId === null) {
      targetItems.unshift(newContainer);
    } else if (opts.afterEId === undefined) {
      targetItems.push(newContainer);
    } else {
      const idx = targetItems.findIndex(it => it && it.id === opts.afterEId);
      if (idx < 0) targetItems.push(newContainer);
      else targetItems.splice(idx + 1, 0, newContainer);
    }

    renumberHierarchy();
    saveDraft();
    return newContainer.id;
  }

  function removeContainer(eId, opts) {
    if (doc.body.kind !== 'hierarchic') return;
    opts = opts || {};
    const found = _findItemAndParent(eId);
    if (!found || !_isContainer(found.item)) return;
    if (opts.keepChildren && found.item.items && found.item.items.length) {
      // Promove filhos para os irmãos do container removido (mesma posição)
      found.parentItems.splice(found.idx, 1, ...found.item.items);
    } else {
      found.parentItems.splice(found.idx, 1);
    }
    renumberHierarchy();
    saveDraft();
  }

  function moveContainerUp(eId) {
    if (doc.body.kind !== 'hierarchic') return;
    const found = _findItemAndParent(eId);
    if (!found || found.idx <= 0) return;
    const arr = found.parentItems;
    [arr[found.idx - 1], arr[found.idx]] = [arr[found.idx], arr[found.idx - 1]];
    renumberHierarchy();
    saveDraft();
  }

  function moveContainerDown(eId) {
    if (doc.body.kind !== 'hierarchic') return;
    const found = _findItemAndParent(eId);
    if (!found || found.idx >= found.parentItems.length - 1) return;
    const arr = found.parentItems;
    [arr[found.idx], arr[found.idx + 1]] = [arr[found.idx + 1], arr[found.idx]];
    renumberHierarchy();
    saveDraft();
  }

  function updateContainer(eId, patch) {
    if (doc.body.kind !== 'hierarchic') return;
    const found = _findItemAndParent(eId);
    if (!found || !_isContainer(found.item)) return;
    // Não permitir alterar containerType (= breaking change ao eId)
    delete patch.containerType;
    delete patch.id;
    delete patch.items;
    Object.assign(found.item, patch);
    saveDraft();
  }

  // Renumera containers + articles em walk depth-first.
  //   - Containers: contador por tipo (cap_1, cap_2, sec_1, sec_2, ...)
  //     com num visível em romanos uppercase ("CAPÍTULO I").
  //   - Articles: contador global flat (art_1, art_2, ... — continua
  //     através de chapters/sections, convenção legística PT).
  //   - Paragraphs renomeiam descendência via _renameArticleSubtree.
  function renumberHierarchy() {
    if (doc.body.kind !== 'hierarchic') return;
    // Capturar map oldId→newId para todos os items (containers + articles),
    // depois aplicar Renumber.prepareRenumber para reescrever refs textuais
    // e re-anchor de comments. Em v0.1.2, simplificamos: renumber walks e
    // reescreve eIds; descansamos sobre o snapshot in-memory para undo.

    const counters = {
      book: 0, part: 0, title: 0, chapter: 0, section: 0, subsection: 0,
      article: 0,
    };

    // Walk depth-first, atribuir novos eIds
    const walkItems = (items) => {
      return items.map(it => {
        if (!it) return it;
        if (_isContainer(it)) {
          counters[it.containerType]++;
          const newId = `${_CONTAINER_EID_PREFIX[it.containerType]}_${counters[it.containerType]}`;
          const newNum = it.num && !it.num.includes(_CONTAINER_DISPLAY_NUM[it.containerType])
            ? it.num  // manter num custom (ex: "CAPÍTULO I-A")
            : `${_CONTAINER_DISPLAY_NUM[it.containerType]} ${_toRoman(counters[it.containerType])}`;
          return {
            ...it,
            id: newId,
            num: newNum,
            items: walkItems(it.items || []),
          };
        }
        // Article
        counters.article++;
        const newId = `art_${counters.article}`;
        const STD_NUM = /^Artigo\s+\d+\.[ºo°]?\s*$/i;
        const isStd = !it.num || STD_NUM.test(it.num);
        const newNum = isStd ? `Artigo ${counters.article}.º` : it.num;
        const oldId = it.id;
        const renamed = _renameArticleSubtree(it, oldId, newId);
        renamed.id = newId;
        renamed.num = newNum;
        return renamed;
      });
    };

    doc.body.items = walkItems(doc.body.items);
    doc.nextArticleNum = counters.article + 1;
  }

  function addParagraph(articleId) {
    insertParagraphAt(articleId, undefined);
  }

  // Insert paragraph at a specific position within an article (or in body for RCM).
  // afterParagraphId === null  → prepend
  // afterParagraphId === undef → append
  // afterParagraphId === string→ insert after that paragraph
  function insertParagraphAt(articleId, afterParagraphId) {
    if (doc.body.kind === 'paragraphs') {
      // RCM / Res-AR: paragraph directly in body
      const n = doc.nextParaNum++;
      const newP = { id: `para_${n}`, num: `${doc.body.items.length + 1} -`, content: '', subPoints: [] };
      _insertAt(doc.body.items, newP, afterParagraphId);
      // Renumber sequentially for visible num
      doc.body.items.forEach((p, i) => { p.num = `${i + 1} -`; });
    } else {
      const a = doc.body.items.find(x => x.id === articleId);
      if (!a) return;
      // Auto-numera paragrafos sem num (convencao legistica: se ha mais que um, todos numerados)
      a.paragraphs.forEach((p, i) => { if (!p.num) p.num = `${i + 1} -`; });
      // Per-article paragraph counter — usa o maior existente + 1 para evitar colisoes
      const existing = a.paragraphs
        .map(p => parseInt((p.id.match(/__para_(\d+)$/) || ['', '0'])[1], 10))
        .reduce((m, v) => Math.max(m, v), 0);
      const n = existing + 1;
      const newP = {
        id: `${articleId}__para_${n}`,
        num: '',
        content: '',
        subPoints: [],
      };
      _insertAt(a.paragraphs, newP, afterParagraphId);
      // Renumber all paragraphs sequentially (visible num)
      a.paragraphs.forEach((p, i) => { p.num = `${i + 1} -`; });
    }
    saveDraft();
  }

  function _insertAt(arr, item, afterId) {
    if (afterId === null) {
      arr.unshift(item);
    } else if (afterId === undefined) {
      arr.push(item);
    } else {
      const idx = arr.findIndex(x => x.id === afterId);
      if (idx < 0) arr.push(item);
      else arr.splice(idx + 1, 0, item);
    }
  }

  function moveParagraphUp(pId, articleId) {
    const arr = doc.body.kind === 'paragraphs'
      ? doc.body.items
      : (doc.body.items.find(x => x.id === articleId)?.paragraphs);
    if (!arr) return;
    const idx = arr.findIndex(p => p.id === pId);
    if (idx > 0) {
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      // Renumber visible num if RCM-style or all-numbered
      if (doc.body.kind === 'paragraphs' || arr.every(p => p.num)) {
        arr.forEach((p, i) => { p.num = `${i + 1} -`; });
      }
      saveDraft();
    }
  }

  function moveParagraphDown(pId, articleId) {
    const arr = doc.body.kind === 'paragraphs'
      ? doc.body.items
      : (doc.body.items.find(x => x.id === articleId)?.paragraphs);
    if (!arr) return;
    const idx = arr.findIndex(p => p.id === pId);
    if (idx >= 0 && idx < arr.length - 1) {
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      if (doc.body.kind === 'paragraphs' || arr.every(p => p.num)) {
        arr.forEach((p, i) => { p.num = `${i + 1} -`; });
      }
      saveDraft();
    }
  }
  function removeParagraph(pId, articleId) {
    if (doc.body.kind === 'paragraphs') {
      doc.body.items = doc.body.items.filter(p => p.id !== pId);
    } else {
      const a = doc.body.items.find(x => x.id === articleId);
      if (a) a.paragraphs = a.paragraphs.filter(p => p.id !== pId);
    }
    saveDraft();
  }
  function updateParagraph(pId, articleId, patch) {
    let p;
    if (doc.body.kind === 'paragraphs') {
      p = doc.body.items.find(x => x.id === pId);
    } else {
      const a = doc.body.items.find(x => x.id === articleId);
      if (a) p = a.paragraphs.find(x => x.id === pId);
    }
    if (p) { Object.assign(p, patch); saveDraft(); }
  }

  function addSubPoint(pId, articleId) {
    const para = findParagraph(pId, articleId);
    if (!para) return;
    if (!para.subPoints) para.subPoints = [];
    const idx = para.subPoints.length;
    const letter = String.fromCharCode(97 + idx);  // a, b, c, ...
    para.subPoints.push({
      id: `${pId}__lit_${letter}`,
      num: `${letter})`,
      content: '',
      subPoints: [],  // subalineas i), ii), iii)
    });
    saveDraft();
  }
  function removeSubPoint(pId, articleId, spId) {
    const para = findParagraph(pId, articleId);
    if (!para) return;
    para.subPoints = para.subPoints.filter(sp => sp.id !== spId);
    saveDraft();
  }
  function updateSubPoint(pId, articleId, spId, patch) {
    const para = findParagraph(pId, articleId);
    if (!para) return;
    const sp = para.subPoints.find(x => x.id === spId);
    if (sp) { Object.assign(sp, patch); saveDraft(); }
  }
  function findParagraph(pId, articleId) {
    if (doc.body.kind === 'paragraphs') return doc.body.items.find(x => x.id === pId);
    const a = doc.body.items.find(x => x.id === articleId);
    return a ? a.paragraphs.find(x => x.id === pId) : null;
  }

  // ---- Subalineas (i), ii), iii)) ------------------------------------------
  function romanLower(n) {
    const vals = ['i','ii','iii','iv','v','vi','vii','viii','ix','x','xi','xii','xiii','xiv','xv'];
    return vals[n - 1] || `r${n}`;
  }
  function addSubSubPoint(pId, articleId, spId) {
    const para = findParagraph(pId, articleId);
    if (!para) return;
    const sp = para.subPoints.find(x => x.id === spId);
    if (!sp) return;
    if (!sp.subPoints) sp.subPoints = [];
    const num = romanLower(sp.subPoints.length + 1);
    sp.subPoints.push({
      id: `${spId}__sublit_${num}`,
      num: `${num})`,
      content: '',
    });
    saveDraft();
  }
  function removeSubSubPoint(pId, articleId, spId, sspId) {
    const para = findParagraph(pId, articleId);
    if (!para) return;
    const sp = para.subPoints.find(x => x.id === spId);
    if (!sp || !sp.subPoints) return;
    sp.subPoints = sp.subPoints.filter(s => s.id !== sspId);
    saveDraft();
  }
  function updateSubSubPoint(pId, articleId, spId, sspId, patch) {
    const para = findParagraph(pId, articleId);
    if (!para) return;
    const sp = para.subPoints.find(x => x.id === spId);
    if (!sp || !sp.subPoints) return;
    const ssp = sp.subPoints.find(s => s.id === sspId);
    if (ssp) { Object.assign(ssp, patch); saveDraft(); }
  }

  function addAttachment() {
    const n = doc.nextAttachmentNum++;
    const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    doc.attachments.push({
      id: `anx_${n}`,
      heading: `Anexo ${romans[n - 1] || n}`,
      subheading: '',
      content: '',
    });
    saveDraft();
  }
  function removeAttachment(id) {
    doc.attachments = doc.attachments.filter(a => a.id !== id);
    saveDraft();
  }
  function updateAttachment(id, patch) {
    const a = doc.attachments.find(x => x.id === id);
    if (a) { Object.assign(a, patch); saveDraft(); }
  }

  function updateSignature(idx, patch) {
    if (doc.signatures[idx]) { Object.assign(doc.signatures[idx], patch); saveDraft(); }
  }

  // -------------------------- Pegada legislativa -------------------------
  function addStep() {
    const n = doc.workflow.length + 1;
    doc.workflow.push({
      id: `step_${n}`,
      refersTo: 'iniciativa',
      date: new Date().toISOString().slice(0, 10),
      source: 'governo',
      description: '',
      inputs: [],
    });
    saveDraft();
  }
  function removeStep(id) {
    doc.workflow = doc.workflow.filter(s => s.id !== id);
    saveDraft();
  }
  function updateStep(id, patch) {
    const s = doc.workflow.find(x => x.id === id);
    if (s) { Object.assign(s, patch); saveDraft(); }
  }
  function addInput(stepId) {
    const step = doc.workflow.find(s => s.id === stepId);
    if (!step) return;
    const idx = step.inputs.length + 1;
    step.inputs.push({
      id: `input_${stepId}_${idx}`,
      date: step.date,
      source: '',
      type: 'contributo-consulta-publica',
      description: '',
    });
    saveDraft();
  }
  function removeInput(stepId, inputId) {
    const step = doc.workflow.find(s => s.id === stepId);
    if (!step) return;
    step.inputs = step.inputs.filter(i => i.id !== inputId);
    saveDraft();
  }
  function updateInput(stepId, inputId, patch) {
    const step = doc.workflow.find(s => s.id === stepId);
    if (!step) return;
    const inp = step.inputs.find(i => i.id === inputId);
    if (inp) { Object.assign(inp, patch); saveDraft(); }
  }

  return {
    init, get, update,
    saveDraft, loadDraft, clearDraft,
    addRecital, removeRecital, updateRecital,
    addArticle, removeArticle, updateArticle,
    insertArticleAt, moveArticleUp, moveArticleDown, reorderArticles,
    // v0.1.2: containers hierárquicos
    addContainer, removeContainer, moveContainerUp, moveContainerDown,
    updateContainer, renumberHierarchy, ensureHierarchicBody,
    addParagraph, removeParagraph, updateParagraph,
    insertParagraphAt, moveParagraphUp, moveParagraphDown,
    addSubPoint, removeSubPoint, updateSubPoint,
    addSubSubPoint, removeSubSubPoint, updateSubSubPoint,
    addAttachment, removeAttachment, updateAttachment,
    updateSignature,
    addStep, removeStep, updateStep,
    addInput, removeInput, updateInput,
    consumeRenumberUndo, hasRenumberUndo,
  };
})();

if (typeof window !== 'undefined') window.State = State;
