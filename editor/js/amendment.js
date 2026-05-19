// AKN-PT Editor — Modo "alteração de diploma existente"
// EUPL-1.2
//
// Modelo:
//   doc.kind = 'amender'
//   doc.target = {
//     uri:       URI ELI-PT do diploma a alterar (e.g. .../dec-lei/2023/21/pt)
//     label:     texto humano (e.g. "Decreto-Lei n.º 21/2023, de 27 de março")
//     state:     cópia completa do doc state ORIGINAL (alvo) — necessária para
//                gerar a versão consolidada e para mostrar contexto na UI
//   }
//   doc.amendments = [
//     { id, op, articleId, payload }
//   ]
//
//   onde op ∈ { 'replace', 'revoke', 'add-after', 'add-before' }
//   - replace    : substitui completamente o artigo `articleId` por `payload.article`
//   - revoke     : revoga o artigo `articleId` (sem payload)
//   - add-after  : insere `payload.article` depois de `articleId`
//   - add-before : insere antes
//
// Para esta v0.1 trabalhamos sempre ao nível do ARTIGO completo. Alterações
// cirúrgicas (n.º, alínea, palavra) são v0.2.
//
// API:
//   Amendment.fromTarget(targetDoc)       → cria um doc-amender a partir do alvo
//   Amendment.applyAll(amender)           → devolve a versão CONSOLIDADA do alvo
//   Amendment.toAknXml(amender)           → XML AKN-PT do diploma ALTERADOR
//                                            com <quotedStructure> por alteração

