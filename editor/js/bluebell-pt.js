// AKN-PT Editor — Bluebell-PT (plain-text markup bidireccional)
// EUPL-1.2
//
// Inspirado no Bluebell da Laws.Africa (https://laws.africa) — define um
// formato de texto puro, com indentação semântica, que é compilado para o
// modelo do doc state (e dele para AKN-PT XML pelo exporter existente).
//
// Audiência: jurista experiente que prefere escrever em texto puro a usar
// o editor visual. Pode colar conteúdo de Word, editar livremente e
// compilar para AKN-PT.
//
// FORMATO BLUEBELL-PT
// ===================
//
//   Linhas em maiúsculas iniciais marcam STRUTURA. Tudo o resto é
//   conteúdo do parágrafo / alínea anterior.
//
//   PREAMBLE                          <- bloco opcional, "Considerando que…"
//     Considerando que importa transpor a diretiva.
//     Importa, por isso, fixar as condições.
//   FORMULA
//     Assim: Nos termos da alínea a) do n.º 1 do artigo 198.º…
//
//   ARTIGO 1.º — Objeto
//     O presente diploma estabelece o regime jurídico de X.
//
//   ARTIGO 2.º — Âmbito de aplicação
//     1 - Estão abrangidos pelo presente diploma:
//       a) Os trabalhadores;
//       b) Os prestadores de serviços, designadamente:
//         i) Os consultores;
//         ii) Os fornecedores;
//       c) Os candidatos.
//     2 - As entidades referidas no número anterior devem registar-se.
//
//   ANEXO I — Modelo de declaração
//     Conteúdo livre do anexo, parágrafo a parágrafo.
//
// REGRAS
//   - Marcadores estruturais: começam ao nível da linha (sem indentação) e
//     em maiúsculas — ARTIGO, PREAMBLE, FORMULA, ANEXO.
//   - Conteúdo de artigo / parágrafo / alínea está identado com 2/4/6 espaços.
//   - "1 -", "2 -" → paragraph com num.
//   - "a)", "b)" → alínea (point).
//   - "i)", "ii)", "iii)" → subalínea (point dentro de point).
//   - Linhas em branco entre artigos são opcionais (ignoradas).
//
// API
//   BluebellPt.parse(text)     → doc state (partial — só corpo)
//   BluebellPt.serialize(doc)  → string Bluebell-PT
//   BluebellPt.parseToDoc(text, baseDoc) → mistura no baseDoc (preserva meta)

