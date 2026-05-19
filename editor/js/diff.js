// AKN-PT Editor — algoritmo de diff entre dois documentos
// EUPL-1.2
//
// Estrutura: walk recursivo do doc state (Work/Expression-level, não XML),
// comparando blocos por `eId`/`id`. Cada bloco classifica-se em:
//   - 'added'      (existe só no doc2)
//   - 'removed'    (existe só no doc1)
//   - 'modified'   (existe nos dois mas com diferenças)
//   - 'unchanged'  (igual)
//
// Para conteúdo textual, usa-se um diff word-level baseado em LCS:
//   diffWords(a, b) → [{op: '=', text}, {op: '+', text}, {op: '-', text}, ...]
//
// API:
//   Diff.docs(doc1, doc2)   → árvore estruturada (estatísticas + blocos)
//   Diff.words(a, b)        → tokens classificados
//   Diff.renderHtml(result) → HTML lado-a-lado / inline
//   Diff.summary(result)    → string ("3 artigos adicionados, 1 alterado…")

const Diff = (() => {

  // ----------------------- Word-level diff ---------------------------------

  // Tokenize: palavras + separadores (mantém pontuação como tokens próprios)
  function tokenize(s) {
    if (s == null) return [];
    return String(s).match(/\S+|\s+/g) || [];
  }

  // LCS clássico (matriz). Para textos curtos a O(nm) é aceitável.
  function diffWords(a, b) {
    const A = tokenize(a);
    const B = tokenize(b);
    const m = A.length, n = B.length;
    if (m === 0 && n === 0) return [];
    if (m === 0) return [{ op: '+', text: B.join('') }];
    if (n === 0) return [{ op: '-', text: A.join('') }];

    // tabela LCS
    const dp = Array.from({ length: m + 1 }, () => new Uint32Array(n + 1));
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (A[i - 1] === B[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
        else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
    // backtrack
    const out = [];
    let i = m, j = n;
    while (i > 0 && j > 0) {
      if (A[i - 1] === B[j - 1]) { out.unshift({ op: '=', text: A[i - 1] }); i--; j--; }
      else if (dp[i - 1][j] >= dp[i][j - 1]) { out.unshift({ op: '-', text: A[i - 1] }); i--; }
      else { out.unshift({ op: '+', text: B[j - 1] }); j--; }
    }
    while (i > 0) { out.unshift({ op: '-', text: A[i - 1] }); i--; }
    while (j > 0) { out.unshift({ op: '+', text: B[j - 1] }); j--; }
    // colapsar tokens contíguos com mesma op
    const merged = [];
    out.forEach(t => {
      const last = merged[merged.length - 1];
      if (last && last.op === t.op) last.text += t.text;
      else merged.push({ ...t });
    });
    return merged;
  }

  // ----------------------- Document-level diff -----------------------------

  function _byId(arr) {
    const m = new Map();
    (arr || []).forEach(x => m.set(x.id, x));
    return m;
  }

  function _diffPara(a, b) {
    const changes = [];
    if ((a.num || '') !== (b.num || '')) changes.push({ field: 'num', old: a.num, new: b.num });
    if ((a.content || '') !== (b.content || '')) {
      changes.push({ field: 'content', old: a.content, new: b.content, words: diffWords(a.content, b.content) });
    }
    // subPoints (alíneas)
    const subDiff = _diffArray(a.subPoints || [], b.subPoints || [], _diffPoint);
    if (subDiff.length) changes.push({ field: 'subPoints', changes: subDiff });
    return changes;
  }

  function _diffPoint(a, b) {
    const changes = [];
    if ((a.num || '') !== (b.num || '')) changes.push({ field: 'num', old: a.num, new: b.num });
    if ((a.content || '') !== (b.content || '')) {
      changes.push({ field: 'content', old: a.content, new: b.content, words: diffWords(a.content, b.content) });
    }
    const subDiff = _diffArray(a.subPoints || [], b.subPoints || [], _diffPoint);
    if (subDiff.length) changes.push({ field: 'subPoints', changes: subDiff });
    return changes;
  }

  function _diffArticle(a, b) {
    const changes = [];
    if ((a.num || '') !== (b.num || '')) changes.push({ field: 'num', old: a.num, new: b.num });
    if ((a.heading || '') !== (b.heading || '')) {
      changes.push({ field: 'heading', old: a.heading, new: b.heading, words: diffWords(a.heading, b.heading) });
    }
    const paraDiff = _diffArray(a.paragraphs || [], b.paragraphs || [], _diffPara);
    if (paraDiff.length) changes.push({ field: 'paragraphs', changes: paraDiff });
    return changes;
  }

  function _diffArray(arr1, arr2, fieldDiff) {
    const m1 = _byId(arr1), m2 = _byId(arr2);
    const seen = new Set();
    const out = [];
    arr1.forEach(x => {
      if (m2.has(x.id)) {
        seen.add(x.id);
        const changes = fieldDiff(x, m2.get(x.id));
        if (changes.length) out.push({ id: x.id, status: 'modified', changes, old: x, new: m2.get(x.id) });
      } else {
        out.push({ id: x.id, status: 'removed', old: x });
      }
    });
    arr2.forEach(x => {
      if (!m1.has(x.id) && !seen.has(x.id)) {
        out.push({ id: x.id, status: 'added', new: x });
      }
    });
    return out;
  }

  function docs(doc1, doc2) {
    const result = {
      metadata: {},
      recitals: [],
      body: [],
      attachments: [],
      stats: { added: 0, removed: 0, modified: 0, unchanged: 0 },
    };

    // metadata simples
    ['number','year','shortTitle','subtype','adoptionDate','publicationDate','docDate','docDateText','habilitante','habilitanteLabel','formula','country','actName'].forEach(k => {
      if ((doc1[k] || '') !== (doc2[k] || '')) {
        result.metadata[k] = { old: doc1[k], new: doc2[k] };
        if (k === 'formula' || k === 'shortTitle') {
          result.metadata[k].words = diffWords(doc1[k] || '', doc2[k] || '');
        }
      }
    });

    result.recitals = _diffArray(doc1.recitals || [], doc2.recitals || [], (a, b) =>
      (a.text || '') !== (b.text || '')
        ? [{ field: 'text', old: a.text, new: b.text, words: diffWords(a.text, b.text) }]
        : []
    );

    if (doc1.body.kind !== doc2.body.kind) {
      result.body = [{ status: 'modified', id: 'body', changes: [{ field: 'kind', old: doc1.body.kind, new: doc2.body.kind }] }];
    } else if (doc1.body.kind === 'articles') {
      result.body = _diffArray(doc1.body.items || [], doc2.body.items || [], _diffArticle);
    } else {
      result.body = _diffArray(doc1.body.items || [], doc2.body.items || [], _diffPara);
    }

    result.attachments = _diffArray(doc1.attachments || [], doc2.attachments || [], (a, b) => {
      const c = [];
      if ((a.heading || '') !== (b.heading || '')) c.push({ field: 'heading', old: a.heading, new: b.heading });
      if ((a.content || '') !== (b.content || '')) c.push({ field: 'content', old: a.content, new: b.content, words: diffWords(a.content, b.content) });
      return c;
    });

    [...result.recitals, ...result.body, ...result.attachments].forEach(b => {
      result.stats[b.status]++;
    });
    if (Object.keys(result.metadata).length) result.stats.modified++;
    return result;
  }

  function summary(result) {
    const s = result.stats;
    const parts = [];
    if (s.added) parts.push(`${s.added} adicionado(s)`);
    if (s.removed) parts.push(`${s.removed} removido(s)`);
    if (s.modified) parts.push(`${s.modified} alterado(s)`);
    if (Object.keys(result.metadata).length) parts.push(`metadados`);
    return parts.length ? parts.join(' · ') : 'Sem alterações';
  }

  // ----------------------- HTML rendering ----------------------------------

  function esc(s) {
    const div = document.createElement('div');
    div.textContent = String(s == null ? '' : s);
    return div.innerHTML;
  }

  function renderWords(tokens) {
    if (!tokens || !tokens.length) return '';
    return tokens.map(t => {
      if (t.op === '=') return esc(t.text);
      if (t.op === '+') return `<ins>${esc(t.text)}</ins>`;
      if (t.op === '-') return `<del>${esc(t.text)}</del>`;
      return esc(t.text);
    }).join('');
  }

  function renderBlock(b) {
    const cls = `diff-block diff-${b.status}`;
    const label = b.id || '';
    let body = '';
    if (b.status === 'added') {
      body = `<div class="diff-side diff-new">${renderEntity(b.new)}</div>`;
    } else if (b.status === 'removed') {
      body = `<div class="diff-side diff-old">${renderEntity(b.old)}</div>`;
    } else if (b.status === 'modified') {
      body = (b.changes || []).map(c => renderChange(c)).join('');
    }
    return `<div class="${cls}"><div class="diff-block-label">${esc(label)} <span class="diff-status">${b.status}</span></div>${body}</div>`;
  }

  function renderEntity(o) {
    if (!o) return '';
    if (o.heading !== undefined) return `<strong>${esc(o.num || '')}</strong> ${esc(o.heading || '')}`;
    if (o.text !== undefined) return esc(o.text);
    if (o.content !== undefined) return `${esc(o.num || '')} ${esc(o.content || '')}`;
    return esc(JSON.stringify(o));
  }

  function renderChange(c) {
    if (c.field === 'subPoints' || c.field === 'paragraphs') {
      const inner = (c.changes || []).map(renderBlock).join('');
      return `<div class="diff-nested"><div class="diff-field-name">${esc(c.field)}</div>${inner}</div>`;
    }
    if (c.words) {
      return `<div class="diff-change"><span class="diff-field-name">${esc(c.field)}</span><div class="diff-text">${renderWords(c.words)}</div></div>`;
    }
    return `<div class="diff-change"><span class="diff-field-name">${esc(c.field)}</span><div class="diff-text"><del>${esc(c.old)}</del> → <ins>${esc(c.new)}</ins></div></div>`;
  }

  function renderHtml(result) {
    const out = [];
    out.push(`<div class="diff-summary">${esc(summary(result))}</div>`);

    if (Object.keys(result.metadata).length) {
      out.push(`<h3 class="diff-section">Metadados</h3>`);
      Object.entries(result.metadata).forEach(([k, v]) => {
        out.push(renderChange({ field: k, old: v.old, new: v.new, words: v.words }));
      });
    }
    if (result.recitals.length) {
      out.push(`<h3 class="diff-section">Considerandos</h3>`);
      out.push(result.recitals.map(renderBlock).join(''));
    }
    if (result.body.length) {
      out.push(`<h3 class="diff-section">Articulado / Pontos</h3>`);
      out.push(result.body.map(renderBlock).join(''));
    }
    if (result.attachments.length) {
      out.push(`<h3 class="diff-section">Anexos</h3>`);
      out.push(result.attachments.map(renderBlock).join(''));
    }
    if (out.length === 1) out.push(`<p class="diff-empty">Os dois documentos são equivalentes.</p>`);
    return out.join('\n');
  }

  return { docs, words: diffWords, renderHtml, summary };
})();

if (typeof window !== "undefined") window.Diff = Diff;
