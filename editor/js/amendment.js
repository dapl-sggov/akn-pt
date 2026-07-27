// AKN-PT Editor — Modo "alteração de diploma existente"
// EUPL-1.2
//
// Modelo:
//   doc.kind = 'amender'
//   doc.target = {
//     uri:       URI ELI do diploma a alterar, forma canónica INCM
//                (e.g. https://data.dre.pt/eli/dec-lei/21/2023/03/27/p/dre/pt)
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

  // URI Expression canónico do diploma (fonte única: EliMetadata). Serve de base
  // ao eli:consolidates e ao <destination> dos textualMod. Nunca se constrói
  // aqui a gramática do ELI — ver eli-metadata.js.
  function _frbrUri(doc) {
    if (typeof EliMetadata !== 'undefined') {
      // A referência é ao acto tal como PUBLICADO (não à versão consolidada).
      const pub = Object.assign({}, doc, { _consolidatedAt: null });
      return EliMetadata.expressionUri(pub);
    }
    return null;
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

  // effectiveDate ∈ ISO 'YYYY-MM-DD' | null
  //   null  → alteração "sem data" (aplica-se sempre que se pede consolidação por data)
  //   ISO   → alteração só entra em consolidações com isoDate >= effectiveDate

  function addReplace(amender, articleId, newArticle, effectiveDate) {
    amender.amendments.push({
      id: _amId(), op: 'replace', articleId,
      payload: { article: newArticle },
      effectiveDate: effectiveDate || null,
    });
  }
  function addRevoke(amender, articleId, effectiveDate) {
    amender.amendments.push({
      id: _amId(), op: 'revoke', articleId,
      effectiveDate: effectiveDate || null,
    });
  }
  function addAddAfter(amender, articleId, newArticle, effectiveDate) {
    amender.amendments.push({
      id: _amId(), op: 'add-after', articleId,
      payload: { article: newArticle },
      effectiveDate: effectiveDate || null,
    });
  }
  function addAddBefore(amender, articleId, newArticle, effectiveDate) {
    amender.amendments.push({
      id: _amId(), op: 'add-before', articleId,
      payload: { article: newArticle },
      effectiveDate: effectiveDate || null,
    });
  }

  // ----- Surgical builders (paragraph / subPoint level) -------------------

  function addReplaceParagraph(amender, articleId, paraId, newParagraph, effectiveDate) {
    amender.amendments.push({
      id: _amId(), op: 'replace-paragraph', articleId, paraId,
      payload: { paragraph: newParagraph },
      effectiveDate: effectiveDate || null,
    });
  }
  function addReplaceSubPoint(amender, articleId, paraId, subPointId, newSubPoint, effectiveDate) {
    amender.amendments.push({
      id: _amId(), op: 'replace-subpoint', articleId, paraId, subPointId,
      payload: { subPoint: newSubPoint },
      effectiveDate: effectiveDate || null,
    });
  }
  function addRevokeParagraph(amender, articleId, paraId, effectiveDate) {
    amender.amendments.push({
      id: _amId(), op: 'revoke-paragraph', articleId, paraId,
      effectiveDate: effectiveDate || null,
    });
  }
  function addRevokeSubPoint(amender, articleId, paraId, subPointId, effectiveDate) {
    amender.amendments.push({
      id: _amId(), op: 'revoke-subpoint', articleId, paraId, subPointId,
      effectiveDate: effectiveDate || null,
    });
  }

  function removeAmendment(amender, id) {
    amender.amendments = amender.amendments.filter(a => a.id !== id);
  }

  // ----- Consolidation ----------------------------------------------------

  // Aplica uma única alteração a `items` (array de articles), in-place.
  function _applyOne(items, am) {
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
    } else if (am.op === 'replace-paragraph') {
      const article = items[idx];
      const pIdx = (article.paragraphs || []).findIndex(p => p.id === am.paraId);
      if (pIdx < 0) return;
      const newPara = JSON.parse(JSON.stringify(am.payload.paragraph));
      newPara.id = am.paraId;  // preservar eId original
      article.paragraphs[pIdx] = newPara;
    } else if (am.op === 'revoke-paragraph') {
      const article = items[idx];
      const pIdx = (article.paragraphs || []).findIndex(p => p.id === am.paraId);
      if (pIdx < 0) return;
      article.paragraphs.splice(pIdx, 1);
    } else if (am.op === 'replace-subpoint') {
      const article = items[idx];
      const para = (article.paragraphs || []).find(p => p.id === am.paraId);
      if (!para) return;
      const spIdx = (para.subPoints || []).findIndex(sp => sp.id === am.subPointId);
      if (spIdx < 0) return;
      const newSp = JSON.parse(JSON.stringify(am.payload.subPoint));
      newSp.id = am.subPointId;  // preservar eId original
      para.subPoints[spIdx] = newSp;
    } else if (am.op === 'revoke-subpoint') {
      const article = items[idx];
      const para = (article.paragraphs || []).find(p => p.id === am.paraId);
      if (!para) return;
      const spIdx = (para.subPoints || []).findIndex(sp => sp.id === am.subPointId);
      if (spIdx < 0) return;
      para.subPoints.splice(spIdx, 1);
    }
  }

  // Comparador estável para datas ISO: null primeiro (alterações "sempre vigentes"),
  // depois por data ascendente. Preserva a ordem original em caso de empate
  // (Array.prototype.sort é estável desde ES2019).
  function _cmpEffective(a, b) {
    const da = a.effectiveDate || null;
    const db = b.effectiveDate || null;
    if (da === db) return 0;
    if (da === null) return -1;
    if (db === null) return 1;
    return da < db ? -1 : 1;
  }

  // Alterações em vigor a uma data: sem effectiveDate aplicam-se sempre. Regra
  // ÚNICA — estava duplicada entre applyAtDate e toAknXmlConsolidated, o que
  // permitiria que o XML declarasse alterações diferentes das aplicadas.
  function _emVigor(amender, isoDate) {
    return (amender.amendments || []).filter((am) => {
      const eff = am.effectiveDate || null;
      return eff === null || eff <= isoDate;
    });
  }

  function applyAtDate(amender, isoDate) {
    if (!amender.target) throw new Error('Sem diploma alvo.');
    // Consolidação só é suportada para articulado: com outro tipo de corpo o
    // motor não aplica nada e o XML declararia alterações que nunca ocorreram.
    const kindAlvo = ((amender.target.state || {}).body || {}).kind;
    if (kindAlvo && kindAlvo !== 'articles') {
      throw new Error('Consolidação só suportada para diplomas com articulado (body.kind=articles).');
    }
    // Não se consolida um diploma numa data anterior à sua publicação.
    const pubAlvo = amender.target.state && amender.target.state.publicationDate;
    if (pubAlvo && isoDate < pubAlvo && isoDate !== '9999-12-31') {
      throw new Error('Data de consolidação anterior à publicação do diploma.');
    }
    const consolidated = JSON.parse(JSON.stringify(amender.target.state));
    if (consolidated.body.kind !== 'articles') {
      // Para RCMs / Resoluções a v0.1 não suporta alterações.
      return consolidated;
    }
    const items = consolidated.body.items;

    // 1. Filtrar: alterações com effectiveDate <= isoDate (null aplicam-se sempre).
    const inForce = _emVigor(amender, isoDate);

    // 2. Ordenar por effectiveDate ascendente (nulls primeiro).
    const ordered = inForce.slice().sort(_cmpEffective);

    // 3. Aplicar.
    ordered.forEach(am => _applyOne(items, am));

    // Marcar como nova Expression (FRBR — point in time).
    //
    // A data de publicação NÃO é substituída pela do diploma alterador: a
    // Expression consolidada pertence ao MESMO Work (o acto originário), pelo
    // que conserva a data de publicação original. A data da consolidação vive
    // em _consolidatedAt e a do alterador é registada à parte, para o
    // <source> das passiveModifications.
    consolidated._originalPublicationDate = consolidated.publicationDate;
    consolidated._amenderPublicationDate = amender.publicationDate || null;
    consolidated._consolidatedFrom = amender.target.uri;
    consolidated._consolidatedAt = isoDate;
    return consolidated;
  }

  function applyAll(amender) {
    // Equivalente a "aplica TUDO": data sentinela no futuro distante garante
    // que toda a alteração com effectiveDate definido cai dentro da janela.
    return applyAtDate(amender, '9999-12-31');
  }

  // Lista única e ordenada (ascendente) das datas distintas com alterações.
  // Exclui null (não-datadas). Útil para a UI desenhar um slider temporal.
  function timeline(amender) {
    const set = new Set();
    (amender.amendments || []).forEach(am => {
      if (am.effectiveDate) set.add(am.effectiveDate);
    });
    return Array.from(set).sort();
  }

  // ----- Export AKN-PT (versão consolidada / retificada) ----------------
  //
  // Em contraste com toAknXml() que produz o DIPLOMA ALTERADOR (com
  // <quotedStructure>), toAknXmlConsolidated() produz a Expression
  // CONSOLIDADA do diploma alvo a um ponto-no-tempo específico. O resultado
  // partilha o FRBRWork URI com o original mas tem:
  //   - FRBRExpression URI extendido com {isoDate}/pt
  //   - <FRBRdate name="consolidation"/> (ou "rectification" se kind='rectification')
  //   - <FRBRversionNumber> incrementado
  //   - <analysis>/<passiveModifications> populado com 1 <textualMod> por
  //     amendment aplicado, referenciando o diploma alterador como source.
  //
  // Notas v0.1.1:
  //   - O motor de aplicação (applyAtDate / applyAll / _applyOne) JÁ existe;
  //     esta função apenas serializa.
  //   - Retificação distingue-se por kind='rectification' — produz FRBRdate
  //     name="rectification" e type="rectification" nos textualMod. v0.1.1
  //     não impõe novas regras Schematron para retificação (eventualmente
  //     em v0.1.2 com TIMP-* — ver capítulo 13 da spec).
  //
  // API:
  //   Amendment.toAknXmlConsolidated(amender, isoDate, opts?)
  //     opts.kind: 'consolidation' (default) | 'rectification'
  //     opts.version: número da Expression (default: 2)
  //   → string XML AKN-PT válida (XSD + Schematron publication phase)

  function toAknXmlConsolidated(amender, isoDate, opts) {
    opts = opts || {};
    const kind = opts.kind === 'rectification' ? 'rectification' : 'consolidation';
    // Versão da Expression: nunca inferior a 2 numa consolidação, e derivada
    // do número de marcos temporais já aplicados quando não for indicada.
    const auto = 1 + timeline(amender).filter(d => d <= isoDate).length;
    const version = Math.max(2, opts.version || auto);
    if (!amender.target) throw new Error('Sem diploma alvo.');
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
      throw new Error('isoDate inválida (esperado YYYY-MM-DD).');
    }
    // 1. Aplicar amendments até à data isoDate (consume motor existente).
    const consolidated = applyAtDate(amender, isoDate);
    // 2. Flags FRBR (lidas por buildFrbr em akn-export.js).
    consolidated._consolidatedAt = isoDate;
    consolidated._consolidationKind = kind;
    consolidated._consolidationVersion = version;
    consolidated._consolidatedFrom = amender.target.uri;
    // 3. Construir passiveModifications — 1 textualMod por amendment que
    //    caiu dentro da janela isoDate (mesma lógica de applyAtDate).
    const inForce = _emVigor(amender, isoDate);
    // <source> de cada textualMod = o diploma ALTERADOR, no ELI canónico da
    // INCM (fonte única: EliMetadata). Sem URI explícito nem dados suficientes
    // para o construir, fica null e o exportador omite o atributo — melhor do
    // que apontar para um URI inventado.
    // Sem número ou data de publicação do alterador não há URI construível —
    // melhor omitir o <source> do que fabricar um identificador.
    const sourceUri = amender.uri || ((amender.number && amender.publicationDate) ? _frbrUri({
      actName: amender.actName || 'dec-lei',
      number: amender.number,
      year: amender.year,
      country: amender.country || 'pt',
      publicationDate: amender.publicationDate,
      adoptionDate: amender.adoptionDate,
    }) : null);
    const passive = inForce.map((am, idx) => {
      // type AKN: "substitution" (replace), "repeal" (revoke), "insertion" (add-*),
      // "rectification" para qualquer op num diploma com kind='rectification'.
      let type;
      if (kind === 'rectification') type = 'rectification';
      else if (am.op === 'replace' || am.op === 'replace-paragraph' || am.op === 'replace-subpoint') type = 'substitution';
      else if (am.op === 'revoke' || am.op === 'revoke-paragraph' || am.op === 'revoke-subpoint') type = 'repeal';
      else if (am.op === 'add-after' || am.op === 'add-before') type = 'insertion';
      else type = 'modification';
      // destination: eId do artigo/parágrafo/subponto afectado
      let destEid = am.articleId;
      if (am.paraId) destEid = am.paraId;
      if (am.subPointId) destEid = am.subPointId;
      return {
        id: `pm_${idx + 1}`,
        type,
        sourceUri,
        eId: destEid,
      };
    });
    consolidated._passiveModifications = passive;

    // 4. Garantir metadados necessários ao exporter.
    //    O target.state já tem actName, number, year, country, subtype,
    //    publicationDate, adoptionDate, body, recitals, signatures, etc.
    //    (cf. fromTarget → toDocState). Verificar campos mínimos:
    if (!consolidated.actName) throw new Error('Target sem actName.');
    if (!consolidated.number || !consolidated.year) {
      throw new Error('Target sem número/ano FRBR.');
    }

    return AknExport.toXml(consolidated);
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
        qsContent = _articleToAknXml(am.payload.article, am.articleId, target);
      } else if (am.op === 'revoke') {
        const orig = target.body.items.find(a => a.id === am.articleId);
        content = `É revogado o ${orig ? orig.num : am.articleId} do ${targetLabel}.`;
      } else if (am.op === 'add-after' || am.op === 'add-before') {
        const orig = target.body.items.find(a => a.id === am.articleId);
        const where = am.op === 'add-after' ? 'após' : 'antes do';
        content = `É aditado, ${where} ${orig ? orig.num : am.articleId} do ${targetLabel}, o artigo seguinte:`;
        qsContent = _articleToAknXml(am.payload.article, am.payload.article.id || 'novo', target);
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

  // Texto com remissões materializadas em <ref>, como faz o akn-export.js. Sem
  // isto, as remissões dentro do texto ALTERADO perdiam-se na exportação.
  function _xmlText(s, doc, qprefix) {
    if (typeof References !== 'undefined' && References.toXmlEscaped) {
      const out = References.toXmlEscaped(s, doc);
      // Dentro de <quotedStructure> todos os eId levam o prefixo `quoted__`;
      // sem reescrever os href internos, as remissões apontavam para
      // identificadores que não existem no diploma alterador.
      return qprefix ? out.replaceAll('<ref href="#', `<ref href="#${qprefix}`) : out;
    }
    return _esc(s);
  }

  function _articleToAknXml(article, eId, doc) {
    const QP = 'quoted__';
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
        const intro = p.content ? `\n              <intro><p>${_xmlText(p.content, doc, QP)}</p></intro>` : '';
        const pts = p.subPoints.map((sp, spi) => {
          const letter = sp.num.replace(/[^a-z]/gi,'').toLowerCase() || String.fromCharCode(97 + spi);
          return `                <point eId="${qpId}__lit_${letter}"><num>${_esc(sp.num)}</num><content><p>${_xmlText(sp.content, doc, QP)}</p></content></point>`;
        }).join('\n');
        return `            <paragraph eId="${qpId}">${numTag}${intro}
              <list>
${pts}
              </list>
            </paragraph>`;
      }
      return `            <paragraph eId="${qpId}">${numTag}
              <content><p>${_xmlText(p.content || '', doc, QP)}</p></content>
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
    fromTarget, applyAll, applyAtDate, timeline, toAknXml, toAknXmlConsolidated,
    addReplace, addRevoke, addAddAfter, addAddBefore,
    addReplaceParagraph, addReplaceSubPoint,
    addRevokeParagraph, addRevokeSubPoint,
    removeAmendment,
  };
})();

if (typeof window !== "undefined") window.Amendment = Amendment;
