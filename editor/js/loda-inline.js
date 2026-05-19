// AKN-PT Editor — LoDA inline (Track Changes word-level no modo alterador)
// EUPL-1.2
//
// Em vez de operar ao nível do ARTIGO completo (replace/revoke/add — modo
// "wholesale" do amendment.js), o modo INLINE permite editar o texto dos
// parágrafos do diploma alvo directamente e gera output AKN-PT com as
// alterações marcadas a nível palavra-por-palavra.
//
// Geração: para cada parágrafo modificado, produz-se um <article> de
// alteração no diploma alterador, contendo no <p> introdutório a frase
// canónica e em seguida `<quotedStructure>` com o novo texto. Como o XSD
// AKN-PT v0.1.0 já valida `<quotedStructure>` (CP6), reaproveitamos a
// infraestrutura existente.
//
// O extra do "inline" é a UI: o utilizador vê os parágrafos do alvo editáveis,
// com diff word-level a mostrar verde/vermelho ao escrever (preview do
// Track Changes). Estado: doc.inlineEdits = { [paraId]: { newContent } }.
//
// API
//   LodaInline.editParagraph(amender, paraEid, newContent)
//   LodaInline.diffPara(originalContent, newContent) → tokens com op
//   LodaInline.toAmendmentArticles(amender) → array de alterations no formato
//     que o Amendment usa, para serem injectadas em amender.amendments antes
//     de chamar Amendment.toAknXml.

const LodaInline = (() => {

  function _findOriginalParagraph(amender, paraEid) {
    const items = amender.target?.state?.body?.items || [];
    for (const a of items) {
      for (const p of (a.paragraphs || [])) {
        if (p.id === paraEid) return { article: a, paragraph: p };
      }
    }
    return null;
  }

  function editParagraph(amender, paraEid, newContent) {
    if (!amender.inlineEdits) amender.inlineEdits = {};
    const orig = _findOriginalParagraph(amender, paraEid);
    if (!orig) return;
    if (newContent === orig.paragraph.content) {
      // sem alteração — remover
      delete amender.inlineEdits[paraEid];
    } else {
      amender.inlineEdits[paraEid] = { newContent, articleId: orig.article.id };
    }
  }

  function clearEdits(amender) {
    amender.inlineEdits = {};
  }

  function listEdits(amender) {
    if (!amender.inlineEdits) return [];
    return Object.entries(amender.inlineEdits).map(([paraId, edit]) => {
      const orig = _findOriginalParagraph(amender, paraId);
      return {
        paraId,
        articleId: edit.articleId,
        originalContent: orig?.paragraph?.content || '',
        newContent: edit.newContent,
        tokens: Diff.words(orig?.paragraph?.content || '', edit.newContent),
      };
    });
  }

  // Renderiza os tokens de diff numa string com markup HTML/Bluebell-like
  function renderTokensHtml(tokens) {
    return tokens.map(t => {
      if (t.op === '=') return _esc(t.text);
      if (t.op === '+') return `<ins>${_esc(t.text)}</ins>`;
      if (t.op === '-') return `<del>${_esc(t.text)}</del>`;
      return _esc(t.text);
    }).join('');
  }
  function _esc(s) {
    const div = document.createElement('div');
    div.textContent = String(s || '');
    return div.innerHTML;
  }

  // Converte edições inline em "amendments" tipo "replace" para que o
  // exporter actual (Amendment.toAknXml) os possa serializar. Cada edição
  // resulta numa alteração ao ARTIGO que contém o parágrafo alvo, com o
  // parágrafo no novo conteúdo.
  function applyToAmendmentList(amender) {
    if (!amender.inlineEdits) return;
    // Agrupar edições por artigo (uma alteração por artigo)
    const byArt = new Map();
    Object.entries(amender.inlineEdits).forEach(([paraId, edit]) => {
      if (!byArt.has(edit.articleId)) byArt.set(edit.articleId, []);
      byArt.get(edit.articleId).push({ paraId, newContent: edit.newContent });
    });
    byArt.forEach((edits, artId) => {
      const orig = (amender.target?.state?.body?.items || []).find(a => a.id === artId);
      if (!orig) return;
      const newArt = JSON.parse(JSON.stringify(orig));
      edits.forEach(({ paraId, newContent }) => {
        const p = newArt.paragraphs.find(x => x.id === paraId);
        if (p) p.content = newContent;
      });
      // verificar se já existe um amendment para este artigo (evita duplicar)
      const existing = (amender.amendments || []).find(a => a.op === 'replace' && a.articleId === artId);
      if (existing) {
        existing.payload.article = newArt;
        existing.fromInline = true;
      } else {
        amender.amendments.push({
          id: `am_inline_${artId}_${Date.now().toString(36)}`,
          op: 'replace',
          articleId: artId,
          payload: { article: newArt },
          fromInline: true,
        });
      }
    });
  }

  // Resumo textual ("3 parágrafos alterados em 2 artigos")
  function summary(amender) {
    const list = listEdits(amender);
    const arts = new Set(list.map(e => e.articleId));
    return list.length
      ? `${list.length} parágrafo(s) alterado(s) em ${arts.size} artigo(s)`
      : 'Sem edições inline';
  }

  return { editParagraph, clearEdits, listEdits, renderTokensHtml, applyToAmendmentList, summary };
})();

if (typeof window !== 'undefined') window.LodaInline = LodaInline;
