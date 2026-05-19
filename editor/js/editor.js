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

  function toast(msg, kind = '') {
    const t = $('#toast');
    t.textContent = msg;
    t.className = `toast ${kind}`;
    setTimeout(() => t.classList.add('hidden'), 3000);
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
    State.saveDraft();
    showScreen('editor');
    refresh();
  }

  // ----- Editor UI --------------------------------------------------------
  function refresh() {
    const doc = State.get();
    if (!doc) return;
    renderTopbar(doc);
    renderToc(doc);
    // Em modo "alterador" o painel central é diferente — lista alterações
    // sobre um diploma alvo, em vez de um articulado livre.
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
      el('input', { type: 'text', value: doc.shortTitle || '', placeholder: 'Ementa do diploma',
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
    bodyContainer.appendChild(el('div', { class: 'block-header' },
      el('span', { class: 'block-label' },
        doc.body.kind === 'articles' ? 'Articulado' : 'Pontos resolutivos'),
    ));

    if (doc.body.kind === 'articles') {
      // Botão "+ artigo no início" antes do primeiro
      bodyContainer.appendChild(renderInsertHere(() => {
        State.insertArticleAt(null); refresh();
      }, '+ artigo no início'));
      doc.body.items.forEach(a => bodyContainer.appendChild(renderArticle(a, doc)));
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
          el('select', {
            on: { change: e => State.updateSignature(i, { role: e.target.value }) }
          },
            ...['signature', 'countersignature', 'promulgation'].map(r =>
              el('option', { value: r, ...(r === s.role ? { selected: true } : {}) }, r)
            )
          ),
          el('input', { type: 'text', value: s.as || '', placeholder: 'as=#actor',
            on: { input: e => State.updateSignature(i, { as: e.target.value }) }
          }),
          el('input', { type: 'text', value: s.name || '', placeholder: 'Nome do signatário (opcional)',
            on: { input: e => State.updateSignature(i, { name: e.target.value }) }
          })
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

  function renderArticle(a, doc) {
    const nC = Comments.count(doc, a.id);
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
            el('button', { on: { click: () => { State.addParagraph(a.id); refresh(); } } }, '+ número'),
            el('button', { on: { click: () => { State.removeArticle(a.id); refresh(); } } }, '× remover artigo')
          )
        ),
        el('div', null,
          el('input', { type: 'text', class: 'article-num', value: a.num,
            on: { input: e => State.updateArticle(a.id, { num: e.target.value }) }
          }),
          el('textarea', { class: 'article-heading autosize', rows: 1, placeholder: 'Epígrafe',
            on: { input: e => { State.updateArticle(a.id, { heading: e.target.value }); _autosize(e.target); } }
          }, a.heading || ''),
        ),
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
      el('textarea', { class: 'paragraph-content', value: p.content,
        placeholder: 'Texto do número (ou texto introdutório se houver alíneas)',
        on: { input: e => State.updateParagraph(p.id, articleId, { content: e.target.value }) }
      }, p.content),
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
      el('label', null, 'Ementa (short title)'),
      el('textarea', {
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
      'Busca local em ~30 diplomas de referência (Constituição, códigos, leis recentes, diretivas UE).'));
    const input = el('input', { type: 'search', placeholder: 'Pesquisar (ex. "dl 21 2023", "rgpd", "código civil")…' });
    const results = el('div', { class: 'dre-results', style: 'margin-top:8px;display:flex;flex-direction:column;gap:6px' });
    input.addEventListener('input', () => {
      const q = input.value.trim();
      results.innerHTML = '';
      if (q.length < 2) return;
      DreMock.suggest(q, 8).forEach(r => {
        results.appendChild(el('div', { class: 'dre-result-item',
          style: 'padding:6px 8px;border:1px solid var(--color-border);border-radius:4px;cursor:pointer;background:var(--color-bg)',
          on: { click: async () => {
            await navigator.clipboard.writeText(r.eli);
            toast('URI copiado: ' + r.eli, 'success');
          }} },
          el('div', { style: 'font-size:0.85em;font-weight:500' }, r.label),
          el('div', { style: 'font-size:0.7em;color:var(--color-muted);font-family:var(--font-mono);word-break:break-all' }, r.eli),
        ));
      });
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

  // ----- Modal: Snapshots -------------------------------------------------
  function openSnapshotsModal() {
    renderSnapshotsList();
    $('#snapshots-modal').classList.remove('hidden');
  }
  function renderSnapshotsList() {
    const ul = $('#snap-list');
    ul.innerHTML = '';
    const all = Snapshots.list();
    if (!all.length) {
      ul.appendChild(el('li', null, el('span', { class: 'muted small' }, 'Sem snapshots ainda.')));
      return;
    }
    all.forEach(s => {
      const li = el('li', null,
        el('div', null,
          el('span', { class: 'snap-label' + (s.auto ? ' snap-auto' : '') }, s.label),
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
      ul.appendChild(li);
    });
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
    // Lista de alterações já feitas
    (doc.amendments || []).forEach(am => {
      const orig = (doc.target.state.body.items || []).find(a => a.id === am.articleId);
      main.appendChild(el('div', { class: 'amend-block' },
        el('div', null,
          el('span', { class: 'amend-op op-' + am.op }, am.op),
          el('strong', null, ` ${orig ? orig.num : am.articleId}`),
          orig && orig.heading ? el('em', null, ` — ${orig.heading}`) : null,
        ),
        am.payload?.article
          ? el('div', { class: 'muted small', style: 'margin-top:6px' },
              `Novo texto: ${am.payload.article.heading || ''} · ${am.payload.article.paragraphs?.length || 0} parágrafo(s)`)
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

    // Topbar primary actions
    $('#btn-preview').addEventListener('click', () => {
      $('#preview-body').innerHTML = Preview.render(State.get());
      openModal('preview-modal');
    });
    $('#btn-validate').addEventListener('click', () => {
      refresh();
      // Saltar para tab Revisão e abrir a secção de validação
      $$('.tab').forEach(t => t.classList.remove('active'));
      $('[data-tab="review"]').classList.add('active');
      $$('.tab-pane').forEach(p => p.classList.remove('active'));
      $('[data-pane="review"]').classList.add('active');
      const valSection = $('[data-section="validation"]')?.closest('details');
      if (valSection) valSection.open = true;
    });

    // Setup menus + modais
    _setupMenus();
    _setupModals();

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
        const e = Snapshots.save(label);
        toast(`Snapshot "${e.label}" criado.`, 'success');
        $('#snap-label').value = '';
        renderSnapshotsList();
      } catch (err) { toast(err.message, 'error'); }
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

    // Amendment mode — link na landing + file input
    $('#open-amend')?.addEventListener('click', (e) => {
      e.preventDefault();
      $('#file-input-amend-xml').click();
    });
    $('#file-input-amend-xml')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try { startAmendment(ev.target.result); }
        catch (err) { toast('Erro: ' + err.message, 'error'); }
      };
      reader.readAsText(file);
    });
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
    const consolidated = Amendment.applyAll(doc);
    const xml = AknExport.toXml(consolidated);
    const t = doc.target?.state || {};
    const fn = `consolidado-${t.actName || 'doc'}-${t.number || 'X'}-${t.year || ''}.akn.xml`;
    _download(xml, fn, 'application/xml;charset=utf-8');
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
      toast(summary, 'success');
    } catch (err) {
      toast('Erro ao importar: ' + err.message, 'error');
    }
  }

  function applyImport(parsed) {
    const doc = ImportParser.toDocState(parsed);
    State.init(doc);
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

  // ----- Init --------------------------------------------------------------
  let _initialized = false;
  async function init() {
    if (_initialized) return;  // guarda contra DOMContentLoaded duplo
    _initialized = true;
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