const Amendment = (() => {

  function fromTarget(targetDoc) {
    const target = JSON.parse(JSON.stringify(targetDoc));
    return {
      kind: 'amender',
      target: {
        uri: _frbrUri(target),
        label: _humanLabel(target),
        state: target,
      },
      amendments: [],
      // metadados do PRÓPRIO diploma alterador (o "alterador é também um diploma")
      actName: 'dec-lei',
      subtype: 'dec-lei-alterador',
      country: 'pt',
      number: '',
      year: new Date().getFullYear(),
      shortTitle: `Procede à alteração do ${_humanLabel(target)}.`,
      adoptionDate: '',
      publicationDate: '',
      docDate: '',
      docDateText: '',
      formula: 'Assim: Nos termos da alínea a) do n.º 1 do artigo 198.º da Constituição, o Governo decreta o seguinte:',
      habilitante: '',
      habilitanteLabel: '',
      recitals: [],
      // O `body` do alterador NÃO se desenha como articulado normal — desenha-se
      // como "lista de alterações" via UI. Mantemos um body vazio para satisfazer
      // o exporter / validator do editor.
      body: { kind: 'articles', items: [] },
      attachments: [],
      signatures: [],
      workflow: [],
      comments: [],
      nextRecitalNum: 1,
      nextArticleNum: 1,
      nextParaNum: 1,
      nextAttachmentNum: 1,
    };
  }

  function _frbrUri(doc) {
    return `https://eli.gov.pt/eli/${doc.country || 'pt'}/${doc.actName}/${doc.year}/${doc.number || 'X'}/pt`;
  }

  function _humanLabel(doc) {
    const types = {
      'dec-lei': 'Decreto-Lei',
      'lei': 'Lei',
      'portaria': 'Portaria',
      'res-cm': 'Resolução do Conselho de Ministros',
      'res-ar': 'Resolução da Assembleia da República',
      'decreto-ar': 'Decreto da Assembleia da República',
      'despacho-normativo': 'Despacho normativo',
      'dlr': 'Decreto Legislativo Regional',
      'drr': 'Decreto Regulamentar Regional',
    };
    return `${types[doc.actName] || doc.actName} n.º ${doc.number || 'X'}/${doc.year}`;
  }

  // ----- Operations builders ---------------------------------------------

  let _nextAmId = 1;
  function _amId() { return `am_${Date.now().toString(36)}_${_nextAmId++}`; }

  function addReplace(amender, articleId, newArticle) {
    amender.amendments.push({ id: _amId(), op: 'replace', articleId, payload: { article: newArticle } });
  }
  function addRevoke(amender, articleId) {
    amender.amendments.push({ id: _amId(), op: 'revoke', articleId });
  }
  function addAddAfter(amender, articleId, newArticle) {
    amender.amendments.push({ id: _amId(), op: 'add-after', articleId, payload: { article: newArticle } });
  }
  function addAddBefore(amender, articleId, newArticle) {
    amender.amendments.push({ id: _amId(), op: 'add-before', articleId, payload: { article: newArticle } });
  }
  function removeAmendment(amender, id) {
    amender.amendments = amender.amendments.filter(a => a.id !== id);
  }

  // ----- Consolidation ----------------------------------------------------

  function applyAll(amender) {
    if (!amender.target) throw new Error('Sem diploma alvo.');
    const consolidated = JSON.parse(JSON.stringify(amender.target.state));
    if (consolidated.body.kind !== 'articles') {
      // Para RCMs / Resoluções a v0.1 não suporta alterações.
      return consolidated;
    }
    const items = consolidated.body.items;

    amender.amendments.forEach(am => {
      const idx = items.findIndex(a => a.id === am.articleId);
      if (idx < 0) return;
      if (am.op === 'replace') {
        items[idx] = am.payload.article;
        items[idx].id = am.articleId;  // preservar eId original
      } else if (am.op === 'revoke') {
        items.splice(idx, 1);
      } else if (am.op === 'add-after') {
        items.splice(idx + 1, 0, am.payload.article);
      } else if (am.op === 'add-before') {
        items.splice(idx, 0, am.payload.article);
      }
    });

    // marcar como nova expressão (FRBR — point in time)
    consolidated.publicationDate = amender.publicationDate || consolidated.publicationDate;
    consolidated._consolidatedFrom = amender.target.uri;
    return consolidated;
  }

  // ----- Export AKN-PT (diploma alterador) -------------------------------
  //
  // Geramos um diploma alterador "padrão" da legística portuguesa:
  //   Artigo 1.º — Objeto
  //   Artigo 2.º — Alteração ao [diploma alvo]
  //     (com vários números, um por alteração, contendo <quotedStructure>)
  //   Artigo 3.º — Republicação (opcional, v0.2)
  //   Artigo último — Entrada em vigor
  //
  // O XML é construído chamando AknExport.toXml() com um doc "sintético" que
  // representa o alterador como um DL normal — a magia está em construir os
  // artigos sintéticos com <quotedStructure> dentro.

  function toAknXml(amender) {
    const synth = _synthesizeAmenderDoc(amender);
    // injectamos o conteúdo dos parágrafos manualmente porque AknExport
    // escapa o conteúdo. Usamos um marcador especial que substituímos no fim.
    let xml = AknExport.toXml(synth);
    // Substituir markers __QS_<idx>__ pelos <quotedStructure>. O marker está
    // dentro de `<p>...marker</p></content>` — temos de o mover para entre
    // `</p>` e `</content>` (posição correcta no schema).
    if (synth._quotedStructures) {
      synth._quotedStructures.forEach((qs, i) => {
        const wrappedQs = `\n            <quotedStructure startQuote="«" endQuote="»">${qs.replace(/^\s*<quotedStructure>\n?|\n?\s*<\/quotedStructure>\s*$/g, '')}
            </quotedStructure>`;
        const marker = ` __QS_${i}__`;
        // padrão: <p>texto marker</p></content>
        const re = new RegExp(`(\\s*__QS_${i}__)<\\/p>(\\s*<\\/content>)`, '');
        xml = xml.replace(re, `</p>${wrappedQs}$2`);
        // fallback se o padrão não bater (defensivo)
        xml = xml.replace(marker, '');
      });
    }
    return xml;
  }

  function _synthesizeAmenderDoc(amender) {
    const target = amender.target.state;
    const targetUri = amender.target.uri;
    const targetLabel = amender.target.label;

    const doc = JSON.parse(JSON.stringify(amender));
    doc._quotedStructures = [];

    const articles = [];

    // Artigo 1.º — Objeto
    articles.push({
      id: 'art_1',
      num: 'Artigo 1.º',
      heading: 'Objeto',
      paragraphs: [{
        id: 'art_1__para_1', num: '',
        content: `O presente diploma procede à alteração do ${targetLabel}.`,
        subPoints: [],
      }],
    });

    // Artigo 2.º — Alteração
    const alteracoes = [];
    amender.amendments.forEach((am, idx) => {
      const num = `${idx + 1} -`;
      let content = '';
      let qsContent = null;

      if (am.op === 'replace') {
        const orig = target.body.items.find(a => a.id === am.articleId);
        content = `O ${orig ? orig.num : am.articleId} do ${targetLabel} passa a ter a seguinte redação:`;
        qsContent = _articleToAknXml(am.payload.article, am.articleId);
      } else if (am.op === 'revoke') {
        const orig = target.body.items.find(a => a.id === am.articleId);
        content = `É revogado o ${orig ? orig.num : am.articleId} do ${targetLabel}.`;
      } else if (am.op === 'add-after' || am.op === 'add-before') {
        const orig = target.body.items.find(a => a.id === am.articleId);
        const where = am.op === 'add-after' ? 'após' : 'antes do';
        content = `É aditado, ${where} ${orig ? orig.num : am.articleId} do ${targetLabel}, o artigo seguinte:`;
        qsContent = _articleToAknXml(am.payload.article, am.payload.article.id || 'novo');
      }

      const para = { id: `art_2__para_${idx + 1}`, num, content, subPoints: [] };
      // Marker que substituímos depois do toXml
      if (qsContent) {
        const qsIdx = doc._quotedStructures.length;
        doc._quotedStructures.push(`            <quotedStructure>
${qsContent}
            </quotedStructure>`);
        para._qsMarker = `__QS_${qsIdx}__`;
      }
      alteracoes.push(para);
    });

    articles.push({
      id: 'art_2',
      num: 'Artigo 2.º',
      heading: `Alteração ao ${targetLabel}`,
      paragraphs: alteracoes,
    });

    // Artigo n.º final — Entrada em vigor
    articles.push({
      id: `art_${articles.length + 1}`,
      num: `Artigo ${articles.length + 1}.º`,
      heading: 'Entrada em vigor',
      paragraphs: [{
        id: `art_${articles.length + 1}__para_1`, num: '',
        content: 'O presente diploma entra em vigor no dia seguinte ao da sua publicação.',
        subPoints: [],
      }],
    });

    doc.body = { kind: 'articles', items: articles };

    // Para cada paragrafo com _qsMarker, injectar o marker como sufixo no content.
    // O exporter trata content como texto puro — o marker entra no <p> e nós
    // substituimo-lo depois. Como o marker contém só caracteres alfanumericos
    // + underscores, não causa problemas de escape.
    articles.forEach(a => a.paragraphs.forEach(p => {
      if (p._qsMarker) p.content = p.content + ' ' + p._qsMarker;
    }));

    return doc;
  }

  function _articleToAknXml(article, eId) {
    // Mini-render só para o conteúdo do <quotedStructure>. Todos os eIds
    // têm prefixo `quoted__` por convenção (cf. corpus dl-78-2021) para
    // garantir unicidade dentro do documento alterador.
    const QPREFIX = 'quoted__';
    const qeId = QPREFIX + eId;
    const num = _esc(article.num || `Artigo X.º`);
    const heading = _esc(article.heading || '…');
    const paras = (article.paragraphs || []).map((p, pi) => {
      const qpId = `${qeId}__para_${pi + 1}`;
      const numTag = p.num ? `\n              <num>${_esc(p.num)}</num>` : '';
      if (p.subPoints && p.subPoints.length) {
        const intro = p.content ? `\n              <intro><p>${_esc(p.content)}</p></intro>` : '';
        const pts = p.subPoints.map((sp, spi) => {
          const letter = sp.num.replace(/[^a-z]/gi,'').toLowerCase() || String.fromCharCode(97 + spi);
          return `                <point eId="${qpId}__lit_${letter}"><num>${_esc(sp.num)}</num><content><p>${_esc(sp.content)}</p></content></point>`;
        }).join('\n');
        return `            <paragraph eId="${qpId}">${numTag}${intro}
              <list>
${pts}
              </list>
            </paragraph>`;
      }
      return `            <paragraph eId="${qpId}">${numTag}
              <content><p>${_esc(p.content || '')}</p></content>
            </paragraph>`;
    }).join('\n');

    return `              <article eId="${qeId}">
                <num>${num}</num>
                <heading>${heading}</heading>
${paras}
              </article>`;
  }

  function _esc(s) {
    if (s == null) return '';
    return String(s)
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", '&apos;');
  }

  return {
    fromTarget, applyAll, toAknXml,
    addReplace, addRevoke, addAddAfter, addAddBefore, removeAmendment,
  };
})();

if (typeof window !== "undefined") window.Amendment = Amendment;
