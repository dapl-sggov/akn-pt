// AKN-PT Editor — Renumber cascading (LEOS-style)
// EUPL-1.2
//
// Quando o utilizador move/insere/remove artigos, o `State.renumberArticles()`
// já reescreve os eIds estruturais (art_3 → art_5) e propaga aos descendentes
// via `_renameArticleSubtree`. Este módulo complementa esse comportamento com
// três re-anchors que o LEOS faz automaticamente e o AKN-PT em v0.1.0 ainda
// não fazia:
//
//   (a) Referências cruzadas em TEXTO LIVRE: "ver artigo 3.º" passa a "ver
//       artigo 5.º" quando o artigo a que se refere muda de posição. Sem
//       isto, o `<ref href="#art_3">` gerado pelo exporter fica órfão.
//
//   (b) Comentários ancorados em eId: `comment.eId === 'art_3__para_2'` é
//       re-anchorado para `art_5__para_2` quando o artigo desce.
//
//   (c) Amendments (no modo alterador): `amendment.articleId` e `paraId`
//       são re-anchorados, idem para `inlineEdits` (chaves e `edit.articleId`).
//
// Algoritmo (chamado por State.renumberArticles):
//   1) ANTES da mutação estrutural — `buildMap(doc)` calcula
//      Map<oldEId, newEId> e Map<oldNum, newNum> com base na posição actual
//      do array vs. nova posição (1-indexed).
//   2) ANTES da mutação — `captureRefs(doc, map)` percorre todos os campos
//      de texto e regista as refs internas que são afectadas. Usa
//      `References.findAll` que valida contra o estado actual (pré-rename).
//   3) ANTES da mutação — `applyCapturedRewrites(captures, map)` aplica
//      splicing no texto, substituindo apenas o segmento "artigo N" dentro
//      do match (preserva "n.º 2 do" e tudo o resto). Mutate-in-place sobre
//      os mesmos objectos que `_renameArticleSubtree` vai depois clonar via
//      spread — o conteúdo já vai com a substituição embutida.
//   4) ANTES da mutação — re-anchorar comments + amendments via _remapEid.
//   5) A seguir, o caller faz a mutação estrutural normal.
//
// As substituições nunca tocam refs externas (CC, lei habilitante, etc.),
// porque `References.findAll` já as classifica e o filtro abaixo só aceita
// `href.startsWith('#')`.