const BluebellPt = (() => {

  const RE_ARTIGO = /^\s*ARTIGO\s+(\d+(?:[-‑–]\s*[A-Z])?)\.?[ºo°]?\s*(?:[—–-]\s*(.+))?$/i;
  const RE_META = /^\s*META\s*$/i;
  const RE_META_CAMPO = /^\s+(ELI|TIPO|NUMERO|ANO)\s+(.+)$/i;
  const RE_PREAMBLE = /^\s*PREAMBLE\s*$/i;
  const RE_FORMULA = /^\s*FORMULA\s*$/i;
  const RE_ANEXO = /^\s*ANEXO\s+([IVXLCDM\d]+)(?:\s*[—–-]\s*(.+))?$/i;
  const RE_PARA_NUM = /^\s*(\d+)\s*[-‑–]\s*(.*)$/;
  const RE_ALINEA = /^\s*([a-z])\)\s*(.*)$/;
  const RE_SUBALINEA = /^\s*([ivxlcdm]+)\)\s*(.*)$/i;

  // ----------------------- Parse ---------------------------------------------

  function parse(text) {
    const lines = text.split(/\r?\n/);
    const doc = {
      recitals: [],
      formula: '',
      body: { kind: 'articles', items: [] },
      attachments: [],
    };
    doc.meta = {};
    let mode = 'body';
    let currentArticle = null;
    let currentPara = null;
    let currentAlinea = null;
    let currentAnexo = null;

    function commitArticle() {
      if (currentArticle) doc.body.items.push(currentArticle);
      currentArticle = null; currentPara = null; currentAlinea = null;
    }

    let recCount = 1;
    let articleCount = 1;
    let anexoCount = 1;

    for (let raw of lines) {
      if (!raw.trim()) continue;

      // 1. Marcadores estruturais top-level
      if (RE_META.test(raw)) { mode = 'meta'; commitArticle(); continue; }
      if (RE_PREAMBLE.test(raw)) { mode = 'preamble'; commitArticle(); continue; }
      if (RE_FORMULA.test(raw)) { mode = 'formula'; commitArticle(); continue; }

      // Bloco META: identidade do acto (ELI, tipo, número, ano). Reconstrói o
      // que o formato de texto perdia por completo.
      if (mode === 'meta') {
        const mm = raw.match(RE_META_CAMPO);
        if (mm) {
          const chave = mm[1].toUpperCase();
          const valor = mm[2].trim();
          if (chave === 'ELI') doc.meta.eli = valor;
          else if (chave === 'TIPO') doc.meta.actName = valor;
          else if (chave === 'NUMERO') doc.meta.number = valor;
          else if (chave === 'ANO') doc.meta.year = parseInt(valor, 10);
          continue;
        }
        mode = 'body';   // linha que não é campo: o bloco META terminou
      }

      const mArt = raw.match(RE_ARTIGO);
      if (mArt && !raw.startsWith(' ')) {
        commitArticle();
        if (currentAnexo) { doc.attachments.push(currentAnexo); currentAnexo = null; }
        mode = 'article';
        const num = `Artigo ${mArt[1]}.º`;
        const heading = (mArt[2] || '').trim();
        const id = `art_${articleCount++}`;
        currentArticle = { id, num, heading, paragraphs: [] };
        currentPara = null; currentAlinea = null;
        continue;
      }
      const mAnx = raw.match(RE_ANEXO);
      if (mAnx && !raw.startsWith(' ')) {
        commitArticle();
        if (currentAnexo) doc.attachments.push(currentAnexo);
        mode = 'anexo';
        currentAnexo = {
          id: `anx_${anexoCount++}`,
          heading: `Anexo ${mAnx[1]}`,
          subheading: (mAnx[2] || '').trim(),
          content: '',
        };
        continue;
      }

      // 2. Dentro do modo correcto, classificar a linha
      const trimmed = raw.replace(/^\s+/, '');
      const mPara = trimmed.match(RE_PARA_NUM);
      const mAli = trimmed.match(RE_ALINEA);
      const mSub = trimmed.match(RE_SUBALINEA);

      if (mode === 'preamble') {
        doc.recitals.push({ id: `rec_${recCount++}`, text: trimmed });
        continue;
      }
      if (mode === 'formula') {
        doc.formula = doc.formula ? doc.formula + ' ' + trimmed : trimmed;
        continue;
      }
      if (mode === 'anexo') {
        currentAnexo.content = currentAnexo.content
          ? currentAnexo.content + '\n' + trimmed
          : trimmed;
        continue;
      }
      if (mode !== 'article' || !currentArticle) continue;

      // Article body
      // Subalínea i), ii) — só se ambígua entre alínea/subalínea, preferir
      // subalínea quando a letra começa por i/v/x e há contexto de alínea pai.
      const isSub = mSub && currentAlinea && _isRomanSubalinea(mSub[1], currentAlinea, currentArticle);
      if (isSub) {
        const num = mSub[1].toLowerCase();
        const ssp = {
          id: `${currentAlinea.id}__sublit_${num}`,
          num: `${num})`,
          content: mSub[2].trim(),
        };
        if (!currentAlinea.subPoints) currentAlinea.subPoints = [];
        currentAlinea.subPoints.push(ssp);
        continue;
      }
      if (mAli && (!mSub || !isSub)) {
        if (!currentPara) {
          // alínea sem n.º — criar um parágrafo implícito sem num
          currentPara = {
            id: `${currentArticle.id}__para_1`,
            num: '', content: '', subPoints: [],
          };
          currentArticle.paragraphs.push(currentPara);
        }
        const letter = mAli[1];
        currentAlinea = {
          id: `${currentPara.id}__lit_${letter}`,
          num: `${letter})`,
          content: mAli[2].trim(),
          subPoints: [],
        };
        currentPara.subPoints.push(currentAlinea);
        continue;
      }
      if (mPara) {
        currentPara = {
          id: `${currentArticle.id}__para_${mPara[1]}`,
          num: `${mPara[1]} -`,
          content: mPara[2].trim(),
          subPoints: [],
        };
        currentArticle.paragraphs.push(currentPara);
        currentAlinea = null;
        continue;
      }

      // Linha de texto pura (continuação)
      if (currentAlinea) {
        currentAlinea.content = currentAlinea.content ? currentAlinea.content + ' ' + trimmed : trimmed;
      } else if (currentPara) {
        currentPara.content = currentPara.content ? currentPara.content + ' ' + trimmed : trimmed;
      } else {
        // Texto sem número — primeiro parágrafo do artigo
        currentPara = {
          id: `${currentArticle.id}__para_1`,
          num: '', content: trimmed, subPoints: [],
        };
        currentArticle.paragraphs.push(currentPara);
      }
    }

    commitArticle();
    if (currentAnexo) doc.attachments.push(currentAnexo);

    // Garantir que todos os artigos têm pelo menos 1 parágrafo
    doc.body.items.forEach(a => {
      if (!a.paragraphs.length) {
        a.paragraphs.push({ id: `${a.id}__para_1`, num: '', content: '', subPoints: [] });
      }
    });
    return doc;
  }

  // Heurística para distinguir "i)" como alínea (i é a 9.ª letra) ou subalínea
  // (subordinada a uma alínea anterior). Se a alínea pai existe e a letra
  // anterior bate certo (b → i poderia ser subalínea), prefere subalínea.
  function _isRomanSubalinea(roman, parentAlinea, article) {
    const r = roman.toLowerCase();
    // tokens multi-char (ii, iii, iv, …) são quase sempre romanos
    if (r.length > 1) return true;
    if (r === 'i') {
      // single "i" — se a alínea anterior existir e for ≠ 'h' (próximo seria 'i'),
      // tratar como subalínea
      const last = parentAlinea.num.replace(')', '').toLowerCase();
      return last !== 'h';  // se foi h, próximo natural seria i → alínea
    }
    return false;
  }

  // ----------------------- Serialize ----------------------------------------

  function serialize(doc) {
    const lines = [];
    // Cabeçalho META: sem ele o formato de texto perdia toda a identidade do
    // acto (o ELI, o tipo, o número). É lido de volta pelo parse().
    if (typeof EliMetadata !== 'undefined' && doc && doc.actName) {
      try {
        const eli = EliMetadata.expressionUri(doc);
        if (eli) {
          lines.push('META');
          lines.push('  ELI ' + eli);
          if (doc.actName) lines.push('  TIPO ' + doc.actName);
          if (doc.number) lines.push('  NUMERO ' + doc.number);
          if (doc.year) lines.push('  ANO ' + doc.year);
          lines.push('');
        }
      } catch (e) { /* o texto continua válido sem META */ }
    }
    if (doc.recitals && doc.recitals.length) {
      lines.push('PREAMBLE');
      doc.recitals.forEach(r => lines.push('  ' + r.text));
      lines.push('');
    }
    if (doc.formula) {
      lines.push('FORMULA');
      lines.push('  ' + doc.formula);
      lines.push('');
    }
    if (doc.body && doc.body.kind === 'articles') {
      (doc.body.items || []).forEach(a => {
        const numClean = (a.num || '').replace(/^Artigo\s+/, '').replace(/\.[ºo°]?$/, '');
        const head = a.heading ? ` — ${a.heading}` : '';
        lines.push(`ARTIGO ${numClean}.º${head}`);
        (a.paragraphs || []).forEach(p => {
          if (p.num) {
            lines.push(`  ${p.num} ${p.content || ''}`);
          } else if (p.content) {
            lines.push(`  ${p.content}`);
          }
          (p.subPoints || []).forEach(sp => {
            lines.push(`    ${sp.num} ${sp.content || ''}`);
            (sp.subPoints || []).forEach(ssp => {
              lines.push(`      ${ssp.num} ${ssp.content || ''}`);
            });
          });
        });
        lines.push('');
      });
    } else if (doc.body) {
      // RCM-style: pontos resolutivos sem cabeçalho ARTIGO
      (doc.body.items || []).forEach(p => {
        lines.push(`${p.num || ''} ${p.content || ''}`);
        (p.subPoints || []).forEach(sp => {
          lines.push(`  ${sp.num} ${sp.content || ''}`);
        });
      });
    }
    (doc.attachments || []).forEach(a => {
      const num = a.heading.replace(/^Anexo\s+/i, '');
      lines.push(`ANEXO ${num}${a.subheading ? ' — ' + a.subheading : ''}`);
      (a.content || '').split('\n').forEach(line => lines.push('  ' + line));
      lines.push('');
    });
    return lines.join('\n').replace(/\n{3,}/g, '\n\n');
  }

  // Mistura corpo Bluebell num doc base preservando meta (number/year/dates/…)
  function parseToDoc(text, baseDoc) {
    const parsed = parse(text);
    const out = JSON.parse(JSON.stringify(baseDoc));
    out.recitals = parsed.recitals.length ? parsed.recitals : out.recitals;
    if (parsed.formula) out.formula = parsed.formula;
    if (parsed.body.items.length) out.body = parsed.body;
    if (parsed.attachments.length) out.attachments = parsed.attachments;
    // Recalcular contadores
    out.nextRecitalNum = (out.recitals.length || 0) + 1;
    out.nextArticleNum = (out.body.items.length || 0) + 1;
    out.nextAttachmentNum = (out.attachments.length || 0) + 1;
    return out;
  }

  return { parse, serialize, parseToDoc };
})();

if (typeof window !== 'undefined') window.BluebellPt = BluebellPt;
if (typeof globalThis !== 'undefined') globalThis.BluebellPt = BluebellPt;
