// AKN-PT Editor — HTML preview rendering
// EUPL-1.2

const Preview = (() => {
  function esc(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = String(s);
    return div.innerHTML;
  }

  // Texto com refs cruzadas resolvidas como <a> (se References disponivel).
  function textRich(s, doc) {
    if (typeof References !== 'undefined') return References.toHtmlPreview(s, doc);
    return esc(s);
  }

  let _doc = null;

  function render(doc) {
    _doc = doc;
    const types = {
      'dec-lei': 'Decreto-Lei',
      'lei': 'Lei',
      'decreto-ar': 'Decreto da Assembleia da República',
      'res-ar': 'Resolução da Assembleia da República',
      'portaria': 'Portaria',
      'res-cm': 'Resolução do Conselho de Ministros',
      'despacho-normativo': 'Despacho normativo',
      'dlr': 'Decreto Legislativo Regional',
      'drr': 'Decreto Regulamentar Regional',
    };
    const docType = types[doc.actName] || doc.actName;
    const suffix = doc.country === 'pt-20' ? '/A' : doc.country === 'pt-30' ? '/M' : '';

    const out = [];
    out.push(`<div class="preview-html">`);
    out.push(`<h1><span class="pv-doctype">${esc(docType)}</span> <br/>n.º ${esc(doc.number || 'X')}/${doc.year}${suffix}</h1>`);
    if (doc.shortTitle) {
      out.push(`<p class="pv-shorttitle"><em>${textRich(doc.shortTitle, doc)}</em></p>`);
    }
    if (doc.recitals.length || doc.formula) {
      out.push(`<div class="pv-preamble">`);
      doc.recitals.forEach(r => {
        out.push(`<p class="pv-recital">${textRich(r.text, doc)}</p>`);
      });
      if (doc.formula) out.push(`<p class="pv-formula">${textRich(doc.formula, doc)}</p>`);
      out.push(`</div>`);
    }

    if (doc.body.kind === 'articles') {
      doc.body.items.forEach(a => out.push(renderArticle(a)));
    } else if (doc.body.kind === 'hierarchic') {
      // Renderiza recursivamente containers (chapter/section/etc.) e artigos
      doc.body.items.forEach(item => out.push(renderBodyItem(item, 0)));
    } else {
      doc.body.items.forEach(p => out.push(renderParagraph(p)));
    }

    if (doc.signatures.length) {
      out.push(`<div class="pv-signatures" style="margin-top:2rem">`);
      doc.signatures.forEach(s => {
        out.push(`<p class="pv-signature"><em>${esc(s.name || '(' + s.as + ')')}</em></p>`);
      });
      out.push(`</div>`);
    }

    doc.attachments.forEach(a => {
      out.push(`<div class="pv-attachment">`);
      out.push(`  <h2>${esc(a.heading)}</h2>`);
      if (a.subheading) out.push(`  <p><em>${esc(a.subheading)}</em></p>`);
      out.push(`  <p>${esc(a.content)}</p>`);
      out.push(`</div>`);
    });

    if (doc.workflow.length) {
      out.push(`<div class="pv-footprint" style="margin-top:2rem; border-top:2px dashed #ccc; padding-top:1rem;">`);
      out.push(`  <h3>Pegada legislativa</h3>`);
      out.push(`  <ol>`);
      doc.workflow.forEach(s => {
        out.push(`<li><strong>${esc(s.refersTo)}</strong> (${esc(s.date)}) — ${esc(s.description || '—')}`);
        if (s.inputs.length) {
          out.push(`<ul>`);
          s.inputs.forEach(i => {
            out.push(`<li><em>${esc(i.source)}</em> · ${esc(i.type)} · ${esc(i.date)}${i.description ? ': ' + esc(i.description) : ''}</li>`);
          });
          out.push(`</ul>`);
        }
        out.push(`</li>`);
      });
      out.push(`  </ol>`);
      out.push(`</div>`);
    }

    out.push(`</div>`);
    return out.join('\n');
  }

  function renderArticle(a) {
    const out = [];
    out.push(`<div class="pv-article">`);
    out.push(`  <p class="pv-article-num"><strong>${esc(a.num)}</strong> <em class="pv-article-heading">${textRich(a.heading, _doc)}</em></p>`);
    (a.paragraphs || []).forEach(p => out.push(renderParagraph(p)));
    out.push(`</div>`);
    return out.join('\n');
  }

  // Para body.kind='hierarchic': renderiza chapter/section/etc. com
  // indentação progressiva, ou article folha.
  const _CONTAINERS = new Set(['book', 'part', 'title', 'chapter', 'section', 'subsection']);
  function renderBodyItem(item, depth) {
    if (item && _CONTAINERS.has(item.containerType)) {
      const indent = depth * 1.5;
      const out = [];
      out.push(`<div class="pv-container pv-${item.containerType}" style="margin-left:${indent}rem; border-left:2px solid #e0d8c4; padding-left:1rem; margin-top:1rem;">`);
      if (item.num) out.push(`  <p class="pv-container-num" style="font-variant:small-caps; letter-spacing:0.05em; color:#0f2747;"><strong>${esc(item.num)}</strong></p>`);
      if (item.heading) out.push(`  <p class="pv-container-heading"><em>${textRich(item.heading, _doc)}</em></p>`);
      (item.items || []).forEach(child => out.push(renderBodyItem(child, depth + 1)));
      out.push(`</div>`);
      return out.join('\n');
    }
    // Article folha
    return renderArticle(item);
  }

  function renderParagraph(p) {
    const numHtml = p.num ? `<strong>${esc(p.num)}</strong> ` : '';
    if (p.subPoints && p.subPoints.length) {
      const intro = p.content
        ? `<p class="pv-paragraph">${numHtml}${textRich(p.content, _doc)}</p>`
        : (numHtml ? `<p class="pv-paragraph">${numHtml}</p>` : '');
      const pts = p.subPoints.map(sp => renderPoint(sp)).join('');
      return intro + pts;
    }
    return `<p class="pv-paragraph">${numHtml}${textRich(p.content, _doc)}</p>`;
  }

  function renderPoint(sp) {
    const main = `<p class="pv-point"><strong>${esc(sp.num)}</strong> ${textRich(sp.content, _doc)}</p>`;
    if (sp.subPoints && sp.subPoints.length) {
      const subs = sp.subPoints.map(ssp =>
        `<p class="pv-subpoint" style="margin-left:3rem"><em>${esc(ssp.num)}</em> ${textRich(ssp.content, _doc)}</p>`
      ).join('');
      return main + subs;
    }
    return main;
  }

  return { render };
})();

if (typeof window !== "undefined") window.Preview = Preview;
