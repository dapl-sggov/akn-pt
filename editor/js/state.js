// AKN-PT Editor — State management + persistence
// EUPL-1.2

const STORAGE_KEY = 'akn-pt-editor-draft-v1';
const State = (() => {
  let doc = null;

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
    renumberArticles();
    saveDraft();
  }

  function moveArticleUp(articleId) {
    if (doc.body.kind !== 'articles') return;
    const idx = doc.body.items.findIndex(a => a.id === articleId);
    if (idx > 0) {
      [doc.body.items[idx - 1], doc.body.items[idx]] =
        [doc.body.items[idx], doc.body.items[idx - 1]];
      renumberArticles();
      saveDraft();
    }
  }

  function moveArticleDown(articleId) {
    if (doc.body.kind !== 'articles') return;
    const idx = doc.body.items.findIndex(a => a.id === articleId);
    if (idx >= 0 && idx < doc.body.items.length - 1) {
      [doc.body.items[idx], doc.body.items[idx + 1]] =
        [doc.body.items[idx + 1], doc.body.items[idx]];
      renumberArticles();
      saveDraft();
    }
  }

  // Renumera todos os artigos com base na posicao actual:
  //  - <num> visivel: "Artigo 1.º", "Artigo 2.º", ...  (apenas se o num
  //    actual seguir o padrao standard; "Artigo 5.º-A" preserva-se)
  //  - eId: art_1, art_2, ... (e propagado a todos os ids descendentes)
  function renumberArticles() {
    if (doc.body.kind !== 'articles') return;
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
  }

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
    if (doc.body.kind !== 'articles') return;
    doc.body.items = doc.body.items.filter(a => a.id !== id);
    saveDraft();
  }
  function updateArticle(id, patch) {
    const a = doc.body.items.find(x => x.id === id);
    if (a) { Object.assign(a, patch); saveDraft(); }
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
    insertArticleAt, moveArticleUp, moveArticleDown,
    addParagraph, removeParagraph, updateParagraph,
    insertParagraphAt, moveParagraphUp, moveParagraphDown,
    addSubPoint, removeSubPoint, updateSubPoint,
    addSubSubPoint, removeSubSubPoint, updateSubSubPoint,
    addAttachment, removeAttachment, updateAttachment,
    updateSignature,
    addStep, removeStep, updateStep,
    addInput, removeInput, updateInput,
  };
})();

if (typeof window !== 'undefined') window.State = State;
