// AKN-PT Editor — main editor logic
// EUPL-1.2

const Editor = (() => {

  // ----- Helpers ----------------------------------------------------------
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const el = (tag, attrs, ...children) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'class') e.className = v;
      else if (k === 'on') for (const [evt, fn] of Object.entries(v)) e.addEventListener(evt, fn);
      else if (k === 'html') e.innerHTML = v;
      else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v);
    }
    children.flat().forEach(c => {
      if (c == null) return;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  };

  // ------------------------------------------------------------------------
  // Suggestions — captura de selecção em textareas + popover para criar/rever
  // ------------------------------------------------------------------------
  // O estado da selecção activa é guardado num único slot global; cada
  // textarea bind a um listener mouseup/keyup que actualiza este slot.
  // O botão "Sugerir" lê este slot para pre-popular o modal.
  let _activeSelection = null;  // { eId, field, start, end, text }

  function _captureSelection(textarea, eId, field) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value || '';
    _activeSelection = (start !== end)
      ? { eId, field, start, end, text: value.slice(start, end) }
      : null;
  }

  // Helper para anexar selection-capture a um textarea/input. Aplicado a
  // .article-heading, .paragraph-content, .recital-content, .point-content,
  // .subpoint-content (cf. renderArticle / renderParagraph / renderRecitalEditor).
  function _bindSelectionCapture(el, eId, field) {
    if (!el) return;
    const upd = () => _captureSelection(el, eId, field);
    el.addEventListener('mouseup', upd);
    el.addEventListener('keyup', upd);
    el.addEventListener('select', upd);
    el.addEventListener('blur', () => { /* não limpa: outras UIs podem ler */ });
  }

  function toast(msg, kind = '') {
    const t = $('#toast');
    t.textContent = msg;
    t.className = `toast ${kind}`;
    setTimeout(() => t.classList.add('hidden'), 3000);
  }

  // Toast com botão de acção (ex.: "Anular"). Persiste durante `ms` (default 5s)
  // a menos que o utilizador clique no botão. Usa o mesmo nó #toast da UI.
  let _toastActionTimer = null;
  function toastAction(msg, actionLabel, actionFn, ms = 5000) {
    const t = $('#toast');
    if (_toastActionTimer) { clearTimeout(_toastActionTimer); _toastActionTimer = null; }
    t.innerHTML = '';
    t.className = 'toast toast-action';
    const span = document.createElement('span');
    span.className = 'toast-msg';
    span.textContent = msg;
    const btn = document.createElement('button');
    btn.className = 'toast-action-btn';
    btn.type = 'button';
    btn.textContent = actionLabel;
    btn.addEventListener('click', () => {
      try { actionFn(); } finally {
        t.classList.add('hidden');
        if (_toastActionTimer) clearTimeout(_toastActionTimer);
      }
    });
    t.appendChild(span);
    t.appendChild(btn);
    _toastActionTimer = setTimeout(() => t.classList.add('hidden'), ms);
  }

  // Mostra o toast de "Refs reescritas — anular" depois de um renumber
  // cascading. Lê o sumário do doc (State.renumberArticles já o preencheu)
  // e o snapshot de undo (in-memory em State). Consume-os de forma a não
  // disparar duas vezes para a mesma operação.
  function _maybeShowRenumberToast(doc) {
    if (!doc || !doc._lastRenumberSummary) return;
    if (!State.hasRenumberUndo()) {
      // Já foi consumido por outra UI — limpa o flag e sai.
      delete doc._lastRenumberSummary;
      return;
    }
    const s = doc._lastRenumberSummary;
    const parts = [];
    if (s.textRewrites)        parts.push(`${s.textRewrites} ref(s) actualizada(s)`);
    if (s.commentsRemapped)    parts.push(`${s.commentsRemapped} coment(s) re-anchorado(s)`);
    if (s.amendmentsRemapped)  parts.push(`${s.amendmentsRemapped} alteraç(s) re-anchorada(s)`);
    const msg = parts.join(' · ') || 'Renumeração aplicada';
    toastAction(msg, 'Anular', () => {
      const undo = State.consumeRenumberUndo();
      if (!undo) { toast('Não há rascunho para restaurar.', 'error'); return; }
      State.init(undo); State.saveDraft();
      refresh();
      toast('Renumeração anulada.', 'success');
    });
    // Limpar o flag — uma single-shot por op.
    delete doc._lastRenumberSummary;
  }

  // ----- Screen switching --------------------------------------------------
  function showScreen(id) {
    $$('.screen').forEach(s => s.classList.remove('active'));
    $('#' + id).classList.add('active');
  }

  // ----- Landing: type chooser --------------------------------------------
  function renderLanding() {
    const grid = $('#type-grid');
    grid.innerHTML = '';
    ACT_TYPES.forEach(t => {
      const card = el('button', {
        class: 'type-card',
        on: { click: () => startNew(t.id) },
      },
        el('span', { class: `badge-cov ${t.coverage}` },
          t.coverage === 'full' ? 'Cobertura completa' : 'Skeleton'),
        el('h3', { class: 'card-title' }, t.name),
        el('p', { class: 'card-subtitle' }, t.subtitle),
        el('p', { class: 'card-desc' }, t.desc),
      );
      grid.appendChild(card);
    });
  }

  function startNew(typeId) {
    const doc = newDocument(typeId);
    State.init(doc);
    // Cria slot novo na pilha — não sobrescreve drafts anteriores.
    if (typeof Stack !== 'undefined') Stack.add(doc);
    State.saveDraft();
    if (typeof Activity !== 'undefined') Activity.log('import', { summary: `Novo ${typeId}` });
    showScreen('editor');
    refresh();
  }

  // ----- Editor UI --------------------------------------------------------
  function refresh() {
    const doc = State.get();
    if (!doc) return;
    renderTopbar(doc);
    // Pilha multi-doc (substitui o TOC sidebar antigo)
    if ($('#stack-list')) renderStack();
    // TOC continua acessível via $('#toc-nav') para back-compat; só renderiza
    // se o elemento ainda existir (vai sair quando o redesign for total).
    if ($('#toc-nav')) renderToc(doc);
    // Breadcrumb no topo do canvas (substitui o TOC sidebar como navegação)
    if ($('#breadcrumb')) renderBreadcrumb(doc);
    // Em modo "alterador" o painel central é diferente.
    if (doc.kind === 'amender') {
      _maybeRenderAmenderBody(doc);
    } else {
      renderBody(doc);
    }
    renderMetadataTab(doc);
    renderFootprintTab(doc);
    renderRefsTab(doc);
    renderDreSection(doc);
    renderCommentsTab(doc);
    renderAiTab(doc);
    renderXmlTab(doc);
    renderValidationTab(doc);
    renderTabBadges(doc);
    // Régua de actividade unificada (substitui as 4 tabs)
    if ($('#activity-feed')) renderActivity(doc);
    // Marcar elementos com erro/aviso directamente no canvas (sublinhados)
    _applyInlineValidation(doc);
    // Persistir no slot da pilha (não cria spam — Stack faz merge)
    if (typeof Stack !== 'undefined') Stack.persistActive();
    // Renumber cascading: mostrar toast com "anular" depois de uma operação
    // que produziu rewrites de refs / re-anchors. Idempotente: o sumário é
    // limpo após o primeiro disparo.
    _maybeShowRenumberToast(doc);
    // Mostrar/esconder opcoes de export do alterador
    const isAmender = doc.kind === 'amender';
    const a = $('#export-amender-xml'); if (a) a.hidden = !isAmender;
    const c = $('#export-consolidated-xml'); if (c) c.hidden = !isAmender;
    // Auto-size das textareas .autosize
    _autosizeAll();
  }

  function renderTopbar(doc) {
    const type = ACT_TYPES.find(t => t.id === doc.actName);
    $('#bar-doctype').textContent = type.name;
    $('#bar-subtitle').textContent = doc.number ? `n.º ${doc.number}/${doc.year}` : 'sem número';

    const issues = Validation.check(doc);
    const b = Validation.badge(issues);
    const badge = $('#validation-badge');
    badge.className = `badge ${b.cls}`;
    badge.textContent = b.text;
  }

  function renderToc(doc) {
    const nav = $('#toc-nav');
    nav.innerHTML = '';

    const sections = [];
    if (doc.recitals.length) {
      const items = doc.recitals.map((r, i) =>
        el('a', { class: 'toc-item', href: '#' + r.id }, `Considerando ${i + 1}`)
      );
      sections.push(['Preâmbulo', items]);
    }

    if (doc.body.kind === 'articles') {
      const items = doc.body.items.map(a =>
        el('a', { class: 'toc-item', href: '#' + a.id },
          a.num + (a.heading ? ' — ' + a.heading : ''))
      );
      sections.push(['Articulado', items]);
    } else {
      const items = doc.body.items.map(p =>
        el('a', { class: 'toc-item', href: '#' + p.id },
          `Ponto ${p.num.replace(/[^0-9]/g, '')}`)
      );
      sections.push(['Pontos resolutivos', items]);
    }

    if (doc.attachments.length) {
      const items = doc.attachments.map(a =>
        el('a', { class: 'toc-item', href: '#' + a.id }, a.heading)
      );
      sections.push(['Anexos', items]);
    }

    if (doc.workflow.length) {
      const items = [el('span', { class: 'toc-item' },
        `${doc.workflow.length} step(s) registado(s)`)];
      sections.push(['Pegada legislativa', items]);
    }

    sections.forEach(([title, items]) => {
      const sec = el('div', { class: 'toc-section' },
        el('h4', { class: 'toc-section-title' }, title),
        ...items
      );
      nav.appendChild(sec);
    });
  }

  function renderBody(doc) {
    const main = $('#document-body');
    main.innerHTML = '';

    // Preface
    const preface = el('div', { class: 'preface-block' });
    const type = ACT_TYPES.find(t => t.id === doc.actName);
    preface.appendChild(el('div', { class: 'doctype' }, type.name));
    const suffix = doc.country === 'pt-20' ? '/A' : doc.country === 'pt-30' ? '/M' : '';
    preface.appendChild(el('div', { class: 'docnumber' },
      `n.º `,
      el('input', { type: 'text', value: doc.number || '', placeholder: 'XXX',
        style: 'width:4em; display:inline-block;',
        on: { input: e => State.update({ number: e.target.value }) }
      }),
      `/${doc.year}${suffix}`
    ));
    preface.appendChild(el('div', { class: 'docdate' },
      el('input', { type: 'date', value: doc.docDate || '',
        style: 'width:auto; display:inline-block;',
        on: { input: e => State.update({ docDate: e.target.value }) }
      })
    ));
    preface.appendChild(el('div', { class: 'shorttitle' },
      el('input', { type: 'text', value: doc.shortTitle || '',
        placeholder: 'Sumário — uma frase a descrever o que o diploma faz (opcional)',
        title: 'Frase única, normalmente 1-2 linhas, que aparece no DRE como sumário. Muitos diplomas (Portarias, alguns Despachos) não têm; pode deixar vazio e usar o texto do Artigo 1.º como sumário implícito.',
        style: 'width: 100%;',
        on: { input: e => State.update({ shortTitle: e.target.value }) }
      })
    ));
    main.appendChild(preface);

    // Recitals
    if (doc.recitals.length || doc.formula) {
      const preamble = el('div', { class: 'doc-block' });
      preamble.appendChild(el('div', { class: 'block-header' },
        el('span', { class: 'block-label' }, 'Preâmbulo')
      ));
      doc.recitals.forEach((r, i) => {
        preamble.appendChild(el('div', { class: 'recital-block', id: r.id },
          el('div', { class: 'block-header' },
            el('span', { class: 'block-label' }, `Considerando ${i + 1} (${r.id})`),
            el('div', { class: 'block-actions' },
              el('button', { on: { click: () => { State.removeRecital(r.id); refresh(); } } }, '× remover')
            )
          ),
          el('textarea', {
            value: r.text,
            on: { input: e => State.updateRecital(r.id, e.target.value) },
          }, r.text)
        ));
      });
      preamble.appendChild(el('div', { class: 'formula-block' },
        el('div', { class: 'block-label' }, 'Fórmula promulgatória / dispositiva'),
        el('textarea', {
          value: doc.formula,
          on: { input: e => State.update({ formula: e.target.value }) },
        }, doc.formula)
      ));
      main.appendChild(preamble);
    }

    // Body
    const bodyContainer = el('div', { class: 'doc-block' });
    const bodyHeaderActions = doc.body.kind === 'articles' || doc.body.kind === 'hierarchic'
      ? el('div', { class: 'block-actions' },
          el('button', { class: 'btn-small',
            title: 'Promover articulado a estrutura hierárquica + adicionar capítulo',
            on: { click: () => { State.addContainer('chapter'); refresh(); } }
          }, '+ capítulo'))
      : null;
    bodyContainer.appendChild(el('div', { class: 'block-header' },
      el('span', { class: 'block-label' },
        doc.body.kind === 'articles' ? 'Articulado'
        : doc.body.kind === 'hierarchic' ? 'Articulado (hierárquico)'
        : 'Pontos resolutivos'),
      bodyHeaderActions,
    ));

    if (doc.body.kind === 'articles') {
      // Botão "+ artigo no início" antes do primeiro
      bodyContainer.appendChild(renderInsertHere(() => {
        State.insertArticleAt(null); refresh();
      }, '+ artigo no início'));
      doc.body.items.forEach(a => bodyContainer.appendChild(renderArticle(a, doc)));
    } else if (doc.body.kind === 'hierarchic') {
      doc.body.items.forEach(item => bodyContainer.appendChild(_renderBodyItemHierarchic(item, doc, 0)));
    } else {
      bodyContainer.appendChild(renderInsertHere(() => {
        State.insertParagraphAt(null, null); refresh();
      }, '+ ponto no início'));
      doc.body.items.forEach(p => {
        bodyContainer.appendChild(renderParagraph(p, null, doc));
        bodyContainer.appendChild(renderInsertHere(() => {
          State.insertParagraphAt(null, p.id); refresh();
        }, '+ ponto abaixo'));
      });
    }
    main.appendChild(bodyContainer);

    // Conclusions (signatures)
    if (doc.signatures.length) {
      const concl = el('div', { class: 'conclusions-section' });
      concl.appendChild(el('div', { class: 'block-header' },
        el('span', { class: 'block-label' }, 'Conclusões / Assinaturas')
      ));
      doc.signatures.forEach((s, i) => {
        concl.appendChild(el('div', { class: 'signature-block' },
          el('select', { title: 'Papel da assinatura',
            on: { change: e => State.updateSignature(i, { role: e.target.value }) }
          },
            ...['signature', 'countersignature', 'promulgation'].map(r =>
              el('option', { value: r, ...(r === s.role ? { selected: true } : {}) }, r)
            )
          ),
          // Título completo do cargo (e.g. "Ministro de Estado e das Finanças")
          el('input', { type: 'text', value: s.title || '',
            placeholder: 'Cargo (ex. Ministro de Estado e das Finanças)',
            title: 'Cargo completo, mostrado como showAs no <TLCRole>',
            on: { input: e => State.updateSignature(i, { title: e.target.value }) }
          }),
          // Nome do signatário
          el('input', { type: 'text', value: s.name || '',
            placeholder: 'Nome (ex. António Leitão Amaro)',
            title: 'Nome do signatário, mostrado como showAs no <TLCPerson>',
            on: { input: e => State.updateSignature(i, { name: e.target.value }) }
          }),
          // eId interno (gerado automaticamente, mas editável)
          el('input', { type: 'text', value: s.as || '',
            placeholder: 'eId (auto)',
            title: 'eId do papel — usualmente gerado a partir do cargo',
            style: 'font-family:var(--font-mono);font-size:0.8em;flex:0 0 200px',
            on: { input: e => State.updateSignature(i, { as: e.target.value }) }
          }),
        ));
      });
      main.appendChild(concl);
    }

    // Attachments
    doc.attachments.forEach(a => {
      main.appendChild(el('div', { class: 'attachment-block', id: a.id },
        el('div', { class: 'block-header' },
          el('span', { class: 'block-label' }, `Anexo (${a.id})`),
          el('div', { class: 'block-actions' },
            el('button', { on: { click: () => { State.removeAttachment(a.id); refresh(); } } }, '× remover')
          )
        ),
        el('input', { type: 'text', value: a.heading, placeholder: 'Anexo I',
          on: { input: e => State.updateAttachment(a.id, { heading: e.target.value }) }
        }),
        el('input', { type: 'text', value: a.subheading || '', placeholder: 'Subtítulo opcional',
          on: { input: e => State.updateAttachment(a.id, { subheading: e.target.value }) }
        }),
        el('textarea', {
          value: a.content || '',
          placeholder: 'Conteúdo do anexo',
          on: { input: e => State.updateAttachment(a.id, { content: e.target.value }) }
        }, a.content || '')
      ));
    });
  }

  // Helper: thin button to insert a new item at a position (between blocks).
  function renderInsertHere(onClick, label) {
    return el('div', { class: 'insert-here' },
      el('button', { class: 'btn-insert', on: { click: onClick } }, label)
    );
  }

  // Conjunto de container types AKN — partilhado entre renderers para
  // distinguir Container de Article em body.kind='hierarchic'.
  const _CONTAINER_TYPES_UI = new Set(['book', 'part', 'title', 'chapter', 'section', 'subsection']);

  // Render recursivo de um item do body hierárquico — Container ou Article.
  // v0.1.2: containers ganham botões de edição: heading editável, botões
  // mover ↑↓, remover, e adicionar sub-container do tipo seguinte na
  // hierarquia. Articles folha usam renderArticle normal.
  //
  // Vocabulário de sub-tipos por contexto (PT): dentro de um capítulo pode
  // adicionar-se uma secção; dentro de uma secção, subsecção. O book/part/
  // title support fica para uso direto via API por agora.
  const _SUBCONTAINER_FOR = {
    book: 'part', part: 'title', title: 'chapter',
    chapter: 'section', section: 'subsection',
  };

  function _renderBodyItemHierarchic(item, doc, depth) {
    if (item && _CONTAINER_TYPES_UI.has(item.containerType)) {
      const wrapper = el('div', { class: `container-block container-${item.containerType}`,
        id: item.id,
        style: `margin-left: ${depth * 12}px; border-left: 2px solid var(--color-navy-soft); padding-left: 12px; margin-top: 12px;`,
      });
      const subType = _SUBCONTAINER_FOR[item.containerType];
      const actions = el('div', { class: 'block-actions container-actions' },
        el('button', { class: 'btn-move btn-small', title: 'Mover para cima',
          on: { click: () => { State.moveContainerUp(item.id); refresh(); } } }, '↑'),
        el('button', { class: 'btn-move btn-small', title: 'Mover para baixo',
          on: { click: () => { State.moveContainerDown(item.id); refresh(); } } }, '↓'),
        subType ? el('button', { class: 'btn-small',
          title: `Adicionar ${subType} dentro deste ${item.containerType}`,
          on: { click: () => { State.addContainer(subType, { parentEId: item.id }); refresh(); } }
        }, `+ ${subType}`) : null,
        el('button', { class: 'btn-small btn-danger',
          title: 'Remover container (filhos sobem para o nível superior)',
          on: { click: () => {
            if (!confirm(`Remover ${item.num || item.containerType}? Os artigos/sub-secções sobem para o nível superior.`)) return;
            State.removeContainer(item.id, { keepChildren: true }); refresh();
          }} }, '× remover'),
      );
      wrapper.appendChild(el('div', { class: 'container-head' },
        el('div', { class: 'container-head-row' },
          el('span', { class: 'container-type-label' }, item.containerType),
          el('strong', { class: 'container-num' }, item.num || ''),
          actions,
        ),
        el('input', {
          type: 'text', class: 'container-heading', value: item.heading || '',
          placeholder: 'Epígrafe (ex.: Disposições gerais)',
          on: { input: e => { State.updateContainer(item.id, { heading: e.target.value }); }},
        }),
      ));
      (item.items || []).forEach(child =>
        wrapper.appendChild(_renderBodyItemHierarchic(child, doc, depth + 1)));
      return wrapper;
    }
    // Article folha — usa renderer normal
    return renderArticle(item, doc);
  }

  function renderArticle(a, doc) {
    const nC = Comments.count(doc, a.id);
    const nS = typeof Suggestions !== 'undefined' ? Suggestions.count(doc, a.id) : 0;
    const headingTa = el('textarea', { class: 'article-heading autosize', rows: 1, placeholder: 'Epígrafe',
      on: { input: e => { State.updateArticle(a.id, { heading: e.target.value }); _autosize(e.target); } }
    }, a.heading || '');
    _bindSelectionCapture(headingTa, a.id, 'heading');
    return el('div', { class: 'article-wrapper' },
      el('div', { class: 'article-block doc-block', id: a.id },
        el('div', { class: 'block-header' },
          el('span', { class: 'block-label' }, a.id),
          el('div', { class: 'block-actions' },
            el('button', { class: 'btn-move', title: 'Mover artigo para cima',
              on: { click: () => { State.moveArticleUp(a.id); refresh(); } } }, '↑'),
            el('button', { class: 'btn-move', title: 'Mover artigo para baixo',
              on: { click: () => { State.moveArticleDown(a.id); refresh(); } } }, '↓'),
            el('button', { class: 'btn-comment' + (nC ? ' has-comments' : ''),
              title: nC ? `${nC} comentário(s)` : 'Adicionar comentário',
              on: { click: () => openCommentThread(a.id, `${a.num} — ${a.heading || ''}`) } },
              nC ? `💬 ${nC}` : '💬'),
            el('button', { class: 'btn-suggest' + (nS ? ' has-suggestions' : ''),
              title: nS ? `${nS} sugestão(ões) pendente(s)` : 'Sugerir alteração à epígrafe',
              on: { click: () => openSuggestionModal(a.id, 'heading', `${a.num} — epígrafe`) } },
              nS ? `✎ ${nS}` : '✎'),
            el('button', { on: { click: () => { State.addParagraph(a.id); refresh(); } } }, '+ número'),
            el('button', { on: { click: () => { State.removeArticle(a.id); refresh(); } } }, '× remover artigo')
          )
        ),
        // num e heading como filhos directos do grid (article-block tem
        // grid-template-columns: 8em 1fr) — para num ficar na coluna 1
        // estreita e heading ocupar toda a coluna 2 (1fr, larga).
        el('input', { type: 'text', class: 'article-num', value: a.num,
          on: { input: e => State.updateArticle(a.id, { num: e.target.value }) }
        }),
        headingTa,
        // Botão "+ parágrafo no início" do articulado interno (apenas se já houver paragrafos)
        a.paragraphs.length ? renderInsertHere(() => {
          State.insertParagraphAt(a.id, null); refresh();
        }, '+ número no início') : null,
        ...a.paragraphs.flatMap(p => [
          renderParagraph(p, a.id, doc),
          renderInsertHere(() => {
            State.insertParagraphAt(a.id, p.id); refresh();
          }, '+ número abaixo'),
        ]),
      ),
      // Botão "+ artigo abaixo" entre artigos
      renderInsertHere(() => {
        State.insertArticleAt(a.id); refresh();
      }, '+ artigo abaixo'),
    );
  }

  function renderParagraph(p, articleId, doc) {
    const nC = Comments.count(doc, p.id);
    const nS = typeof Suggestions !== 'undefined' ? Suggestions.count(doc, p.id) : 0;
    const contentTa = el('textarea', { class: 'paragraph-content', value: p.content,
      placeholder: 'Texto do número (ou texto introdutório se houver alíneas)',
      on: { input: e => State.updateParagraph(p.id, articleId, { content: e.target.value }) }
    }, p.content);
    _bindSelectionCapture(contentTa, p.id, 'content');
    return el('div', { class: 'paragraph-block', id: p.id },
      el('div', { class: 'block-header' },
        el('span', { class: 'block-label' }, p.id),
        el('div', { class: 'block-actions' },
          el('button', { class: 'btn-move', title: 'Mover para cima',
            on: { click: () => { State.moveParagraphUp(p.id, articleId); refresh(); } } }, '↑'),
          el('button', { class: 'btn-move', title: 'Mover para baixo',
            on: { click: () => { State.moveParagraphDown(p.id, articleId); refresh(); } } }, '↓'),
          el('button', { class: 'btn-comment' + (nC ? ' has-comments' : ''),
            title: nC ? `${nC} comentário(s)` : 'Adicionar comentário',
            on: { click: () => openCommentThread(p.id, `Parágrafo ${p.num || ''}`) } },
            nC ? `💬 ${nC}` : '💬'),
          el('button', { class: 'btn-suggest' + (nS ? ' has-suggestions' : ''),
            title: nS ? `${nS} sugestão(ões) pendente(s)` : 'Sugerir alteração ao texto',
            on: { click: () => openSuggestionModal(p.id, 'content', `Parágrafo ${p.num || p.id}`) } },
            nS ? `✎ ${nS}` : '✎'),
          el('button', { on: { click: () => { State.addSubPoint(p.id, articleId); refresh(); } } }, '+ alínea'),
          el('button', { on: { click: () => { State.removeParagraph(p.id, articleId); refresh(); } } }, '× remover')
        )
      ),
      el('input', {
        type: 'text', class: 'paragraph-num', value: p.num,
        placeholder: '(número opcional — ex. "1 -")',
        title: 'Deixe vazio se o artigo tem apenas um parágrafo / intro. Use 1 -, 2 -, … para vários números.',
        on: { input: e => State.updateParagraph(p.id, articleId, { num: e.target.value }) }
      }),
      contentTa,
      (p.subPoints && p.subPoints.length) ? el('div', { class: 'list-block' },
        ...p.subPoints.map(sp => renderSubPoint(sp, p.id, articleId))
      ) : null,
    );
  }

  function renderSubPoint(sp, pId, articleId) {
    return el('div', { class: 'point-block-wrapper', id: sp.id },
      el('div', { class: 'point-block' },
        el('input', { type: 'text', class: 'point-num', value: sp.num,
          on: { input: e => State.updateSubPoint(pId, articleId, sp.id, { num: e.target.value }) }
        }),
        el('textarea', { class: 'point-content autosize', rows: 1, placeholder: 'Texto da alínea',
          on: { input: e => { State.updateSubPoint(pId, articleId, sp.id, { content: e.target.value }); _autosize(e.target); } }
        }, sp.content || ''),
        el('button', { class: 'btn-tiny', title: 'Adicionar subalínea i), ii)…',
          on: { click: () => { State.addSubSubPoint(pId, articleId, sp.id); refresh(); } }
        }, '+ subalínea'),
        el('button', { class: 'btn-tiny',
          on: { click: () => { State.removeSubPoint(pId, articleId, sp.id); refresh(); } }
        }, '×')
      ),
      (sp.subPoints && sp.subPoints.length) ? el('div', { class: 'sublist-block' },
        ...sp.subPoints.map(ssp => el('div', { class: 'point-block subpoint-block', id: ssp.id },
          el('input', { type: 'text', class: 'point-num', value: ssp.num,
            on: { input: e => State.updateSubSubPoint(pId, articleId, sp.id, ssp.id, { num: e.target.value }) }
          }),
          el('textarea', { class: 'point-content autosize', rows: 1, placeholder: 'Texto da subalínea',
            on: { input: e => { State.updateSubSubPoint(pId, articleId, sp.id, ssp.id, { content: e.target.value }); _autosize(e.target); } }
          }, ssp.content || ''),
          el('button', { class: 'btn-tiny',
            on: { click: () => { State.removeSubSubPoint(pId, articleId, sp.id, ssp.id); refresh(); } }
          }, '×')
        ))
      ) : null,
    );
  }

  // Auto-resize textarea ao escrever (acompanhar conteúdo sem clipping).
  function _autosize(t) {
    t.style.height = 'auto';
    t.style.height = t.scrollHeight + 'px';
  }
  // Inicializar tamanho ao renderizar (após DOM mounted)
  function _autosizeAll() {
    const fn = () => $$('.autosize').forEach(_autosize);
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(fn);
    else setTimeout(fn, 0);
  }

  // ----- Metadata tab ------------------------------------------------------
  function renderMetadataTab(doc) {
    const pane = $('[data-section="meta"]');
    if (!pane) return;
    pane.innerHTML = '';
    const type = ACT_TYPES.find(t => t.id === doc.actName);

    pane.appendChild(el('div', { class: 'field-group' },
      el('label', null, 'Subtipo'),
      el('select', {
        on: { change: e => {
          State.update({ subtype: e.target.value, formula: FORMULAS[e.target.value] || doc.formula });
        }}
      },
        ...type.subtypes.map(s =>
          el('option', { value: s.value, ...(s.value === doc.subtype ? { selected: true } : {}) }, s.label)
        )
      )
    ));

    if (type.regional) {
      pane.appendChild(el('div', { class: 'field-group' },
        el('label', null, 'Região'),
        el('select', { on: { change: e => State.update({ country: e.target.value }) } },
          el('option', { value: 'pt-20', ...(doc.country === 'pt-20' ? { selected: true } : {}) }, 'pt-20 — Açores'),
          el('option', { value: 'pt-30', ...(doc.country === 'pt-30' ? { selected: true } : {}) }, 'pt-30 — Madeira'),
        )
      ));
    }

    pane.appendChild(el('div', { class: 'field-row' },
      el('div', { class: 'field-group' },
        el('label', null, 'Número'),
        el('input', { type: 'text', value: doc.number,
          on: { input: e => State.update({ number: e.target.value }) }
        })
      ),
      el('div', { class: 'field-group' },
        el('label', null, 'Ano'),
        el('input', { type: 'number', value: doc.year,
          on: { input: e => State.update({ year: parseInt(e.target.value) }) }
        })
      ),
    ));

    pane.appendChild(el('div', { class: 'field-group' },
      el('label', null, 'Sumário do diploma'),
      el('p', { class: 'hint' },
        'Frase única que descreve o que o diploma faz, mostrada no portal DRE. ',
        'Opcional — muitos diplomas (Portarias regulamentares, despachos internos) não têm sumário explícito; ',
        'nesse caso pode deixar vazio e o conteúdo do ',
        el('em', null, 'Artigo 1.º — Objeto'),
        ' serve de sumário implícito.'),
      el('textarea', {
        rows: 3,
        placeholder: 'ex. "Estabelece o regime jurídico de..."',
        on: { input: e => State.update({ shortTitle: e.target.value }) }
      }, doc.shortTitle || '')
    ));

    pane.appendChild(el('div', { class: 'field-row' },
      el('div', { class: 'field-group' },
        el('label', null, 'Data de aprovação'),
        el('input', { type: 'date', value: doc.adoptionDate,
          on: { input: e => State.update({ adoptionDate: e.target.value }) }
        })
      ),
      el('div', { class: 'field-group' },
        el('label', null, 'Data de publicação'),
        el('input', { type: 'date', value: doc.publicationDate,
          on: { input: e => State.update({ publicationDate: e.target.value }) }
        })
      ),
    ));

    pane.appendChild(el('div', { class: 'field-group' },
      el('label', null, 'Data legível (e.g. "15 de março")'),
      el('input', { type: 'text', value: doc.docDateText || '', placeholder: 'derivada da data de publicação se vazia',
        on: { input: e => State.update({ docDateText: e.target.value }) }
      })
    ));

    // Habilitante — obrigatorio para Portaria/Despacho/DRR/DL autorizado etc.
    const needsHabilitante = ['portaria', 'despacho-normativo', 'drr'].includes(doc.actName)
                             || ['dec-lei-autorizado', 'dec-lei-transposicao', 'dlr-autorizado',
                                 'res-ar-cessacao-vigencia'].includes(doc.subtype);
    pane.appendChild(el('div', { class: 'field-group' },
      el('label', null, needsHabilitante ? 'Lei habilitante (obrigatório)' : 'Lei habilitante (opcional)'),
      el('input', { type: 'text', value: doc.habilitante || '',
        placeholder: 'URI ELI-PT, e.g. https://eli.gov.pt/eli/pt/dec-lei/2025/22/pt',
        on: { input: e => State.update({ habilitante: e.target.value }) }
      }),
      el('input', { type: 'text', value: doc.habilitanteLabel || '',
        placeholder: 'texto humano, e.g. Decreto-Lei n.º 22/2025, de 5 de novembro',
        style: 'margin-top:4px',
        on: { input: e => State.update({ habilitanteLabel: e.target.value }) }
      })
    ));

    // Assuntos (descritores nacionais da INCM → eli:is_about; ponte EuroVoc quando há).
    const subjects = Array.isArray(doc.subjects) ? doc.subjects : [];
    const sgroup = el('div', { class: 'field-group' },
      el('label', null, 'Assuntos (descritores INCM → eli:is_about)'));
    const chips = el('div', { style: 'display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px' });
    subjects.forEach((s, i) => {
      chips.appendChild(el('span', {
        style: 'display:inline-flex;align-items:center;gap:6px;padding:3px 8px;border:1px solid var(--color-border);border-radius:4px;background:var(--color-bg);font-size:0.8em' },
        el('span', null, s.label || s.code),
        s.eurovoc ? el('span', { title: 'EuroVoc: ' + (s.euLabel || ''), style: 'font-size:0.7em;color:var(--color-muted)' }, '· EuroVoc') : '',
        el('button', { type: 'button', title: 'remover',
          style: 'border:none;background:none;cursor:pointer;color:var(--color-muted);font-size:1.1em;line-height:1',
          on: { click: () => State.update({ subjects: subjects.filter((_, j) => j !== i) }) } }, '×')
      ));
    });
    sgroup.appendChild(chips);
    const sInput = el('input', { type: 'search', placeholder: 'Pesquisar descritor (ex. "ambiente", "contratação pública")…' });
    const sResults = el('div', { style: 'margin-top:6px;display:flex;flex-direction:column;gap:4px' });
    sInput.addEventListener('input', async () => {
      const q = sInput.value.trim();
      sResults.innerHTML = '';
      if (q.length < 2) return;
      try { await SubjectVocab.load(); }
      catch { sResults.appendChild(el('div', { class: 'muted small' }, 'Vocabulário indisponível.')); return; }
      const hits = SubjectVocab.search(q, 8);
      if (!hits.length) { sResults.appendChild(el('div', { class: 'muted small' }, 'Sem resultados.')); return; }
      hits.forEach((h) => {
        const eu = SubjectVocab.eurovoc(h.code);
        sResults.appendChild(el('div', {
          style: 'padding:5px 8px;border:1px solid var(--color-border);border-radius:4px;cursor:pointer;background:var(--color-bg);font-size:0.85em',
          on: { click: () => {
            if (subjects.some((x) => x.code === h.code)) { toast('Assunto já adicionado', 'info'); return; }
            const entry = { code: h.code, label: h.label };
            if (eu) { entry.eurovoc = eu.eurovoc; entry.euLabel = eu.euLabel; }
            State.update({ subjects: subjects.concat([entry]) });
          } } },
          el('span', null, h.label),
          eu ? el('span', { style: 'font-size:0.7em;color:var(--color-muted)' }, '  · EuroVoc: ' + eu.euLabel) : ''
        ));
      });
    });
    sgroup.appendChild(sInput);
    sgroup.appendChild(sResults);
    pane.appendChild(sgroup);
  }

  // ----- Footprint tab ------------------------------------------------------
  function renderFootprintTab(doc) {
    const pane = $('[data-section="footprint"]');
    if (!pane) return;
    pane.innerHTML = '';

    const cutoff = '2026-07-27';
    const required = doc.publicationDate && doc.publicationDate >= cutoff;
    pane.appendChild(el('p', { class: 'hint' },
      required
        ? '⚠ Pegada legislativa OBRIGATÓRIA — publicação ≥ 2026-07-27 (Lei n.º 5-A/2026).'
        : 'Pegada opcional para esta data de publicação.'
    ));

    pane.appendChild(el('button', { class: 'btn-secondary',
      on: { click: () => { State.addStep(); refresh(); } }
    }, '+ Passo do workflow'));

    doc.workflow.forEach(step => {
      const stepEl = el('div', { class: 'footprint-step' });
      stepEl.appendChild(el('div', { class: 'footprint-step-header' },
        el('select', { on: { change: e => State.updateStep(step.id, { refersTo: e.target.value }) } },
          ...STEP_TYPES.map(s =>
            el('option', { value: s.value, ...(s.value === step.refersTo ? { selected: true } : {}) }, s.label)
          )
        ),
        el('input', { type: 'date', value: step.date,
          on: { input: e => State.updateStep(step.id, { date: e.target.value }) }
        }),
        el('button', { on: { click: () => { State.removeStep(step.id); refresh(); } } }, '×')
      ));
      stepEl.appendChild(el('input', { type: 'text', value: step.source, placeholder: 'source (e.g. governo, cm, ar)',
        on: { input: e => State.updateStep(step.id, { source: e.target.value }) }
      }));
      stepEl.appendChild(el('input', { type: 'text', value: step.description || '', placeholder: 'descrição',
        on: { input: e => State.updateStep(step.id, { description: e.target.value }) }
      }));
      stepEl.appendChild(el('button', { class: 'btn-small',
        on: { click: () => { State.addInput(step.id); refresh(); } }
      }, '+ contributo externo'));

      step.inputs.forEach(inp => {
        stepEl.appendChild(el('div', { class: 'footprint-input' },
          el('input', { type: 'text', value: inp.source, placeholder: 'source (e.g. org-cip)',
            on: { input: e => State.updateInput(step.id, inp.id, { source: e.target.value }) }
          }),
          el('select', { on: { change: e => State.updateInput(step.id, inp.id, { type: e.target.value }) } },
            ...INPUT_TYPES.map(t =>
              el('option', { value: t.value, ...(t.value === inp.type ? { selected: true } : {}) }, t.label)
            )
          ),
          el('input', { type: 'date', value: inp.date,
            on: { input: e => State.updateInput(step.id, inp.id, { date: e.target.value }) }
          }),
          el('input', { type: 'text', value: inp.description || '', placeholder: 'descrição',
            on: { input: e => State.updateInput(step.id, inp.id, { description: e.target.value }) }
          }),
          el('button', { on: { click: () => { State.removeInput(step.id, inp.id); refresh(); } } }, '×')
        ));
      });

      pane.appendChild(stepEl);
    });
  }

  // ----- XML tab -----------------------------------------------------------
  function renderXmlTab(doc) {
    const pre = $('#xml-preview');
    if (doc.kind === 'amender') {
      pre.textContent = '/* XML do diploma alterador */\n' + Amendment.toAknXml(doc);
    } else {
      pre.textContent = AknExport.toXml(doc);
    }
  }

  // ----- Validation section (dentro da tab Revisão) -----------------------
  function renderValidationTab(doc) {
    const pane = $('[data-section="validation"]');
    if (!pane) return;
    pane.innerHTML = '';
    const issues = Validation.check(doc);
    const summary = $('[data-summary="validation"]');
    if (summary) summary.textContent = issues.length ? `${issues.length} problema(s)` : '✓ tudo OK';

    const ul = el('ul', { id: 'validation-list' });
    if (!issues.length) {
      ul.appendChild(el('li', { class: 'ok' }, '✓ Sem problemas detectados client-side.'));
    } else {
      issues.forEach(i => {
        const cls = i.level === 'error' ? 'error' : 'warn';
        ul.appendChild(el('li', { class: cls }, (i.level === 'error' ? '✗ ' : '⚠ ') + i.msg));
      });
    }
    pane.appendChild(ul);
    pane.appendChild(el('p', { class: 'muted small', style: 'margin-top:8px' },
      'Para validação completa contra XSD + Schematron, exporte o XML e execute ',
      el('code', null, 'akn-pt validate doc.akn.xml'), '.'));
  }

  // ----- Tab badges (contadores no nome da tab) ---------------------------
  function renderTabBadges(doc) {
    const counts = {
      review: 0,
      links: 0,
    };
    // Revisão: validação(erros) + comentários abertos
    const issues = Validation.check(doc);
    counts.review = issues.filter(i => i.level === 'error').length
                  + (typeof Comments !== 'undefined' ? Comments.count(doc) : 0);
    // Ligações: refs totais
    if (typeof References !== 'undefined') {
      const s = References.statsForDoc(doc);
      counts.links = s.total;
    }
    Object.entries(counts).forEach(([k, n]) => {
      const b = document.querySelector(`[data-badge="${k}"]`);
      if (!b) return;
      if (n > 0) { b.textContent = n; b.classList.remove('hidden'); }
      else b.classList.add('hidden');
    });
    // Summary inline nos <summary> das secções
    const sc = document.querySelector('[data-summary="comments"]');
    if (sc && typeof Comments !== 'undefined') {
      const n = Comments.count(doc);
      sc.textContent = n ? `(${n} aberto/s)` : '';
    }
    const sr = document.querySelector('[data-summary="refs"]');
    if (sr && typeof References !== 'undefined') {
      const s = References.statsForDoc(doc);
      sr.textContent = s.total ? `(${s.total} detectada/s)` : '';
    }
  }

  // ----- Secção DRE (autocomplete / busca rápida) -------------------------
  function renderDreSection(doc) {
    const pane = $('[data-section="dre"]');
    if (!pane) return;
    pane.innerHTML = '';
    pane.appendChild(el('p', { class: 'hint' },
      'Busca em ~30 diplomas de referência (DreMock) + atos recentes reais do DRE (Atom feed, últimos ~2 meses).'));
    const input = el('input', { type: 'search', placeholder: 'Pesquisar (ex. "dl 21 2023", "rgpd", "código civil")…' });
    const results = el('div', { class: 'dre-results', style: 'margin-top:8px;display:flex;flex-direction:column;gap:6px' });
    const _item = (label, eli) => el('div', { class: 'dre-result-item',
      style: 'padding:6px 8px;border:1px solid var(--color-border);border-radius:4px;cursor:pointer;background:var(--color-bg)',
      on: { click: async () => { await navigator.clipboard.writeText(eli); toast('URI copiado: ' + eli, 'success'); } } },
      el('div', { style: 'font-size:0.85em;font-weight:500' }, label),
      el('div', { style: 'font-size:0.7em;color:var(--color-muted);font-family:var(--font-mono);word-break:break-all' }, eli),
    );
    input.addEventListener('input', () => {
      const q = input.value.trim();
      results.innerHTML = '';
      if (q.length < 2) return;
      DreMock.suggest(q, 8).forEach(r => results.appendChild(_item(r.label, r.eli)));
      // Atos recentes reais (ActIndex, lazy) — com guarda de query anti-corrida.
      if (typeof ActIndex !== 'undefined') {
        ActIndex.load().then(() => {
          if (input.value.trim() !== q) return;
          const real = ActIndex.search(q, 5);
          if (real.length) {
            results.appendChild(el('div', { class: 'muted small', style: 'margin-top:4px' }, 'Atos recentes (DRE):'));
            real.forEach(a => results.appendChild(_item(a.titulo || `${a.tipo} ${a.numero}/${a.ano}`, a.eli)));
          }
        });
      }
      if (!results.children.length) {
        results.appendChild(el('div', { class: 'muted small' }, 'Sem resultados.'));
      }
    });
    pane.appendChild(input);
    pane.appendChild(results);
  }

  // ===========================================================================
  // ----- v0.1.0+ : Refs, Comments, AI, Snapshots, Diff, Amendments ----------
  // ===========================================================================

  // ----- Tab: Referencias --------------------------------------------------
  function renderRefsTab(doc) {
    const pane = $('[data-section="refs"]');
    if (!pane) return;
    pane.innerHTML = '';
    const stats = References.statsForDoc(doc);
    pane.appendChild(el('p', { class: 'hint' },
      'Referências detectadas automaticamente em texto livre. Aparecem como ',
      el('code', null, '<ref>'), ' no XML exportado e como hiperligações no preview.'));

    pane.appendChild(el('div', { class: 'refs-stats' },
      el('div', null, el('span', { class: 'n' }, String(stats.internal)), 'internas'),
      el('div', null, el('span', { class: 'n' }, String(stats.externalPt)), 'externas PT'),
      el('div', null, el('span', { class: 'n' }, String(stats.externalUe)), 'directivas UE'),
    ));

    // Listagem detalhada — percorrer doc e coletar refs com contexto
    const list = el('ul', { id: 'refs-tab-list' });
    const collect = (text, where) => {
      if (!text) return;
      References.findAll(text, doc).forEach(r => {
        const cls = r.kind.startsWith('external-pt') ? 'external'
          : r.kind === 'external-ue' ? 'external'
          : r.href.startsWith('#') ? '' : '';
        // ref interna sem target detectado → broken
        let isBroken = false;
        if (r.href.startsWith('#')) {
          const target = r.href.slice(1);
          isBroken = !_existsEid(doc, target);
        }
        list.appendChild(el('li', { class: cls + (isBroken ? ' broken' : '') },
          el('span', { class: 'ref-raw' }, `"${r.raw}"`),
          el('span', { class: 'ref-href' }, (isBroken ? '⚠ alvo inexistente · ' : '') + r.href),
          el('span', { class: 'muted small' }, where),
        ));
      });
    };
    (doc.recitals || []).forEach((r, i) => collect(r.text, `Considerando ${i + 1}`));
    if (doc.formula) collect(doc.formula, 'Fórmula');
    if (doc.body && doc.body.kind === 'articles') {
      (doc.body.items || []).forEach(a => {
        collect(a.heading, `${a.num} (epígrafe)`);
        (a.paragraphs || []).forEach(p => {
          collect(p.content, `${a.num} ${p.num || ''}`);
          (p.subPoints || []).forEach(sp => {
            collect(sp.content, `${a.num} ${p.num || ''} ${sp.num}`);
            (sp.subPoints || []).forEach(ssp => collect(ssp.content, `${a.num} ${p.num || ''} ${sp.num} ${ssp.num}`));
          });
        });
      });
    } else if (doc.body) {
      (doc.body.items || []).forEach(p => collect(p.content, p.num || p.id));
    }
    if (!list.children.length) {
      list.appendChild(el('li', { class: 'muted' }, 'Nenhuma referência detectada.'));
    }
    pane.appendChild(list);
  }

  function _existsEid(doc, eId) {
    if (doc.body && doc.body.kind === 'articles') {
      return doc.body.items.some(a => {
        if (a.id === eId) return true;
        return a.paragraphs.some(p => {
          if (p.id === eId) return true;
          return (p.subPoints || []).some(sp => sp.id === eId
            || (sp.subPoints || []).some(ssp => ssp.id === eId));
        });
      });
    }
    return (doc.body?.items || []).some(p => p.id === eId);
  }

  // ----- Tab: Comentários (lista) ------------------------------------------
  function renderCommentsTab(doc) {
    const pane = $('[data-section="comments"]');
    if (!pane) return;
    pane.innerHTML = '';
    pane.appendChild(el('p', { class: 'hint' },
      'Comentários ancorados em elementos do diploma (eId). Os comentários ficam guardados com o rascunho e podem ser exportados.'));

    const all = Comments.list(doc);
    if (!all.length) {
      pane.appendChild(el('p', { class: 'muted small' }, 'Sem comentários. Clique no botão 💬 ao lado de qualquer artigo ou parágrafo.'));
      return;
    }
    const byEid = Comments.listByEid(doc);
    const wrap = el('div', { id: 'comments-tab-list' });
    [...byEid.entries()].forEach(([eId, list]) => {
      const head = el('div', { class: 'comment-group-head', on: { click: () => openCommentThread(eId, eId) } },
        el('span', null, eId),
        el('span', null, `${list.filter(c => !c.resolved).length} aberto(s) / ${list.length}`));
      wrap.appendChild(el('div', { class: 'comment-group' }, head));
    });
    pane.appendChild(wrap);
  }

  // ----- Tab: AI assistant ------------------------------------------------
  function renderAiTab(doc) {
    const pane = $('[data-section="ai"]');
    if (!pane) return;
    pane.innerHTML = '';
    pane.appendChild(el('p', { class: 'small',
      style: 'color:var(--color-' + (AI.isConfigured() ? 'success' : 'warning') + ');margin-bottom:8px' },
      AI.isConfigured() ? '✓ Chave da API configurada.' : '⚠ Sem chave — respostas mock.'));
    const tasks = el('div', { class: 'ai-tasks' });
    AI.taskList().forEach(t => {
      tasks.appendChild(el('button', {
        on: { click: () => runAiTask(t.id, t.label, doc) }
      }, t.label));
    });
    pane.appendChild(tasks);
    pane.appendChild(el('p', { class: 'muted small', style: 'margin-top:8px' },
      'Configure a chave em ',
      el('a', { href: '#', on: { click: (e) => { e.preventDefault(); openAiSettingsModal(); } } },
        'definições do assistente'), '.'));
  }

  async function runAiTask(taskId, label, doc) {
    // Para tarefas que precisam de texto/artigo específico, vamos buscar:
    let input = doc;
    if (taskId === 'simplify' || taskId === 'detectAmbiguity') {
      // pedir um texto — usar o primeiro paragrafo do primeiro artigo como amostra
      const sample = _firstText(doc);
      input = prompt(`Cole texto para ${label.toLowerCase()}:`, sample || '');
      if (!input) return;
    } else if (taskId === 'suggestHeading') {
      // primeiro artigo sem heading
      const a = (doc.body?.items || []).find(x => !x.heading);
      if (!a) { toast('Sem artigos sem epígrafe.', 'warn'); return; }
      input = a;
    }

    $('#ai-result-title').textContent = label;
    $('#ai-result-body').innerHTML = `<div class="ai-loading">A consultar Claude</div>`;
    $('#ai-result-modal').classList.remove('hidden');
    try {
      const text = await AI.callClaude(taskId, input);
      $('#ai-result-body').textContent = text;
      if (typeof Activity !== 'undefined') Activity.log('ia', { task: label });
    } catch (e) {
      $('#ai-result-body').textContent = '✗ Erro: ' + e.message;
    }
  }

  function _firstText(doc) {
    if (doc.body?.kind === 'articles') {
      const a = doc.body.items[0];
      return a?.paragraphs?.[0]?.content || '';
    }
    return doc.body?.items?.[0]?.content || '';
  }

  // ----- Modais opcionais: Texto (Bluebell) e Colab ----------------------

  function openTextModal() {
    const ta = $('#bluebell-editor');
    if (ta) ta.value = BluebellPt.serialize(State.get());
    $('#text-modal').classList.remove('hidden');
    setTimeout(() => ta?.focus(), 50);
  }

  function openCollabModal() {
    const body = $('#collab-body');
    body.innerHTML = '';
    const supported = typeof BroadcastChannel !== 'undefined';
    const live = supported && typeof Collab !== 'undefined' ? Collab.peerCount() : -1;
    body.appendChild(el('p', { class: 'hint' }, 'Partilha leve, sem servidor.'));
    body.appendChild(el('h3', { class: 'block-label' }, 'Sincronização entre tabs'));
    body.appendChild(el('p', { class: 'small' },
      !supported ? '✗ Browser não suporta BroadcastChannel.' :
      live > 0 ? `✓ ${live + 1} tab(s) ligadas — alterações sincronizam em tempo real.`
               : '○ Só esta tab. Abra esta URL noutra tab para sincronizar.'));
    body.appendChild(el('h3', { class: 'block-label', style: 'margin-top:16px' }, 'Partilha por URL'));
    body.appendChild(el('p', { class: 'small' },
      'Gera um link com o rascunho codificado e comprimido. Quem o abrir vê o mesmo documento.'));
    body.appendChild(el('button', { class: 'btn-primary',
      on: { click: async () => {
        try {
          const url = await Collab.makeShareUrl(State.get());
          if (!url) { toast('Documento demasiado longo — exporte XML.', 'warn'); return; }
          await navigator.clipboard.writeText(url);
          toast('URL copiado.', 'success');
          const out = $('#share-url-out'); if (out) out.value = url;
        } catch (e) { toast('Erro: ' + e.message, 'error'); }
      }}}, '↗ Gerar e copiar URL'));
    body.appendChild(el('textarea', { id: 'share-url-out', readonly: true, rows: 3,
      style: 'margin-top:8px;font-family:var(--font-mono);font-size:0.75em;width:100%;',
      placeholder: 'URL aparecerá aqui após gerar…' }));
    $('#collab-modal').classList.remove('hidden');
  }

  function openAiSettingsModal() {
    const body = $('#ai-settings-body');
    body.innerHTML = '';
    body.appendChild(el('p', { class: 'hint' },
      'Chave da API Anthropic guardada apenas no seu browser. O conteúdo do rascunho passa pela API Anthropic.'));
    body.appendChild(el('label', null, 'Chave da API Anthropic:'));
    body.appendChild(el('div', { style: 'display:flex;gap:8px;align-items:center' },
      el('input', { type: 'password', id: 'ai-key-input', placeholder: 'sk-ant-…',
        value: typeof AI !== 'undefined' ? AI.getApiKey() : '',
        style: 'flex:1;font-family:var(--font-mono);font-size:0.75em' }),
      el('button', { class: 'btn-primary',
        on: { click: () => {
          AI.setApiKey($('#ai-key-input').value);
          toast('Chave guardada localmente.', 'success');
          refresh();
        }}}, 'Guardar'),
    ));
    body.appendChild(el('p', { class: 'ai-status ' + (AI.isConfigured() ? 'ok' : 'warn'), style: 'margin-top:12px' },
      AI.isConfigured() ? '✓ Chave configurada — chamadas reais à API.'
                        : '⚠ Sem chave — respostas mock (demo).'));
    $('#ai-settings-modal').classList.remove('hidden');
  }

  // Metadados ELI — viewer (Cmd-K "Ver metadados ELI"). Mostra as duas formas
  // de URI (a nossa proposta e a forma de produção da INCM, para tornar a
  // divergência visível na reunião), o JSON-LD e o RDFa equivalente.
  function openEliModal() {
    const doc = State.get();
    const body = $('#eli-modal-body');
    body.innerHTML = '';
    if (typeof EliMetadata === 'undefined') {
      body.appendChild(el('p', { class: 'hint' }, 'Módulo EliMetadata não carregado.'));
      openModal('eli-modal');
      return;
    }
    const cmp = EliMetadata.uriComparison(doc);
    const jsonld = EliMetadata.toJsonLdString(doc);
    const rdfa = EliMetadata.toRdfa(doc);

    body.appendChild(el('p', { class: 'hint' },
      'Metadados ELI machine-readable derivados do documento (ontologia ELI v1.5). ',
      'Esta é a marcação que o portal da INCM deixou de servir após a migração para OutSystems.'));

    // Comparação de URIs
    body.appendChild(el('h3', { class: 'block-label', style: 'margin-top:8px' }, 'URI — duas formas a reconciliar com a INCM'));
    const mk = (label, uri) => el('div', { style: 'margin:4px 0' },
      el('span', { class: 'muted small', style: 'display:inline-block;min-width:170px' }, label),
      el('code', { style: 'font-size:0.8em;word-break:break-all' }, uri));
    body.appendChild(el('div', { style: 'background:var(--color-bg-soft,#f5f3ee);padding:8px 10px;border-radius:6px' },
      el('div', { style: 'font-weight:600;font-size:0.85em;margin-bottom:2px' }, cmp.canonical.scheme),
      mk('Work', cmp.canonical.work),
      mk('Expression', cmp.canonical.expression),
      mk('Manifestation', cmp.canonical.manifestation),
      el('div', { style: 'font-weight:600;font-size:0.85em;margin:8px 0 2px' }, cmp.proposed.scheme),
      mk('Work', cmp.proposed.work),
      mk('Expression', cmp.proposed.expression),
    ));

    // JSON-LD
    const jsonHead = el('div', { style: 'display:flex;align-items:center;justify-content:space-between;margin-top:16px' },
      el('h3', { class: 'block-label', style: 'margin:0' }, 'JSON-LD'),
      el('button', { class: 'btn-small', on: { click: () => {
        navigator.clipboard.writeText(jsonld); toast('JSON-LD copiado.', 'success');
      }}}, 'Copiar'));
    body.appendChild(jsonHead);
    body.appendChild(el('pre', { class: 'xml-preview-pre', style: 'max-height:40vh;overflow:auto' }, jsonld));

    // RDFa
    body.appendChild(el('h3', { class: 'block-label', style: 'margin-top:16px' }, 'RDFa equivalente (forma dominante na UE)'));
    body.appendChild(el('pre', { class: 'xml-preview-pre', style: 'max-height:25vh;overflow:auto' }, rdfa));

    openModal('eli-modal');
  }

  // Wrapper que actualiza o badge "live" e propaga alterações.
  function _setupCollab() {
    if (typeof Collab === 'undefined') return;
    const ok = Collab.init((remoteDoc) => {
      if (!remoteDoc) return;
      State.init(remoteDoc);
      refresh();
    });
    if (!ok) return;
    Collab.onPeersChange(n => {
      const badge = $('#peers-badge');
      if (!badge) return;
      if (n > 0) {
        badge.classList.remove('hidden');
        badge.className = 'badge badge-ok';
        badge.textContent = `● ${n + 1}`;
      } else {
        badge.classList.add('hidden');
      }
    });
  }

  // ----- DRE autocomplete (popover) ---------------------------------------
  // Anexa autocomplete ao input passado. Quando o utilizador escreve >=2
  // chars o popover mostra sugestões; click insere "Decreto-Lei n.º X/YYYY"
  // no input e (se for o campo "habilitante") o URI ELI na linha de URI.
  function attachDreAutocomplete(input, opts = {}) {
    if (typeof DreMock === 'undefined') return;
    let popover = null;
    const close = () => { if (popover) { popover.remove(); popover = null; } };
    input.addEventListener('input', () => {
      const q = input.value.trim();
      close();
      if (q.length < 2) return;
      const results = DreMock.suggest(q, 6);
      if (!results.length) return;
      popover = el('div', { class: 'dre-popover' });
      results.forEach(r => {
        popover.appendChild(el('div', { class: 'dre-item',
          on: { mousedown: (ev) => {
            ev.preventDefault();
            input.value = opts.field === 'uri' ? r.eli : r.label;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            if (opts.onPick) opts.onPick(r);
            close();
          }}},
          el('div', { class: 'dre-label' }, r.label),
          el('div', { class: 'dre-meta' }, r.eli),
        ));
      });
      input.parentNode.style.position = 'relative';
      input.parentNode.appendChild(popover);
    });
    input.addEventListener('blur', () => setTimeout(close, 150));
  }
  // Patchar o renderMetadataTab para attachar autocomplete ao campo habilitante
  const _originalRenderMetadataTab = renderMetadataTab;
  renderMetadataTab = function(doc) {
    _originalRenderMetadataTab(doc);
    // Encontrar os inputs habilitante (URI e label) e attachar autocomplete
    const inputs = $$('input').filter(i =>
      i.placeholder && (i.placeholder.includes('ELI-PT') || i.placeholder.includes('Decreto-Lei')));
    inputs.forEach(i => attachDreAutocomplete(i, {
      field: i.placeholder.includes('URI') || i.placeholder.includes('ELI-PT') ? 'uri' : 'label',
      onPick: (r) => {
        // se for o campo URI, preenche também o label seguinte
        const labelField = $$('input').find(x => x.placeholder && x.placeholder.includes('Decreto-Lei n.º'));
        if (i.placeholder.includes('ELI-PT') && labelField) {
          labelField.value = r.label;
          labelField.dispatchEvent(new Event('input', { bubbles: true }));
        }
      },
    }));
  };

  // ----- Modal: Thread de comentário -------------------------------------
  let _activeCommentEid = null;
  function openCommentThread(eId, title) {
    _activeCommentEid = eId;
    $('#comment-thread-title').textContent = `Comentários — ${title}`;
    renderCommentThread();
    $('#comment-thread-modal').classList.remove('hidden');
  }
  function renderCommentThread() {
    const doc = State.get();
    const body = $('#comment-thread-body');
    body.innerHTML = '';
    const thread = Comments.thread(doc, _activeCommentEid);
    const list = el('div', { class: 'comment-thread' });
    if (!thread.length) {
      list.appendChild(el('p', { class: 'muted small' }, 'Sem comentários ainda neste elemento.'));
    } else {
      thread.forEach(c => list.appendChild(renderCommentNode(c, 0)));
    }
    body.appendChild(list);
    // input para novo comentário
    const newBox = el('div', { class: 'comment-new' },
      el('textarea', { id: 'new-comment-text', placeholder: 'Escreva um comentário…', rows: 3 }),
      el('div', { style: 'display:flex;gap:8px;align-items:center;' },
        el('input', { type: 'text', id: 'new-comment-author', placeholder: 'Autor (opcional)', style: 'flex:1' }),
        el('button', { class: 'btn-primary', on: { click: () => {
          const t = $('#new-comment-text').value.trim();
          if (!t) return;
          Comments.add(doc, _activeCommentEid, t, { author: $('#new-comment-author').value.trim() });
          State.saveDraft();
          renderCommentThread();
          refresh();
        }}}, 'Adicionar')
      )
    );
    body.appendChild(newBox);
  }
  function renderCommentNode(c, depth) {
    const doc = State.get();
    const node = el('div', { class: 'comment ' + (c.resolved ? 'resolved' : ''), style: depth ? `margin-left:${depth * 16}px` : '' },
      el('div', { class: 'comment-meta' },
        el('span', { class: 'author' }, c.author || '(anónimo)'),
        el('span', null, new Date(c.date).toLocaleString('pt-PT')),
        c.resolved ? el('span', { class: 'muted small' }, '· resolvido') : null,
      ),
      el('div', { class: 'comment-text' }, c.text),
      el('div', { class: 'comment-actions' },
        el('button', { class: 'btn-small', on: { click: () => {
          const reply = prompt('Responder:');
          if (!reply) return;
          Comments.reply(doc, c.id, reply);
          State.saveDraft();
          renderCommentThread();
          refresh();
        }}}, 'Responder'),
        c.resolved
          ? el('button', { class: 'btn-small', on: { click: () => {
              Comments.unresolve(doc, c.id); State.saveDraft(); renderCommentThread(); refresh();
            }}}, 'Reabrir')
          : el('button', { class: 'btn-small', on: { click: () => {
              Comments.resolve(doc, c.id); State.saveDraft(); renderCommentThread(); refresh();
            }}}, 'Resolver'),
        el('button', { class: 'btn-small btn-danger', on: { click: () => {
          if (!confirm('Remover comentário?')) return;
          Comments.remove(doc, c.id); State.saveDraft(); renderCommentThread(); refresh();
        }}}, 'Remover'),
      )
    );
    if (c.replies && c.replies.length) {
      const wrap = el('div', { class: 'comment-replies' });
      c.replies.forEach(r => wrap.appendChild(renderCommentNode(r, depth + 1)));
      node.appendChild(wrap);
    }
    return node;
  }

  // ------------------------------------------------------------------------
  // Modal: Suggestions — criar nova + listar pending para um (eId, field)
  // ------------------------------------------------------------------------
  function openSuggestionModal(eId, field, title) {
    const doc = State.get();
    if (!doc) return;
    const body = $('#suggestion-modal-body');
    $('#suggestion-modal-title').textContent = `Sugestões — ${title || eId}`;
    body.innerHTML = '';

    // ----- Bloco "Criar nova sugestão" -----
    const create = document.createElement('div');
    create.className = 'sug-create';
    // Determinar selection — se _activeSelection corresponde a este (eId, field),
    // usa-a; caso contrário pede ao utilizador para seleccionar texto primeiro.
    const sel = (_activeSelection && _activeSelection.eId === eId && _activeSelection.field === field)
      ? _activeSelection : null;
    if (sel) {
      const orig = document.createElement('div');
      orig.className = 'sug-original';
      orig.innerHTML = '<span class="sug-label">Texto seleccionado:</span> ' +
        `<em>${_esc(sel.text)}</em> ` +
        `<span class="muted small">(range ${sel.start}–${sel.end})</span>`;
      create.appendChild(orig);
      const ta = document.createElement('textarea');
      ta.className = 'sug-proposed';
      ta.rows = 3;
      ta.placeholder = 'Texto proposto (substituirá a selecção quando aceite)';
      ta.value = sel.text;  // pre-popular para editar
      create.appendChild(ta);
      const noteIn = document.createElement('input');
      noteIn.type = 'text';
      noteIn.className = 'sug-note';
      noteIn.placeholder = 'Justificação (opcional)';
      create.appendChild(noteIn);
      const submit = document.createElement('button');
      submit.className = 'btn-primary';
      submit.textContent = 'Submeter sugestão';
      submit.addEventListener('click', () => {
        const proposed = ta.value;
        if (proposed === sel.text) { toast('Texto proposto igual ao original.', 'warn'); return; }
        try {
          Suggestions.add(doc, eId, field, { start: sel.start, end: sel.end }, proposed,
            { note: noteIn.value, author: '' });
          if (typeof Activity !== 'undefined') Activity.log('suggestion', { eId, field });
          State.saveDraft();
          openSuggestionModal(eId, field, title);  // re-render lista
          refresh();
        } catch (err) { toast('Erro: ' + err.message, 'error'); }
      });
      create.appendChild(submit);
    } else {
      create.innerHTML = '<p class="hint">Para sugerir uma alteração, primeiro <strong>seleccione o texto</strong> que pretende alterar dentro do parágrafo ou epígrafe, e clique novamente em <kbd>✎</kbd>.</p>';
    }
    body.appendChild(create);

    // ----- Lista de sugestões existentes -----
    const list = Suggestions.list(doc, eId).filter(s => s.field === field);
    if (list.length) {
      const sep = document.createElement('hr');
      sep.className = 'sug-sep';
      body.appendChild(sep);
      const h = document.createElement('h4');
      h.className = 'sug-section-title';
      h.textContent = 'Sugestões registadas';
      body.appendChild(h);
      list.forEach(s => body.appendChild(_renderSuggestionItem(s, eId, field, title)));
    }

    $('#suggestion-modal').classList.remove('hidden');
  }

  function _renderSuggestionItem(s, eId, field, title) {
    const wrap = document.createElement('div');
    wrap.className = 'sug-item sug-status-' + s.status;
    const meta = document.createElement('div');
    meta.className = 'sug-meta';
    const dt = new Date(s.date).toLocaleString('pt-PT');
    meta.innerHTML = `<span class="sug-author">${_esc(s.author || 'anónimo')}</span> · ` +
      `<span class="sug-date">${dt}</span> · ` +
      `<span class="sug-badge sug-badge-${s.status}">${s.status}</span>`;
    wrap.appendChild(meta);
    const diff = document.createElement('div');
    diff.className = 'sug-diff';
    diff.innerHTML = Suggestions.renderDiffHtml(s);
    wrap.appendChild(diff);
    if (s.note) {
      const n = document.createElement('div');
      n.className = 'sug-note-display muted small';
      n.textContent = '— ' + s.note;
      wrap.appendChild(n);
    }
    const acts = document.createElement('div');
    acts.className = 'sug-actions';
    if (s.status === 'pending') {
      const acc = document.createElement('button');
      acc.className = 'btn-small btn-accept';
      acc.textContent = 'Aceitar';
      acc.addEventListener('click', () => {
        const result = Suggestions.accept(State.get(), s.id);
        State.saveDraft();
        if (result && result.status === 'stale') {
          toast('Sugestão obsoleta — o texto original foi alterado.', 'warn');
        } else {
          toast('Sugestão aplicada.', 'success');
        }
        if (typeof Activity !== 'undefined') Activity.log('suggestion-accepted', { eId });
        openSuggestionModal(eId, field, title);
        refresh();
      });
      acts.appendChild(acc);
      const rej = document.createElement('button');
      rej.className = 'btn-small btn-danger';
      rej.textContent = 'Rejeitar';
      rej.addEventListener('click', () => {
        Suggestions.reject(State.get(), s.id);
        State.saveDraft();
        toast('Sugestão rejeitada.', 'success');
        if (typeof Activity !== 'undefined') Activity.log('suggestion-rejected', { eId });
        openSuggestionModal(eId, field, title);
        refresh();
      });
      acts.appendChild(rej);
    }
    const del = document.createElement('button');
    del.className = 'btn-small';
    del.textContent = '× apagar';
    del.title = 'Remove permanentemente';
    del.addEventListener('click', () => {
      if (!confirm('Apagar sugestão definitivamente?')) return;
      Suggestions.remove(State.get(), s.id);
      State.saveDraft();
      openSuggestionModal(eId, field, title);
      refresh();
    });
    acts.appendChild(del);
    wrap.appendChild(acts);
    return wrap;
  }

  function _esc(s) {
    const div = document.createElement('div');
    div.textContent = String(s == null ? '' : s);
    return div.innerHTML;
  }

  // ----- Modal: Snapshots -------------------------------------------------
  // Vista activa no modal (chrono | phase). UI-state em memória, default chrono.
  let _snapView = 'chrono';

  function openSnapshotsModal() {
    _populatePhaseSelect();
    renderSnapshotsList();
    $('#snapshots-modal').classList.remove('hidden');
  }

  function _populatePhaseSelect() {
    const sel = $('#snap-phase');
    if (!sel) return;
    const doc = State.get();
    const phases = (typeof Snapshots !== 'undefined' && Snapshots.getPhasesForActType)
      ? Snapshots.getPhasesForActType(doc?.actName) : [];
    // preservar valor seleccionado se possível
    const prev = sel.value;
    sel.innerHTML = '<option value="">— sem fase —</option>';
    phases.forEach(p => {
      const o = document.createElement('option');
      o.value = p; o.textContent = p;
      sel.appendChild(o);
    });
    if (prev && phases.includes(prev)) sel.value = prev;
  }

  function _renderSnapEntry(s, opts = {}) {
    const li = el('li', null,
      el('div', { class: 'snap-row' },
        el('span', { class: 'snap-label' + (s.auto ? ' snap-auto' : '') }, s.label),
        s.phase && !opts.hidePhaseBadge
          ? el('span', { class: 'snap-phase-badge', title: 'Fase do procedimento' }, s.phase)
          : null,
      ),
      el('div', { class: 'snap-meta' }, `${new Date(s.date).toLocaleString('pt-PT')} · ${s.summary || ''}`),
      el('div', { class: 'snap-actions' },
        el('button', { class: 'btn-small', title: 'Carregar este snapshot como rascunho actual',
          on: { click: () => {
            const d = Snapshots.load(s.id);
            if (!d) { toast('Erro ao carregar.', 'error'); return; }
            if (!confirm('Substituir o rascunho actual por este snapshot?')) return;
            State.init(d); State.saveDraft();
            $('#snapshots-modal').classList.add('hidden');
            refresh();
            toast('Snapshot carregado.', 'success');
          }}}, 'Abrir'),
        el('button', { class: 'btn-small', title: 'Comparar este snapshot com o rascunho actual',
          on: { click: () => openDiffModal(s.id, 'current') } }, 'Comparar'),
        el('button', { class: 'btn-small btn-danger', on: { click: () => {
          if (!confirm('Apagar snapshot?')) return;
          Snapshots.delete(s.id);
          renderSnapshotsList();
        }}}, '×'),
      ),
    );
    return li;
  }

  function renderSnapshotsList() {
    const ul = $('#snap-list');
    ul.innerHTML = '';
    const all = Snapshots.list();
    if (!all.length) {
      ul.appendChild(el('li', null, el('span', { class: 'muted small' }, 'Sem snapshots ainda.')));
      return;
    }
    // sincronizar UI dos botões
    document.querySelectorAll('.snap-view-btn').forEach(b => {
      const active = b.getAttribute('data-snap-view') === _snapView;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    if (_snapView === 'chrono') {
      all.forEach(s => ul.appendChild(_renderSnapEntry(s)));
      return;
    }

    // Vista por fase — agrupa pelo vocabulário do tipo de acto, mais buckets
    // residuais (qualquer fase usada mas fora do vocabulário, depois 'sem-fase').
    const map = Snapshots.listByPhase();
    const doc = State.get();
    const orderedPhases = Snapshots.getPhasesForActType(doc?.actName).slice();
    map.forEach((_v, k) => { if (k !== 'sem-fase' && !orderedPhases.includes(k)) orderedPhases.push(k); });
    if (map.has('sem-fase')) orderedPhases.push('sem-fase');

    let anyShown = false;
    orderedPhases.forEach(phase => {
      const entries = map.get(phase);
      if (!entries || !entries.length) return;
      anyShown = true;
      const header = el('li', { class: 'snap-phase-group' },
        el('div', { class: 'snap-phase-label' }, phase === 'sem-fase' ? 'Sem fase atribuída' : phase),
        el('div', { class: 'snap-phase-count muted small' }, `${entries.length} entrada(s)`),
      );
      ul.appendChild(header);
      entries.forEach(s => ul.appendChild(_renderSnapEntry(s, { hidePhaseBadge: true })));
    });
    if (!anyShown) {
      ul.appendChild(el('li', null, el('span', { class: 'muted small' }, 'Sem milestones com fase atribuída — use o selector "Fase" ao criar.')));
    }
  }

  // ----- Modal: Diff ------------------------------------------------------
  function openDiffModal(baseId, compareId) {
    const sel1 = $('#diff-base'), sel2 = $('#diff-compare');
    sel1.innerHTML = ''; sel2.innerHTML = '';
    const opts = [{ id: 'current', label: '— Rascunho actual —' }, ...Snapshots.list().map(s => ({ id: s.id, label: `${s.label} (${new Date(s.date).toLocaleDateString('pt-PT')})` }))];
    opts.forEach(o => {
      sel1.appendChild(el('option', { value: o.id }, o.label));
      sel2.appendChild(el('option', { value: o.id }, o.label));
    });
    sel1.value = baseId || (opts[1]?.id || 'current');
    sel2.value = compareId || 'current';
    $('#diff-result').innerHTML = '';
    $('#diff-modal').classList.remove('hidden');
  }
  function runDiff() {
    const baseId = $('#diff-base').value;
    const compareId = $('#diff-compare').value;
    const baseDoc = baseId === 'current' ? State.get() : Snapshots.load(baseId);
    const compDoc = compareId === 'current' ? State.get() : Snapshots.load(compareId);
    if (!baseDoc || !compDoc) { toast('Snapshot inválido.', 'error'); return; }
    const r = Diff.docs(baseDoc, compDoc);
    $('#diff-result').innerHTML = Diff.renderHtml(r);
  }

  // ----- Amendment mode ---------------------------------------------------
  function startAmendment(targetXml) {
    const parsed = ImportParser.parseAknXml(targetXml);
    const targetDoc = ImportParser.toDocState(parsed);
    const amender = Amendment.fromTarget(targetDoc);
    State.init(amender);
    State.saveDraft();
    showScreen('editor');
    refresh();
    toast('Modo alteração: edite via "+ alteração" no painel central.', 'success');
  }
  // Override do renderBody quando estamos em modo amender
  const _originalRenderBody = renderBody;
  // UI state — data seleccionada na barra "time-travel" do modo amender.
  // Não é persistida no rascunho; reinicia-se a cada sessão (default: hoje).
  let _amenderViewDate = null;
  function _todayIso() { return new Date().toISOString().slice(0, 10); }
  function _fmtPtDate(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  function _maybeRenderAmenderBody(doc) {
    if (doc.kind !== 'amender') return false;
    const main = $('#document-body');
    main.innerHTML = '';
    // Cabeçalho: diploma alvo
    main.appendChild(el('div', { class: 'amend-target-doc' },
      el('h3', null, 'Alteração a ' + doc.target.label),
      el('p', { class: 'muted small' }, doc.target.uri),
      el('div', { class: 'amend-toolbar' },
        el('button', { class: 'btn-secondary', on: { click: () => addAmendmentDialog() } }, '+ Alteração'),
      ),
    ));

    // ---- Time-travel — versão consolidada por data ----
    main.appendChild(_renderTimeTravelBar(doc));

    // Lista de alterações já feitas
    (doc.amendments || []).forEach(am => {
      const orig = (doc.target.state.body.items || []).find(a => a.id === am.articleId);
      // Editor inline da effectiveDate (ISO YYYY-MM-DD)
      const dateInput = el('input', {
        type: 'date',
        class: 'amend-effective-date',
        value: am.effectiveDate || '',
        title: am.effectiveDate
          ? `Em vigor desde ${_fmtPtDate(am.effectiveDate)}`
          : 'Sem data — aplica-se sempre',
        on: { change: (e) => {
          am.effectiveDate = e.target.value || null;
          State.saveDraft();
          refresh();
        }},
      });
      // Descritor amigável da operação para o caso de ser cirúrgica
      const opLabel = {
        'replace':           'Substituir artigo',
        'revoke':            'Revogar artigo',
        'add-after':         'Aditar artigo depois de',
        'add-before':        'Aditar artigo antes de',
        'replace-paragraph': 'Substituir n.º',
        'revoke-paragraph':  'Revogar n.º',
        'replace-subpoint':  'Substituir alínea',
        'revoke-subpoint':   'Revogar alínea',
      }[am.op] || am.op;
      const targetLabel = am.op.includes('paragraph')
        ? `${orig ? orig.num : am.articleId} · ${am.paraId}`
        : am.op.includes('subpoint')
        ? `${orig ? orig.num : am.articleId} · ${am.paraId} · ${am.subPointId}`
        : (orig ? orig.num : am.articleId);
      main.appendChild(el('div', { class: 'amend-block' },
        el('div', { class: 'amend-block-head' },
          el('div', null,
            el('span', { class: 'amend-op op-' + am.op }, opLabel),
            el('strong', null, ` ${targetLabel}`),
            orig && orig.heading ? el('em', null, ` — ${orig.heading}`) : null,
          ),
          el('div', { class: 'amend-block-date' },
            el('label', { class: 'micro' }, 'Em vigor desde:'),
            dateInput,
          ),
        ),
        am.payload?.article
          ? el('div', { class: 'muted small', style: 'margin-top:6px' },
              `Novo texto: ${am.payload.article.heading || ''} · ${am.payload.article.paragraphs?.length || 0} parágrafo(s)`)
          : am.payload?.paragraph
          ? el('div', { class: 'muted small', style: 'margin-top:6px' },
              `Novo n.º: "${(am.payload.paragraph.content || '').slice(0, 80)}${am.payload.paragraph.content?.length > 80 ? '…' : ''}"`)
          : am.payload?.subPoint
          ? el('div', { class: 'muted small', style: 'margin-top:6px' },
              `Nova alínea: "${(am.payload.subPoint.content || '').slice(0, 80)}${am.payload.subPoint.content?.length > 80 ? '…' : ''}"`)
          : null,
        el('div', { style: 'margin-top:8px;display:flex;gap:6px' },
          el('button', { class: 'btn-small btn-danger', on: { click: () => {
            Amendment.removeAmendment(doc, am.id); State.saveDraft(); refresh();
          }}}, 'Remover alteração'),
        ),
      ));
    });
    // ---- Modo inline (LoDA) — alterar o texto directamente ----
    main.appendChild(el('h3', { class: 'block-label', style: 'margin-top:32px;display:flex;justify-content:space-between;align-items:center;' },
      el('span', null, 'Articulado original — modo inline (edite directamente para gerar alterações word-level)'),
      el('span', { class: 'muted small' }, LodaInline.summary(doc)),
    ));
    (doc.target.state.body.items || []).forEach(a => {
      main.appendChild(el('div', { class: 'article-block doc-block', style: 'opacity:0.95' },
        el('div', { class: 'block-header' },
          el('span', { class: 'block-label' }, a.id),
          el('div', { class: 'block-actions' },
            el('button', { class: 'btn-small', on: { click: () => addAmendmentForArticle('replace', a) } }, 'Substituir tudo'),
            el('button', { class: 'btn-small', on: { click: () => addAmendmentForArticle('revoke', a) } }, 'Revogar'),
            el('button', { class: 'btn-small', on: { click: () => addAmendmentForArticle('add-after', a) } }, '+ Aditar após'),
          ),
        ),
        el('div', null,
          el('strong', null, a.num + (a.heading ? ' — ' + a.heading : '')),
          ...(a.paragraphs || []).map(p => {
            const current = (doc.inlineEdits && doc.inlineEdits[p.id])
              ? doc.inlineEdits[p.id].newContent
              : (p.content || '');
            const tokens = Diff.words(p.content || '', current);
            const wrap = el('div', { style: 'margin:6px 0 6px 16px' });
            // Editor inline
            wrap.appendChild(el('div', { style: 'display:grid;grid-template-columns:3em 1fr;gap:8px;align-items:start' },
              el('span', { class: 'paragraph-num', style: 'padding-top:6px' }, p.num || ''),
              el('textarea', {
                class: 'autosize',
                style: 'font-family:var(--font-text);font-size:var(--fs-base);line-height:1.65;border:1px dashed var(--color-border);padding:6px 10px;border-radius:4px;width:100%;min-height:36px;resize:none;background:var(--color-bg)',
                on: { input: e => {
                  LodaInline.editParagraph(doc, p.id, e.target.value);
                  State.saveDraft();
                  // refresh local — só re-render do preview do diff (sem re-render geral)
                  const previewEl = wrap.querySelector('.inline-diff-preview');
                  if (previewEl) {
                    previewEl.innerHTML = LodaInline.renderTokensHtml(Diff.words(p.content || '', e.target.value));
                  }
                  _autosize(e.target);
                }}
              }, current),
            ));
            // Diff preview (verde/vermelho)
            const hasDiff = tokens.some(t => t.op !== '=');
            wrap.appendChild(el('div', {
              class: 'inline-diff-preview',
              style: 'font-family:var(--font-text);font-size:0.9em;color:var(--color-muted);padding:4px 8px 4px 3em;line-height:1.5;'
                  + (hasDiff ? 'border-left:2px solid var(--color-warning);background:var(--color-warning-bg);border-radius:0 4px 4px 0;' : ''),
              html: hasDiff ? LodaInline.renderTokensHtml(tokens) : '<span class="muted small">(sem alterações)</span>',
            }));
            return wrap;
          }),
        ),
      ));
    });
    return true;
  }

  // ---- Time-travel: barra de data + preview da consolidada nessa data ----
  function _renderTimeTravelBar(doc) {
    if (!_amenderViewDate) _amenderViewDate = _todayIso();
    const timeline = Amendment.timeline(doc);   // datas distintas, ascendente

    const wrap = el('section', { class: 'amend-time-travel', 'aria-label': 'Versão consolidada por data' });

    // Cabeçalho da barra
    const head = el('div', { class: 'tt-head' },
      el('h4', null, 'Versão consolidada'),
      el('label', { class: 'tt-date-label' },
        el('span', { class: 'micro' }, 'em vigor em'),
        el('input', {
          type: 'date',
          class: 'tt-date-input',
          value: _amenderViewDate,
          on: { change: (e) => {
            _amenderViewDate = e.target.value || _todayIso();
            refresh();
          }},
        }),
      ),
      el('button', {
        class: 'btn-small tt-now',
        type: 'button',
        on: { click: () => { _amenderViewDate = _todayIso(); refresh(); }},
      }, 'Hoje'),
    );
    wrap.appendChild(head);

    // Chips com as datas-marco do timeline (mostra a evolução do diploma)
    if (timeline.length) {
      const chips = el('div', { class: 'tt-timeline' },
        el('span', { class: 'micro tt-timeline-label' }, 'Datas relevantes:'),
      );
      // "Antes" — situação inicial (antes da primeira alteração datada)
      const before = new Date(timeline[0]);
      before.setDate(before.getDate() - 1);
      const beforeIso = before.toISOString().slice(0, 10);
      chips.appendChild(_ttChip(beforeIso, 'Original', 'antes da 1.ª alteração'));
      timeline.forEach(d => {
        chips.appendChild(_ttChip(d, _fmtPtDate(d), `${_countAtDate(doc, d)} alteração(ões) acumulada(s)`));
      });
      wrap.appendChild(chips);
    } else {
      wrap.appendChild(el('p', { class: 'muted small' },
        'Nenhuma alteração tem data de entrada em vigor definida — defina-a abaixo, em cada alteração, para activar o time-travel.'));
    }

    // Resultado: contagem do que está em vigor + botão "ver consolidada"
    const inForceCount = _countAtDate(doc, _amenderViewDate);
    const totalCount = (doc.amendments || []).length;
    const summary = el('div', { class: 'tt-summary' },
      el('span', null,
        el('strong', null, `${inForceCount}`),
        ' de ',
        el('strong', null, `${totalCount}`),
        ` alteração(ões) em vigor a ${_fmtPtDate(_amenderViewDate)}.`,
      ),
      el('button', {
        class: 'btn-secondary btn-small',
        type: 'button',
        on: { click: () => _openConsolidatedPreview(doc, _amenderViewDate) },
      }, 'Ver versão consolidada →'),
    );
    wrap.appendChild(summary);

    return wrap;
  }
  function _ttChip(iso, label, title) {
    const isActive = iso === _amenderViewDate;
    return el('button', {
      class: 'tt-chip' + (isActive ? ' active' : ''),
      type: 'button',
      title,
      on: { click: () => { _amenderViewDate = iso; refresh(); }},
    }, label);
  }
  function _countAtDate(doc, isoDate) {
    return (doc.amendments || []).filter(am => {
      const eff = am.effectiveDate || null;
      if (eff === null) return true;
      return eff <= isoDate;
    }).length;
  }
  function _openConsolidatedPreview(doc, isoDate) {
    const consolidated = Amendment.applyAtDate(doc, isoDate);
    const body = $('#preview-body');
    if (!body) return;
    body.innerHTML = '';
    body.appendChild(el('div', { class: 'preview-time-banner' },
      el('strong', null, `Versão consolidada a ${_fmtPtDate(isoDate)}`),
      el('span', { class: 'micro' }, ` · ${doc.target.label}`),
    ));
    const html = Preview.render(consolidated);
    body.appendChild(el('div', { html }));
    openModal('preview-modal');
  }

  function addAmendmentDialog() {
    const doc = State.get();
    const list = (doc.target.state.body.items || []).map(a => `${a.id} — ${a.num} ${a.heading || ''}`).join('\n');
    alert('Escolha um artigo do articulado original abaixo e use os botões "Substituir / Revogar / + Aditar":\n\n' + list);
  }
  function addAmendmentForArticle(op, origArticle) {
    const doc = State.get();
    if (op === 'revoke') {
      if (!confirm(`Revogar ${origArticle.num}?`)) return;
      Amendment.addRevoke(doc, origArticle.id);
    } else if (op === 'replace') {
      const newHeading = prompt('Nova epígrafe (deixe vazio para manter):', origArticle.heading || '');
      const newContent = prompt('Novo conteúdo do parágrafo 1:', origArticle.paragraphs?.[0]?.content || '');
      const newArt = JSON.parse(JSON.stringify(origArticle));
      if (newHeading != null) newArt.heading = newHeading;
      if (newContent != null && newArt.paragraphs?.[0]) newArt.paragraphs[0].content = newContent;
      Amendment.addReplace(doc, origArticle.id, newArt);
    } else if (op === 'add-after') {
      const num = prompt('Número do novo artigo (ex. "Artigo X.º-A"):', `${origArticle.num.replace(/\.º?$/, '')}-A`);
      const heading = prompt('Epígrafe:', '');
      const content = prompt('Conteúdo do parágrafo 1:', '');
      if (!num) return;
      const newId = origArticle.id + '_bis';
      const newArt = {
        id: newId, num, heading: heading || '',
        paragraphs: [{ id: newId + '__para_1', num: '', content: content || '', subPoints: [] }],
      };
      Amendment.addAddAfter(doc, origArticle.id, newArt);
    }
    State.saveDraft();
    refresh();
  }

  // Patch renderBody: se for amender, usa o renderer próprio
  const _wrapRenderBody = renderBody;
  // Substituir só a primeira ocorrência via shadow — apanhamos via refresh()

  // =========================================================================
  // ===== Renderers v3 (Cockpit de drafting) ================================
  // =========================================================================

  // ---------- Pilha (substitui o TOC sidebar antigo) ----------------------
  function renderStack() {
    const ul = $('#stack-list');
    if (!ul) return;
    ul.innerHTML = '';
    const entries = Stack.list();
    const activeId = Stack.activeId();

    if (!entries.length) {
      ul.appendChild(el('li', { class: 'stack-empty' },
        'Sem rascunhos. Comece um abaixo ou regresse à escolha de tipo.'));
      return;
    }

    entries.forEach(e => {
      const t = (typeof ACT_TYPES !== 'undefined') ? ACT_TYPES.find(x => x.id === e.actName) : null;
      const isActive = e.id === activeId;
      const item = el('li', {
        class: 'stack-item' + (isActive ? ' active' : '') + (e.kind === 'amender' ? ' amender' : ''),
        role: 'option',
        'aria-selected': isActive ? 'true' : 'false',
        on: { click: () => switchToStackEntry(e.id) },
      },
        el('div', { class: 'stack-item-marker' }, isActive ? '▣' : '▢'),
        el('div', { class: 'stack-item-body' },
          el('div', { class: 'stack-item-title' },
            t ? t.name : (e.actName || 'rascunho'),
            e.number ? el('span', { class: 'stack-item-num' }, ` n.º ${e.number}/${e.year}`) : null,
          ),
          e.shortTitle
            ? el('div', { class: 'stack-item-ementa' }, e.shortTitle)
            : el('div', { class: 'stack-item-ementa muted' }, 'sem ementa'),
          el('div', { class: 'stack-item-meta' }, _relativeTime(e.lastModified)),
        ),
        el('button', {
          class: 'stack-item-close',
          title: 'Remover este rascunho',
          on: { click: (ev) => {
            ev.stopPropagation();
            if (!confirm(`Apagar rascunho "${(e.shortTitle || e.actName).slice(0, 60)}"?`)) return;
            Stack.remove(e.id);
            // se era o activo, voltar à landing
            if (isActive) showScreen('landing');
            else renderStack();
          }}
        }, '×'),
      );
      ul.appendChild(item);
    });
  }

  function switchToStackEntry(id) {
    // grava o doc actual no seu slot, carrega o novo, refresca
    const doc = Stack.activate(id);
    if (!doc) { toast('Rascunho indisponível.', 'error'); return; }
    State.init(doc);
    refresh();
  }

  // ---------- Breadcrumb (substitui o TOC sidebar como navegação) ---------
  function renderBreadcrumb(doc) {
    const bc = $('#breadcrumb');
    if (!bc) return;
    bc.innerHTML = '';
    const type = (typeof ACT_TYPES !== 'undefined') ? ACT_TYPES.find(t => t.id === doc.actName) : null;

    const crumbs = [];
    crumbs.push({ label: type ? type.name : 'Documento', href: null });
    if (doc.recitals && doc.recitals.length) {
      crumbs.push({ label: 'Preâmbulo', href: '#' + doc.recitals[0].id });
    }
    if (doc.body && doc.body.items && doc.body.items.length) {
      crumbs.push({
        label: doc.body.kind === 'articles' ? 'Articulado'
             : doc.body.kind === 'hierarchic' ? 'Articulado'
             : 'Pontos resolutivos',
        href: '#' + doc.body.items[0].id,
      });
    }
    if (doc.attachments && doc.attachments.length) {
      crumbs.push({ label: 'Anexos', href: '#' + doc.attachments[0].id });
    }

    crumbs.forEach((c, i) => {
      if (i > 0) bc.appendChild(el('span', { class: 'breadcrumb-sep' }, '›'));
      if (c.href) {
        bc.appendChild(el('a', {
          class: 'breadcrumb-link',
          href: c.href,
          on: { click: (ev) => {
            ev.preventDefault();
            const target = document.querySelector(c.href);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        }, c.label));
      } else {
        bc.appendChild(el('span', { class: 'breadcrumb-current' }, c.label));
      }
    });

    // Mini-TOC scrollable — chips com TODOS os artigos
    // (sem limite arbitrário; scroll horizontal + fade no fim como indicador)
    // Em modo articulado, os chips são draggable: arrastá-los reordena artigos
    // e dispara renumber cascading. Não-articulado (RCM) não suporta reorder.
    if (doc.body && doc.body.items && doc.body.items.length > 1) {
      const wrap = el('div', { class: 'breadcrumb-mini-toc-wrap' });
      const isArticulado = doc.body.kind === 'articles';
      const mini = el('div', {
        class: 'breadcrumb-mini-toc' + (isArticulado ? ' is-reorderable' : ''),
        role: 'tablist',
        'aria-label': isArticulado ? 'Navegar para artigo ou arrastar para reordenar' : 'Navegar para ponto',
      });
      const items = doc.body.items;
      items.forEach(a => {
        const chip = el('a', {
          class: 'mini-toc-chip',
          href: '#' + a.id,
          title: a.heading
            ? `${a.num || a.id} — ${a.heading}${isArticulado ? ' · arraste para reordenar' : ''}`
            : (a.num || a.id),
          ...(isArticulado ? { draggable: 'true', 'data-eid': a.id } : {}),
          on: { click: (ev) => {
            ev.preventDefault();
            const target = document.querySelector('#' + a.id);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        }, a.num || a.id);
        if (isArticulado) _wireMiniTocDrag(chip, mini);
        mini.appendChild(chip);
      });
      wrap.appendChild(mini);
      // Contador discreto (não interfere com o scroll)
      wrap.appendChild(el('span', { class: 'mini-toc-count' },
        `${items.length} ${items.length === 1 ? 'artigo' : 'artigos'}`));
      bc.appendChild(wrap);
    }
  }

  // Liga handlers HTML5 drag-and-drop a um chip do mini-TOC. Estado de drag
  // (chip a ser arrastado) vive no `mini` container via dataset, para
  // sobreviver ao dragover de outros chips.
  function _wireMiniTocDrag(chip, mini) {
    chip.addEventListener('dragstart', (ev) => {
      const eid = chip.getAttribute('data-eid');
      if (!eid) return;
      ev.dataTransfer.setData('text/plain', eid);
      ev.dataTransfer.effectAllowed = 'move';
      chip.classList.add('is-dragging');
      mini.dataset.dragSrc = eid;
    });
    chip.addEventListener('dragend', () => {
      chip.classList.remove('is-dragging');
      delete mini.dataset.dragSrc;
      mini.querySelectorAll('.mini-toc-chip').forEach(c => {
        c.classList.remove('drop-before', 'drop-after');
      });
    });
    chip.addEventListener('dragover', (ev) => {
      const src = mini.dataset.dragSrc;
      const tgt = chip.getAttribute('data-eid');
      if (!src || src === tgt) return;
      ev.preventDefault();
      ev.dataTransfer.dropEffect = 'move';
      const rect = chip.getBoundingClientRect();
      const before = (ev.clientX - rect.left) < rect.width / 2;
      mini.querySelectorAll('.mini-toc-chip').forEach(c => {
        c.classList.remove('drop-before', 'drop-after');
      });
      chip.classList.add(before ? 'drop-before' : 'drop-after');
    });
    chip.addEventListener('dragleave', () => {
      chip.classList.remove('drop-before', 'drop-after');
    });
    chip.addEventListener('drop', (ev) => {
      ev.preventDefault();
      const src = ev.dataTransfer.getData('text/plain') || mini.dataset.dragSrc;
      const tgt = chip.getAttribute('data-eid');
      if (!src || !tgt || src === tgt) return;
      const before = chip.classList.contains('drop-before');
      const doc = State.get();
      if (!doc || doc.body.kind !== 'articles') return;
      const currentIds = doc.body.items.map(a => a.id);
      const without = currentIds.filter(id => id !== src);
      let tgtIdx = without.indexOf(tgt);
      if (tgtIdx < 0) return;
      const insertAt = before ? tgtIdx : tgtIdx + 1;
      const next = without.slice(0, insertAt).concat([src], without.slice(insertAt));
      State.reorderArticles(next);
      // Limpar classes + refrescar UI; toast aparece automaticamente via refresh.
      mini.querySelectorAll('.mini-toc-chip').forEach(c => {
        c.classList.remove('drop-before', 'drop-after', 'is-dragging');
      });
      refresh();
    });
  }

  // ---------- Régua de actividade unificada -------------------------------
  let _activityFilter = 'all';
  function renderActivity(doc) {
    const feed = $('#activity-feed');
    if (!feed) return;
    feed.innerHTML = '';

    if (typeof Activity === 'undefined') {
      feed.appendChild(el('li', { class: 'activity-empty' }, 'Módulo Activity indisponível.'));
      return;
    }

    const events = Activity.allForDoc(doc).filter(e =>
      _activityFilter === 'all' || e.kind === _activityFilter);

    if (!events.length) {
      feed.appendChild(el('li', { class: 'activity-empty' },
        _activityFilter === 'all'
          ? 'Sem actividade ainda. Comece a escrever ou importe um diploma.'
          : 'Nenhum evento neste filtro.'));
      return;
    }

    events.forEach(e => feed.appendChild(_renderActivityItem(e, doc)));
  }

  function _renderActivityItem(e, doc) {
    const icon = {
      validation: e.data.level === 'error' ? '✗' : '⚠',
      comment: '✎',
      snapshot: '⟲',
      ia: '✦',
      footprint: '⚖',
      ref: '↗',
      import: '↥',
    }[e.kind] || '·';

    const kindClass = `activity-${e.kind}` + (e.data && e.data.level ? ` lvl-${e.data.level}` : '');

    let title = '';
    let body = '';
    let target = null;
    let extra = null;   // bloco opcional adicional (e.g. lista expandida de refs)

    switch (e.kind) {
      case 'validation':
        title = e.data.level === 'error' ? 'Erro' : 'Aviso';
        body = e.data.msg;
        if (e.data.eId) target = e.data.eId;
        break;
      case 'comment':
        title = 'Comentários';
        body = e.live ? `${e.data.open} abertos` : (e.data.msg || 'novo comentário');
        break;
      case 'snapshot':
        title = 'Snapshot';
        body = e.data.label || 'sem etiqueta';
        break;
      case 'ia':
        title = 'Assistente IA';
        body = e.data.task || 'invocado';
        break;
      case 'footprint':
        title = 'Pegada legislativa';
        body = e.data.summary || `${e.data.steps || 0} step(s)`;
        break;
      case 'ref':
        title = 'Referências';
        body = e.live
          ? `${e.data.total} (${e.data.internal} int. · ${e.data.externalPt} PT · ${e.data.externalUe} UE)`
          : (e.data.label || '');
        if (e.live) extra = _renderRefsExpanded(doc);
        break;
      case 'import':
        title = 'Importação';
        body = e.data.summary || '';
        break;
      default:
        title = e.kind;
        body = JSON.stringify(e.data);
    }

    return el('li', {
      class: `activity-item ${kindClass}` + (e.live ? ' live' : ''),
      'data-kind': e.kind,
      'data-id': e.id,
    },
      el('span', { class: 'activity-icon' }, icon),
      el('div', { class: 'activity-content' },
        el('div', { class: 'activity-row' },
          el('span', { class: 'activity-title' }, title),
          el('span', { class: 'activity-time' }, e.live ? 'agora' : _relativeTime(e.timestamp)),
        ),
        el('div', { class: 'activity-body' }, body),
        target ? el('a', {
          class: 'activity-link',
          href: '#' + target,
          on: { click: (ev) => {
            ev.preventDefault();
            const t = document.querySelector('#' + target);
            if (t) {
              t.scrollIntoView({ behavior: 'smooth', block: 'center' });
              t.classList.add('flash');
              setTimeout(() => t.classList.remove('flash'), 1200);
            }
          }}
        }, '→ ir ao ' + target) : null,
        extra,
      ),
    );
  }

  // Lista detalhada de referências, embutida no item "Referências" do feed.
  // Usa <details>/<summary> para ter expand/collapse nativo (a11y + sem state JS).
  function _renderRefsExpanded(doc) {
    if (typeof References === 'undefined' || !References.listAllForDoc) return null;
    const all = References.listAllForDoc(doc);
    if (!all.length) return null;

    const details = el('details', { class: 'refs-detail' });
    const broken = all.filter(r => r.broken).length;
    const summary = el('summary', { class: 'refs-detail-summary' },
      el('span', null, 'Ver lista'),
      broken
        ? el('span', { class: 'refs-detail-broken' }, ` · ${broken} alvo${broken === 1 ? '' : 's'} inexistente${broken === 1 ? '' : 's'}`)
        : null,
    );
    details.appendChild(summary);

    // Filtros por tipo (chip toggle) — clientside, sem rerender do feed
    const filters = el('div', { class: 'refs-detail-filters' });
    const counts = {
      all: all.length,
      internal: all.filter(r => r.href.startsWith('#') && !r.broken).length,
      broken: broken,
      'external-pt': all.filter(r => r.kind === 'external-pt').length,
      'external-ue': all.filter(r => r.kind === 'external-ue').length,
    };
    const FILTER_LABEL = {
      all: 'Todas', internal: 'Internas', broken: 'Broken',
      'external-pt': 'PT', 'external-ue': 'UE',
    };
    const list = el('ul', { class: 'refs-detail-list' });
    let activeFilter = 'all';
    function matches(r, f) {
      if (f === 'all') return true;
      if (f === 'internal') return r.href.startsWith('#') && !r.broken;
      if (f === 'broken') return r.broken;
      return r.kind === f;
    }
    function rerender() {
      list.innerHTML = '';
      const visible = all.filter(r => matches(r, activeFilter));
      if (!visible.length) {
        list.appendChild(el('li', { class: 'muted small' }, 'Nenhuma neste filtro.'));
        return;
      }
      visible.forEach(r => {
        const isInternal = r.href.startsWith('#');
        const cls = 'ref-row'
          + (r.broken ? ' broken' : '')
          + (isInternal ? ' kind-internal' : ` kind-${r.kind}`);
        const onClick = (ev) => {
          if (isInternal && !r.broken) {
            ev.preventDefault();
            const tEl = document.querySelector(r.href);
            if (tEl) {
              tEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              tEl.classList.add('flash');
              setTimeout(() => tEl.classList.remove('flash'), 1200);
            }
          }
          // externos: deixar o browser abrir o link
        };
        list.appendChild(el('li', { class: cls },
          el('a', {
            class: 'ref-row-link',
            href: r.href,
            target: isInternal ? null : '_blank',
            rel: isInternal ? null : 'noopener noreferrer',
            title: r.href,
            on: { click: onClick },
          },
            el('span', { class: 'ref-row-raw' }, `"${r.raw}"`),
            el('span', { class: 'ref-row-where' }, r.where),
          ),
        ));
      });
    }
    Object.entries(counts).forEach(([k, n]) => {
      if (!n && k !== 'all') return;
      const chip = el('button', {
        class: 'refs-detail-chip' + (k === activeFilter ? ' active' : '')
          + (k === 'broken' ? ' broken' : ''),
        type: 'button',
        on: { click: (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          activeFilter = k;
          filters.querySelectorAll('.refs-detail-chip').forEach(c =>
            c.classList.toggle('active', c.dataset.f === k));
          rerender();
        }},
        'data-f': k,
      }, `${FILTER_LABEL[k]} ${n}`);
      filters.appendChild(chip);
    });
    details.appendChild(filters);
    details.appendChild(list);
    rerender();
    return details;
  }

  function _relativeTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const delta = (Date.now() - d.getTime()) / 1000;
    if (delta < 60) return 'agora mesmo';
    if (delta < 3600) return `há ${Math.floor(delta / 60)} min`;
    if (delta < 86400) return `há ${Math.floor(delta / 3600)} h`;
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
  }

  // ---------- Validação inline no canvas ---------------------------------
  // Sublinha em oxblood/brass os blocos do canvas que têm issues, e
  // dispara um pulso (flash) na primeira vez que aparecem.
  let _seenIssueIds = new Set();
  function _applyInlineValidation(doc) {
    if (typeof Validation === 'undefined') return;
    const issues = Validation.check(doc);
    const stillSeen = new Set();
    // Limpar marcações anteriores
    $$('.canvas-validation-mark').forEach(node => {
      node.classList.remove('canvas-validation-mark', 'val-error', 'val-warn');
      node.removeAttribute('data-val-msg');
    });
    issues.forEach(i => {
      if (!i.eId) return;
      const node = document.getElementById(i.eId);
      if (!node) return;
      const cls = i.level === 'error' ? 'val-error' : 'val-warn';
      node.classList.add('canvas-validation-mark', cls);
      const existing = node.getAttribute('data-val-msg') || '';
      node.setAttribute('data-val-msg',
        existing ? `${existing}\n${i.msg}` : i.msg);
      const fingerprint = `${i.eId}|${i.level}|${i.msg}`;
      stillSeen.add(fingerprint);
      if (!_seenIssueIds.has(fingerprint)) {
        // primeira vez que vemos este issue — pulso curto
        node.classList.add('val-pulse');
        setTimeout(() => node.classList.remove('val-pulse'), 280);
      }
    });
    _seenIssueIds = stillSeen;
  }

  // ---------- Cmd-K palette — registo central de acções ------------------
  function _setupCmdK() {
    if (typeof CmdK === 'undefined') return;
    const actions = [
      // ---- Estrutura do documento ----
      { id: 'add-recital', label: 'Adicionar considerando', group: 'Estrutura', hint: 'no preâmbulo',
        fn: () => { State.addRecital(); refresh(); },
        when: (doc) => doc && doc.body && doc.body.kind !== 'paragraphs' },
      { id: 'add-article', label: 'Adicionar artigo', group: 'Estrutura', hint: 'no fim do articulado',
        fn: () => { State.addArticle(); refresh(); },
        when: (doc) => doc && doc.body && doc.body.kind === 'articles' },
      { id: 'add-paragraph', label: 'Adicionar ponto resolutivo', group: 'Estrutura',
        fn: () => { State.addParagraph(null); refresh(); },
        when: (doc) => doc && doc.body && doc.body.kind === 'paragraphs' },
      { id: 'add-attachment', label: 'Adicionar anexo', group: 'Estrutura',
        fn: () => { State.addAttachment(); refresh(); } },
      // ---- Revisão / qualidade ----
      { id: 'validate', label: 'Validar agora', group: 'Revisão', hint: 'verifica consistência',
        fn: () => { refresh(); toast('Validação refrescada.', 'success'); } },
      { id: 'snapshots', label: 'Snapshots e versões', group: 'Revisão',
        fn: () => openSnapshotsModal() },
      { id: 'diff', label: 'Comparar versões', group: 'Revisão',
        fn: () => openDiffModal() },
      { id: 'preview', label: 'Pré-visualizar como documento', group: 'Revisão',
        fn: () => { $('#preview-body').innerHTML = Preview.render(State.get()); openModal('preview-modal'); } },
      { id: 'view-xml', label: 'Ver XML AKN-PT', group: 'Revisão', hint: 'live',
        fn: () => {
          const doc = State.get();
          const xml = doc.kind === 'amender'
            ? Amendment.toAknXml(doc)
            : AknExport.toXml(doc);
          $('#xml-modal-body').textContent = xml;
          openModal('xml-modal');
        } },
      { id: 'view-eli', label: 'Ver metadados ELI', group: 'Revisão', hint: 'JSON-LD + URIs',
        fn: () => openEliModal() },
      // ---- IA ----
      { id: 'ai-settings', label: 'Definições do assistente IA', group: 'IA',
        fn: () => openAiSettingsModal() },
      { id: 'ai-heading', label: 'IA — sugerir epígrafe para artigo sem título', group: 'IA',
        fn: () => runAiTask('suggestHeading', 'Sugerir epígrafe', State.get()) },
      { id: 'ai-simplify', label: 'IA — simplificar texto seleccionado', group: 'IA',
        fn: () => runAiTask('simplify', 'Simplificar texto', State.get()) },
      { id: 'ai-ambiguity', label: 'IA — detectar ambiguidade', group: 'IA',
        fn: () => runAiTask('detectAmbiguity', 'Detectar ambiguidade', State.get()) },
      // ---- Importação / alteração ----
      { id: 'import', label: 'Importar diploma não marcado', group: 'Importar',
        fn: () => openModal('import-modal') },
      { id: 'amend', label: 'Alterar diploma existente (AKN-PT)', group: 'Importar',
        fn: () => $('#file-input-amend-xml').click() },
      { id: 'save', label: 'Guardar rascunho agora', group: 'Sessão',
        fn: () => { State.saveDraft(); Stack.persistActive(); toast('Rascunho guardado.', 'success'); } },
      { id: 'back', label: 'Voltar à escolha de tipo', group: 'Sessão',
        fn: () => showScreen('landing') },
      // ---- Experimentais (só com ?lab=1) ----
      { id: 'bluebell', label: 'Editar como texto (Bluebell-PT)', group: 'Laboratório', hint: 'experimental',
        fn: () => openTextModal(),
        when: () => _isLab() },
      { id: 'collab', label: 'Partilhar / colaborar', group: 'Laboratório', hint: 'experimental',
        fn: () => openCollabModal(),
        when: () => _isLab() },
    ];
    CmdK.init(actions);
  }

  function _isLab() {
    if (typeof window === 'undefined') return false;
    if (window.location.search.includes('lab=1')) return true;
    try { return localStorage.getItem('akn-pt-lab') === '1'; } catch { return false; }
  }

  // ---------- Activity filter wiring -------------------------------------
  function _setupActivityFilters() {
    $$('.activity-filter').forEach(b => {
      b.addEventListener('click', () => {
        $$('.activity-filter').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        _activityFilter = b.dataset.filter;
        const doc = State.get();
        if (doc) renderActivity(doc);
      });
    });
  }

  // ----- Wire up event handlers --------------------------------------------
  // ============= MENU SYSTEM (única fonte de verdade) ====================
  // Comporta-se como dropdown/menubar: click-outside fecha, ESC fecha,
  // escolher uma opção fecha, abrir um menu fecha os outros.
  function _setupMenus() {
    const allTriggers = $$('[data-menu-trigger]');
    function closeAll() {
      $$('[data-menu-panel]').forEach(p => p.classList.remove('open'));
      $$('[data-menu-trigger]').forEach(t => t.setAttribute('aria-expanded', 'false'));
    }
    allTriggers.forEach(trigger => {
      const menu = trigger.closest('[data-menu]');
      const panel = menu?.querySelector('[data-menu-panel]');
      if (!panel) return;
      trigger.setAttribute('aria-haspopup', 'menu');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const isOpen = panel.classList.contains('open');
        closeAll();
        if (!isOpen) {
          panel.classList.add('open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
      // Clicar numa opção fecha o menu
      panel.querySelectorAll('button, [role="menuitem"]').forEach(item => {
        item.addEventListener('click', () => closeAll());
      });
    });
    document.addEventListener('click', (ev) => {
      if (!ev.target.closest('[data-menu]')) closeAll();
    });
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') closeAll();
    });
  }

  // ============= MODAL SYSTEM ============================================
  function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('hidden');
  }
  function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('hidden');
  }
  function _setupModals() {
    // botões com data-close="<id>" fecham o modal correspondente
    $$('[data-close]').forEach(b => {
      b.addEventListener('click', () => closeModal(b.dataset.close));
    });
    // ESC fecha o modal mais recente aberto
    document.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Escape') return;
      const open = $$('.modal:not(.hidden)');
      if (open.length) open[open.length - 1].classList.add('hidden');
    });
    // click no backdrop (fora do modal-content) fecha
    $$('[data-modal]').forEach(m => {
      m.addEventListener('click', (ev) => {
        if (ev.target === m) m.classList.add('hidden');
      });
    });
  }

  // ============= EXPORT (handler único) ==================================
  async function _doExport(kind) {
    const doc = State.get();
    try {
      if (kind === 'xml') {
        doc.kind === 'amender' ? downloadAmenderXml(doc) : AknExport.download(doc);
        toast('XML exportado.', 'success');
        try { Snapshots.autoSnapshot('antes de exportar'); } catch {}
      } else if (kind === 'xml-with-comments') {
        const tagged = { ...doc, _exportWithComments: true };
        const xml = doc.kind === 'amender' ? Amendment.toAknXml(tagged) : AknExport.toXml(tagged);
        _download(xml, `${doc.actName}-${doc.number || 'X'}-${doc.year}-com-coments.akn.xml`, 'application/xml;charset=utf-8');
        toast('XML com comentários exportado.', 'success');
      } else if (kind === 'pdf') {
        Exporters.exportPdf(doc);
      } else if (kind === 'docx') {
        Exporters.exportDocx(doc);
        toast('Word exportado.', 'success');
      } else if (kind === 'eli-jsonld') {
        const jsonld = EliMetadata.toJsonLdString(doc);
        _download(jsonld, `${doc.actName}-${doc.number || 'X'}-${doc.year}.eli.jsonld`, 'application/ld+json;charset=utf-8');
        toast('Metadados ELI (JSON-LD) exportados.', 'success');
      } else if (kind === 'bluebell') {
        const text = BluebellPt.serialize(doc);
        _download(text, `${doc.actName}-${doc.number || 'X'}-${doc.year}.bb.txt`, 'text/plain;charset=utf-8');
        toast('Texto Bluebell-PT exportado.', 'success');
      } else if (kind === 'share-url') {
        const url = await Collab.makeShareUrl(doc);
        if (!url) { toast('Documento demasiado grande — use export XML.', 'warn'); return; }
        await navigator.clipboard.writeText(url);
        toast('URL copiado para a área de transferência.', 'success');
      } else if (kind === 'amender-xml') {
        downloadAmenderXml(doc);
      } else if (kind === 'consolidated-xml') {
        downloadConsolidatedXml(doc);
      }
    } catch (e) {
      toast('Erro: ' + e.message, 'error');
    }
  }

  // ============= ACÇÕES DO OVERFLOW (⋯) ==================================
  function _doAction(action) {
    if (action === 'open-snapshots') openSnapshotsModal();
    else if (action === 'open-diff') openDiffModal();
    else if (action === 'save-draft') { State.saveDraft(); toast('Rascunho guardado.', 'success'); }
    else if (action === 'open-text') openTextModal();
    else if (action === 'open-collab') openCollabModal();
    else if (action === 'open-ai-settings') openAiSettingsModal();
    else if (action === 'open-import') openModal('import-modal');
    else if (action === 'open-amend') $('#file-input-amend-xml').click();
  }

  function bindGlobal() {
    // Voltar
    $('#btn-back').addEventListener('click', () => {
      if (confirm('Voltar à escolha do tipo? O rascunho fica guardado.')) {
        showScreen('landing');
      }
    });

    // Topbar primary actions (preview foi removido — acessível via Cmd-K)
    $('#btn-preview')?.addEventListener('click', () => {
      $('#preview-body').innerHTML = Preview.render(State.get());
      openModal('preview-modal');
    });
    $('#btn-validate')?.addEventListener('click', () => {
      refresh();
      // No layout v3 a validação vive na régua (sempre visível); só refrescar
      // chega. Em layouts legacy (tabs) ainda saltamos para a tab Revisão.
      const reviewTab = $('[data-tab="review"]');
      if (reviewTab) {
        $$('.tab').forEach(t => t.classList.remove('active'));
        reviewTab.classList.add('active');
        $$('.tab-pane').forEach(p => p.classList.remove('active'));
        $('[data-pane="review"]')?.classList.add('active');
      }
      const valSection = $('[data-section="validation"]')?.closest('details');
      if (valSection) valSection.open = true;
      toast('Validação refrescada.', 'success');
    });

    // Setup menus + modais + Cmd-K + filtros da régua
    _setupMenus();
    _setupModals();
    _setupCmdK();
    _setupActivityFilters();
    _setupFeatureFlags();

    // Cmd-K trigger no masthead
    $('#btn-cmdk')?.addEventListener('click', () => CmdK.open());

    // Botão "+ novo rascunho" da pilha → volta à landing
    $('#stack-new')?.addEventListener('click', () => showScreen('landing'));

    // Export menu items
    $$('[data-export]').forEach(b => {
      b.addEventListener('click', () => _doExport(b.dataset.export));
    });
    // Overflow menu items
    $$('[data-action]').forEach(b => {
      // não interceptar os botões da panel-actions (já tratados abaixo) nem links da landing
      if (b.closest('.panel-actions') || b.closest('#landing')) return;
      b.addEventListener('click', () => _doAction(b.dataset.action));
    });

    // Sidebar (TOC) action buttons
    $$('.panel-actions [data-action]').forEach(b => {
      b.addEventListener('click', () => {
        const a = b.dataset.action;
        if (a === 'add-recital') State.addRecital();
        if (a === 'add-article') State.addArticle();
        if (a === 'add-paragraph') State.addParagraph(null);
        if (a === 'add-attachment') State.addAttachment();
        refresh();
      });
    });

    // Tabs (4)
    $$('.tab').forEach(t => {
      t.addEventListener('click', () => {
        $$('.tab').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        $$('.tab-pane').forEach(p => p.classList.remove('active'));
        $(`[data-pane="${t.dataset.tab}"]`).classList.add('active');
      });
    });

    // Landing links
    $('#load-draft').addEventListener('click', e => {
      e.preventDefault();
      const draft = State.loadDraft();
      if (!draft) { toast('Sem rascunho guardado.', 'warn'); return; }
      State.init(draft);
      showScreen('editor');
      refresh();
      toast('Rascunho carregado.', 'success');
    });
    // Import existing AKN-PT XML (round-trip)
    $('#open-existing').addEventListener('click', e => {
      e.preventDefault();
      $('#file-input-xml').click();
    });
    $('#file-input-xml').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const parsed = ImportParser.parseAknXml(ev.target.result);
          applyImport(parsed);
          toast(`XML importado: ${parsed.actType} n.º ${parsed.number}/${parsed.year}`, 'success');
        } catch (err) {
          toast('Erro ao importar XML: ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
    });

    // Import unmarked document — link na landing
    $('#open-import').addEventListener('click', e => {
      e.preventDefault();
      openModal('import-modal');
    });

    // Import modal tabs
    $$('.import-tab').forEach(t => {
      t.addEventListener('click', () => {
        $$('.import-tab').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        $$('.import-pane').forEach(p => p.classList.add('hidden'));
        $(`[data-import-pane="${t.dataset.import}"]`).classList.remove('hidden');
      });
    });

    // Import text
    $('#import-text-btn').addEventListener('click', () => {
      const text = $('#import-text').value.trim();
      if (!text) { toast('Cole texto primeiro.', 'warn'); return; }
      doImport(text);
    });

    // Import DOCX
    $('#import-docx-btn').addEventListener('click', () =>
      $('#file-input-docx').click());
    $('#file-input-docx').addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      $('#docx-status').textContent = 'A carregar mammoth.js da CDN...';
      try {
        const buffer = await file.arrayBuffer();
        $('#docx-status').textContent = 'A extrair texto e analisar...';
        const parsed = await ImportParser.parseDocx(buffer);
        applyImport(parsed);
        $('#docx-status').textContent = '';
      } catch (err) {
        $('#docx-status').textContent = '';
        toast('Erro ao importar DOCX: ' + err.message, 'error');
      }
    });

    // Import example
    $('#import-example-btn').addEventListener('click', () => doImport(EXAMPLE_PORTARIA));

    // Snapshots modal actions
    $('#snap-create')?.addEventListener('click', () => {
      try {
        const label = $('#snap-label').value.trim();
        const phase = $('#snap-phase')?.value || '';
        const opts = phase ? { phase } : {};
        const e = Snapshots.save(label, opts);
        if (typeof Activity !== 'undefined') {
          Activity.log(phase ? 'milestone' : 'snapshot', { label: e.label, phase: phase || null });
        }
        toast(phase ? `Milestone "${e.label}" (${phase}) criada.` : `Snapshot "${e.label}" criado.`, 'success');
        $('#snap-label').value = '';
        renderSnapshotsList();
      } catch (err) { toast(err.message, 'error'); }
    });
    // Toggle Cronológica/Por fase
    document.querySelectorAll('.snap-view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        _snapView = btn.getAttribute('data-snap-view') || 'chrono';
        renderSnapshotsList();
      });
    });
    $('#diff-run')?.addEventListener('click', runDiff);

    // Bluebell modal — compilar / sincronizar
    $('#bluebell-compile')?.addEventListener('click', () => {
      try {
        const newDoc = BluebellPt.parseToDoc($('#bluebell-editor').value, State.get());
        State.init(newDoc);
        State.saveDraft();
        closeModal('text-modal');
        refresh();
        toast('Compilado para AKN-PT.', 'success');
      } catch (e) { toast('Erro: ' + e.message, 'error'); }
    });
    $('#bluebell-sync')?.addEventListener('click', () => {
      $('#bluebell-editor').value = BluebellPt.serialize(State.get());
      toast('Texto sincronizado.', 'success');
    });

    // Amendment mode — modal com 3 fontes (texto / docx / xml)
    $('#open-amend')?.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('amend-modal');
    });
    // tabs
    $$('[data-amend-tab]').forEach(t => {
      t.addEventListener('click', () => {
        $$('[data-amend-tab]').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        $$('[data-amend-pane]').forEach(p => p.classList.add('hidden'));
        $(`[data-amend-pane="${t.dataset.amendTab}"]`).classList.remove('hidden');
      });
    });
    // texto colado
    $('#amend-text-btn')?.addEventListener('click', () => {
      const text = $('#amend-text').value.trim();
      if (!text) { toast('Cole o texto do diploma original.', 'warn'); return; }
      try {
        const parsed = ImportParser.parse(text);
        const targetDoc = ImportParser.toDocState(parsed);
        _startAmendFromDoc(targetDoc);
      } catch (err) { toast('Erro ao analisar texto: ' + err.message, 'error'); }
    });
    // .docx
    $('#amend-docx-btn')?.addEventListener('click', () =>
      $('#file-input-amend-docx').click());
    $('#file-input-amend-docx')?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const status = $('#amend-docx-status');
      status.textContent = 'A carregar mammoth.js da CDN...';
      try {
        const buffer = await file.arrayBuffer();
        status.textContent = 'A extrair texto e analisar...';
        const parsed = await ImportParser.parseDocx(buffer);
        const targetDoc = ImportParser.toDocState(parsed);
        status.textContent = '';
        _startAmendFromDoc(targetDoc);
      } catch (err) {
        status.textContent = '';
        toast('Erro ao carregar .docx: ' + err.message, 'error');
      }
    });
    // AKN-PT XML (fluxo legado — agora via modal)
    $('#amend-xml-btn')?.addEventListener('click', () =>
      $('#file-input-amend-xml').click());
    $('#file-input-amend-xml')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try { startAmendment(ev.target.result); closeModal('amend-modal'); }
        catch (err) { toast('Erro: ' + err.message, 'error'); }
      };
      reader.readAsText(file);
    });
  }

  // Inicia o modo amender a partir de um docState já parseado (de texto/docx/xml).
  // Reusado pelas três fontes para garantir comportamento idêntico.
  function _startAmendFromDoc(targetDoc) {
    const amender = Amendment.fromTarget(targetDoc);
    State.init(amender);
    if (typeof Stack !== 'undefined') Stack.add(amender);
    State.saveDraft();
    closeModal('amend-modal');
    showScreen('editor');
    refresh();
    if (typeof Activity !== 'undefined') Activity.log('import', {
      summary: `Modo alteração: ${targetDoc.actName || 'doc'} n.º ${targetDoc.number || '?'}/${targetDoc.year || '?'}`,
    });
    toast('Modo alteração iniciado — adicione alterações no painel central.', 'success');
  }

  // Helpers de download para alterador. Antes de gerar, propagamos as edições
  // inline (LoDA) para a lista de amendments para que sejam exportadas.
  function downloadAmenderXml(doc) {
    if (typeof LodaInline !== 'undefined') LodaInline.applyToAmendmentList(doc);
    const xml = Amendment.toAknXml(doc);
    const fn = `alterador-${doc.number || 'X'}-${doc.year}.akn.xml`;
    _download(xml, fn, 'application/xml;charset=utf-8');
  }
  function downloadConsolidatedXml(doc) {
    if (typeof LodaInline !== 'undefined') LodaInline.applyToAmendmentList(doc);
    // Usar a data da time-travel bar (UI permite escolher um {point-in-time});
    // se for sentinela "hoje", consolida com todos os amendments aplicáveis até
    // hoje. toAknXmlConsolidated produz FRBR + <passiveModifications> coerentes.
    const isoDate = _amenderViewDate || _todayIso();
    let xml;
    try {
      xml = Amendment.toAknXmlConsolidated(doc, isoDate);
    } catch (e) {
      toast('Erro a consolidar: ' + e.message, 'error');
      return;
    }
    const t = doc.target?.state || {};
    const fn = `consolidado-${t.actName || 'doc'}-${t.number || 'X'}-${t.year || ''}-${isoDate}.akn.xml`;
    _download(xml, fn, 'application/xml;charset=utf-8');
    toast(`Versão consolidada a ${_fmtPtDate(isoDate)} exportada.`, 'success');
  }
  function _download(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function doImport(text) {
    try {
      const parsed = ImportParser.parse(text);
      applyImport(parsed);
      let summary = `Importado: ${parsed.actType} n.º ${parsed.number}/${parsed.year}`;
      if (parsed.bodyKind === 'articles') summary += ` · ${parsed.articles.length} artigo(s)`;
      else summary += ` · ${parsed.paragraphs.length} ponto(s)`;
      if (parsed.recitals.length) summary += ` · ${parsed.recitals.length} considerando(s)`;
      if (typeof Activity !== 'undefined') Activity.log('import', { summary });
      toast(summary, 'success');
    } catch (err) {
      toast('Erro ao importar: ' + err.message, 'error');
    }
  }

  function applyImport(parsed) {
    const doc = ImportParser.toDocState(parsed);
    State.init(doc);
    // Cada importação cria um novo slot na pilha (não sobrescreve activo)
    if (typeof Stack !== 'undefined') Stack.add(doc);
    State.saveDraft();
    $('#import-modal').classList.add('hidden');
    showScreen('editor');
    refresh();
    if (parsed.warnings && parsed.warnings.length) {
      console.warn('Import warnings:', parsed.warnings);
    }
  }

  // Sample Portaria text for the import demo (based on real DR diploma).
  const EXAMPLE_PORTARIA = `Portaria n.º 249/2021
de 22 de novembro
Regulamenta o regime de apoio extraordinario as micro e pequenas empresas afetadas pela crise energetica.

O Decreto-Lei n.º 56/2021, de 30 de junho, estabeleceu o regime juridico de apoios extraordinarios as micro e pequenas empresas em situacoes de crise excecional, atribuindo ao membro do Governo responsavel pela area da economia a regulamentacao operacional do regime.

Importa, por isso, fixar as condicoes de acesso, o procedimento de candidatura, os criterios de elegibilidade e o modelo de declaracao a apresentar pelos beneficiarios.

Manda o Governo, pelo Ministro da Economia, ao abrigo do disposto no n.º 3 do artigo 8.º do Decreto-Lei n.º 56/2021, de 30 de junho, o seguinte:

Artigo 1.º
Objeto
A presente portaria regulamenta o regime de apoio extraordinario as micro e pequenas empresas afetadas pela crise energetica, criado pelo Decreto-Lei n.º 56/2021, de 30 de junho.

Artigo 2.º
Beneficiarios
1 - Podem aceder ao apoio as empresas que cumulativamente:
a) Sejam micro ou pequenas empresas, nos termos da Recomendacao 2003/361/CE da Comissao;
b) Demonstrem quebra de margem operacional superior a 25% face a periodo homologo;
c) Tenham a situacao tributaria e contributiva regularizada.
2 - As empresas referidas no numero anterior devem ainda apresentar a declaracao constante do anexo.

Artigo 3.º
Candidatura
A candidatura e apresentada junto do IAPMEI, I.P., atraves de formulario eletronico, instruido com declaracao constante do anexo a presente portaria.

Artigo 4.º
Entrada em vigor
A presente portaria entra em vigor no dia seguinte ao da sua publicacao.

Anexo
Modelo de declaracao de candidatura

Denominacao social: _______________________________
NIPC: _____________________________________________
Sede social: ______________________________________
Declaracao sob compromisso de honra: o requerente declara cumprir todos os requisitos previstos no artigo 2.º da presente portaria.
`;

  // ---------- Feature flag handling --------------------------------------
  // Esconde elementos com .lab-only do DOM (e.g. itens do menu export que
  // são experimentais). Quando ?lab=1, mostra-os.
  function _setupFeatureFlags() {
    const lab = _isLab();
    $$('.lab-only').forEach(e => {
      if (lab) e.classList.remove('hidden');
      else e.classList.add('hidden');
    });
  }

  // ----- Init --------------------------------------------------------------
  let _initialized = false;
  async function init() {
    if (_initialized) return;  // guarda contra DOMContentLoaded duplo
    _initialized = true;
    // Migrar draft legacy para a pilha (uma vez) — não destrói nada.
    if (typeof Stack !== 'undefined') Stack.migrateLegacyIfNeeded();
    renderLanding();
    bindGlobal();
    _setupCollab();
    // Carregar doc partilhado por URL (#share=...) se existir
    if (typeof Collab !== 'undefined') {
      const shared = await Collab.loadShareFromHash();
      if (shared) {
        State.init(shared);
        showScreen('editor');
        refresh();
        toast('Documento carregado de URL partilhado.', 'success');
        // limpar hash para não recarregar em refresh
        history.replaceState(null, '', location.pathname);
      }
    }
    // Broadcast doc após cada update
    if (typeof Collab !== 'undefined') {
      const origUpdate = State.update;
      const origSave = State.saveDraft;
      State.update = function(patch) {
        const r = origUpdate(patch);
        const d = State.get(); if (d) Collab.broadcast(d);
        return r;
      };
      State.saveDraft = function() {
        const r = origSave();
        const d = State.get(); if (d) Collab.broadcast(d);
        return r;
      };
    }
  }

  return { init, refresh, toast };
})();

document.addEventListener('DOMContentLoaded', Editor.init);
if (typeof window !== 'undefined') window.Editor = Editor;