const Renumber = (() => {

  // Devolve { byEid: Map<oldEid,newEid>, byVisibleNum: Map<oldNum,newNum> }.
  // Apenas inclui entries onde houve REAL mudança de posição. Items com eId
  // não-canónico (e.g. `__tmp_*`, inserção pendente) são ignorados.
  function buildMap(doc) {
    if (!doc || !doc.body || doc.body.kind !== 'articles') return null;
    const items = doc.body.items || [];
    const byEid = new Map();
    const byVisibleNum = new Map();
    items.forEach((a, i) => {
      if (!a || !a.id) return;
      const m = a.id.match(/^art_(\d+)$/);
      if (!m) return;
      const oldNum = parseInt(m[1], 10);
      const newNum = i + 1;
      if (oldNum !== newNum) {
        byEid.set(a.id, `art_${newNum}`);
        byVisibleNum.set(oldNum, newNum);
      }
    });
    return { byEid, byVisibleNum };
  }

  // Para cada text-field do doc, captura refs internas afectadas pelo map.
  // Devolve [{ obj, field, refs: [{start, end, raw, oldNum}], where }].
  // Pré-condição: ser chamado ANTES de qualquer mutação estrutural.
  function captureRefs(doc, map) {
    if (!doc || !map || map.byVisibleNum.size === 0) return [];
    if (typeof References === 'undefined') return [];
    const out = [];
    const visit = (obj, field, where) => {
      if (!obj) return;
      const t = obj[field];
      if (!t) return;
      const refs = References.findAll(t, doc);
      if (!refs.length) return;
      const filtered = [];
      refs.forEach(r => {
        if (!r.href || !r.href.startsWith('#')) return;
        const m = r.href.match(/^#art_(\d+)/);
        if (!m) return;
        const oldNum = parseInt(m[1], 10);
        if (!map.byVisibleNum.has(oldNum)) return;
        filtered.push({ start: r.start, end: r.end, raw: r.raw, oldNum });
      });
      if (filtered.length) out.push({ obj, field, refs: filtered, where });
    };
    (doc.recitals || []).forEach((r, i) => visit(r, 'text', `Considerando ${i + 1}`));
    if ('formula' in doc) visit(doc, 'formula', 'Fórmula');
    if ('shortTitle' in doc) visit(doc, 'shortTitle', 'Ementa');
    if (doc.body && doc.body.kind === 'articles') {
      (doc.body.items || []).forEach(a => {
        visit(a, 'heading', `${a.num || a.id} (epígrafe)`);
        (a.paragraphs || []).forEach(p => {
          visit(p, 'content', `${a.num || a.id} ${p.num || ''}`.trim());
          (p.subPoints || []).forEach(sp => {
            visit(sp, 'content', `${a.num || a.id} ${p.num || ''} ${sp.num}`.trim());
            (sp.subPoints || []).forEach(ssp =>
              visit(ssp, 'content', `${a.num || a.id} ${p.num || ''} ${sp.num} ${ssp.num}`.trim()));
          });
        });
      });
    } else if (doc.body) {
      (doc.body.items || []).forEach(p => {
        visit(p, 'content', p.num || p.id);
        (p.subPoints || []).forEach(sp => visit(sp, 'content', `${p.num || p.id} ${sp.num}`.trim()));
      });
    }
    (doc.attachments || []).forEach((at, i) => visit(at, 'content', `Anexo ${at.heading || (i + 1)}`));
    return out;
  }

  // Aplica os rewrites capturados. Substitui apenas a porção "artigo N"
  // dentro de cada raw, preservando o resto do match (e.g. "n.º 2 do artigo
  // 3.º" → "n.º 2 do artigo 5.º"). Aplica de trás para a frente em cada
  // field para preservar offsets.
  function applyCapturedRewrites(captures, map) {
    let count = 0;
    (captures || []).forEach(cap => {
      const refs = cap.refs.slice().sort((a, b) => b.start - a.start);
      let t = cap.obj[cap.field];
      refs.forEach(r => {
        const newNum = map.byVisibleNum.get(r.oldNum);
        if (newNum == null) return;
        const newRaw = r.raw.replace(/(\bartigo\s+)(\d+)/i, (_, p1) => `${p1}${newNum}`);
        if (newRaw === r.raw) return;
        t = t.slice(0, r.start) + newRaw + t.slice(r.end);
        count++;
      });
      cap.obj[cap.field] = t;
    });
    return count;
  }

  // Re-anchor de qualquer eId que comece por `art_N`. Preserva o sufixo
  // (e.g. `art_3__para_2__lit_a`).
  function remapEid(eId, map) {
    if (!eId || !map) return eId;
    const m = eId.match(/^art_(\d+)((?:__|$).*)$/);
    if (!m) return eId;
    const oldNum = parseInt(m[1], 10);
    if (!map.byVisibleNum.has(oldNum)) return eId;
    return `art_${map.byVisibleNum.get(oldNum)}${m[2] || ''}`;
  }

  // Re-anchora todos os comentários cujo eId começa por `art_N`.
  // Devolve número de remaps efectivos.
  function remapComments(doc, map) {
    if (!doc || !doc.comments) return 0;
    let n = 0;
    doc.comments.forEach(c => {
      const newEid = remapEid(c.eId, map);
      if (newEid !== c.eId) { c.eId = newEid; n++; }
    });
    return n;
  }

  // Re-anchora amendments + inlineEdits no modo alterador. Esta função NÃO
  // é normalmente útil quando o `doc` é o próprio rascunho a ser editado;
  // serve para o caso de `doc.kind === 'amender'` em que se permite editar
  // a estrutura do alvo.
  function remapAmendments(doc, map) {
    if (!doc) return 0;
    let n = 0;
    (doc.amendments || []).forEach(am => {
      const newId = remapEid(am.articleId, map);
      if (newId !== am.articleId) { am.articleId = newId; n++; }
      if (am.paraId) {
        const np = remapEid(am.paraId, map);
        if (np !== am.paraId) { am.paraId = np; n++; }
      }
      if (am.subPointId) {
        const ns = remapEid(am.subPointId, map);
        if (ns !== am.subPointId) { am.subPointId = ns; n++; }
      }
    });
    if (doc.inlineEdits) {
      const newEdits = {};
      Object.entries(doc.inlineEdits).forEach(([paraId, edit]) => {
        const newPid = remapEid(paraId, map);
        const newEdit = edit ? Object.assign({}, edit) : edit;
        if (newEdit && newEdit.articleId) {
          const newAid = remapEid(newEdit.articleId, map);
          if (newAid !== newEdit.articleId) { newEdit.articleId = newAid; n++; }
        }
        newEdits[newPid] = newEdit;
        if (newPid !== paraId) n++;
      });
      doc.inlineEdits = newEdits;
    }
    return n;
  }

  // Helper de alto nível: chamado por State.renumberArticles ANTES da mutação
  // estrutural. Executa os 4 passos (capture+rewrite text, remap comments,
  // remap amendments). Devolve sumário para UI.
  function prepareRenumber(doc) {
    const map = buildMap(doc);
    if (!map || map.byVisibleNum.size === 0) {
      return { map: null, textRewrites: 0, commentsRemapped: 0, amendmentsRemapped: 0 };
    }
    const captures = captureRefs(doc, map);
    const textRewrites = applyCapturedRewrites(captures, map);
    const commentsRemapped = remapComments(doc, map);
    const amendmentsRemapped = remapAmendments(doc, map);
    return { map, textRewrites, commentsRemapped, amendmentsRemapped };
  }

  return {
    buildMap,
    captureRefs,
    applyCapturedRewrites,
    remapEid,
    remapComments,
    remapAmendments,
    prepareRenumber,
  };
})();

if (typeof window !== 'undefined') window.Renumber = Renumber;
