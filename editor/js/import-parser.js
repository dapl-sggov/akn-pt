// AKN-PT Editor — heuristic parser for unmarked Portuguese diplomas.
// Takes plain text (or extracted from DOCX) and produces a doc state.
//
// EUPL-1.2
//
// Strategy: pattern-based detection of legística conventions.
// Conservative — better to under-detect than miss-structure.
//
// Detects:
//   - Act type and number from header lines
//   - Ementa (short title) from line below header
//   - "Considerando que ..." → recitals
//   - "Assim:" / "Manda o Governo" → enacting formula
//   - "Artigo N.º — Title" → articles (and X.º-A variants)
//   - "1 -", "2 -" inside article → paragraphs
//   - "a)", "b)" → list points (alíneas)
//   - "Visto e aprovado em Conselho de Ministros" → conclusion formula
//   - "Promulgado em" → promulgation event
//   - "Anexo I" / "Anexo (a que se refere ...)" → attachments

const ImportParser = (() => {

  // -----------------------------------------------------------------------
  // Type detection
  // -----------------------------------------------------------------------
  const TYPE_PATTERNS = [
    { re: /^\s*Decreto[- ]Lei\s+n\.?[ºo°]?\s*(\d+(?:-[A-Z])?)\s*\/\s*(\d{4})/im, type: 'dec-lei' },
    { re: /^\s*Lei\s+(?:Org[âa]nica\s+)?n\.?[ºo°]?\s*(\d+(?:-[A-Z])?)\s*\/\s*(\d{4})/im, type: 'lei' },
    { re: /^\s*Decreto\s+da\s+Assembleia.*?n\.?[ºo°]?\s*(\d+(?:-[A-Z])?)\s*\/\s*(\d{4})/im, type: 'decreto-ar' },
    { re: /^\s*Resolu[çc][ãa]o\s+da\s+Assembleia.*?n\.?[ºo°]?\s*(\d+(?:-[A-Z])?)\s*\/\s*(\d{4})/im, type: 'res-ar' },
    { re: /^\s*Portaria\s+n\.?[ºo°]?\s*(\d+(?:-[A-Z])?)\s*\/\s*(\d{4})/im, type: 'portaria' },
    { re: /^\s*Resolu[çc][ãa]o\s+do\s+Conselho\s+de\s+Ministros\s+n\.?[ºo°]?\s*(\d+(?:-[A-Z])?)\s*\/\s*(\d{4})/im, type: 'res-cm' },
    { re: /^\s*Despacho\s+(?:normativo\s+)?n\.?[ºo°]?\s*(\d+(?:-[A-Z])?)\s*\/\s*(\d{4})/im, type: 'despacho-normativo' },
    { re: /^\s*Decreto\s+Legislativo\s+Regional\s+n\.?[ºo°]?\s*(\d+(?:-[A-Z])?)\s*\/\s*(\d{4})(?:\/([AM]))?/im, type: 'dlr' },
    { re: /^\s*Decreto\s+Regulamentar\s+Regional\s+n\.?[ºo°]?\s*(\d+(?:-[A-Z])?)\s*\/\s*(\d{4})(?:\/([AM]))?/im, type: 'drr' },
  ];

  // Subtype heuristics from preamble text
  const SUBTYPE_HINTS = {
    'dec-lei': [
      { re: /al[íi]nea\s+b\)\s+do\s+n\.?[ºo]?\s*1\s+do\s+artigo\s+198/i, value: 'dec-lei-autorizado' },
      { re: /al[íi]nea\s+c\)\s+do\s+n\.?[ºo]?\s*1\s+do\s+artigo\s+198/i, value: 'dec-lei-parlamentar' },
      { re: /transp[õo]e\s+(?:para\s+a\s+ordem\s+jur[íi]dica\s+interna\s+)?a\s+Diretiva|Diretiva\s+\(UE\)/i, value: 'dec-lei-transposicao' },
      { re: /altera[çc][ãa]o\s+ao\s+Decreto[- ]Lei|primeira\s+altera[çc][ãa]o\s+ao/i, value: 'dec-lei-alterador' },
    ],
    'lei': [
      { re: /Lei\s+Org[âa]nica/i, value: 'lei-organica' },
      { re: /Lei\s+de\s+Bases/i, value: 'lei-de-bases' },
      { re: /autoriza[çc][ãa]o\s+legislativa/i, value: 'lei-autorizacao' },
      { re: /revis[ãa]o\s+constitucional/i, value: 'lei-de-revisao' },
    ],
    'res-cm': [
      { re: /aprova\s+(?:o\s+plano|a\s+estrat[ée]gia|a\s+pol[íi]tica)/i, value: 'res-cm-normativa' },
    ],
    'decreto-ar': [
      { re: /aprovar\s+a\s+(?:Conven[çc][ãa]o|Tratado|Acordo|Protocolo)/i, value: 'decreto-ar-tratado' },
    ],
  };

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------
  function normalizeLines(text) {
    // Normalize whitespace, normalize unicode, split into lines.
    // CRÍTICO: mammoth.js (browser) gera múltiplas linhas vazias entre cada
    // parágrafo lógico do .docx (cada <w:br/> ou tab vira \n). Filtramos
    // todas as linhas vazias para que lines[i+1] seja sempre a próxima
    // linha SEMÂNTICA (necessário para detectar epígrafes "Artigo N.º \n
    // [vazio]* \n Heading").
    return text
      .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
      .replace(/­/g, '')  // soft hyphens
      .replace(/[ ]/g, ' ')  // non-breaking spaces → espaço normal
      .replace(/[\t ]+/g, ' ')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);
  }

  // Detect "Artigo 5.º" or "Artigo 5.º-A" → return {num, label, eId}
  const ART_RE = /^Artigo\s+(\d+)\.?[ºo°]?(?:[-–—\s]*([A-Z]))?\s*$/i;
  // With heading on same line: "Artigo 5.º — Definições"
  const ART_INLINE_RE = /^Artigo\s+(\d+)\.?[ºo°]?(?:[-–—\s]*([A-Z]))?\s*[—–\-:]\s*(.+)$/i;

  // Number: "1 -" or "1." or "1.º" at start
  const NUM_RE = /^(\d+)\s*[-–.]\s*(.+)$/;
  // Letter: "a)" or "a -"  (alineas a, b, c)
  const ALPHA_RE = /^([a-z])\s*\)\s*(.+)$/;
  // Lower roman: "i)", "ii)", "iii)", "iv)", "v)", ... up to "xii)"  (subalineas)
  const ROMAN_RE = /^([ivxl]{1,5})\s*\)\s*(.+)$/;

  // Considerando — recital explícito
  const CONS_RE = /^Considerando\b/i;

  // Enacting formula starters. Aceita "Assim:", "Assim,", "Assim. ", além
  // dos padrões parlamentares e regionais. Inclui também "Nos termos do"
  // que é o início real frequente em Portarias e DLs sem "Assim".
  const FORMULA_RE = /^(Assim\s*[:,.]|Manda\s+o\s+Governo|Nos\s+termos\s+(?:do|da|dos|das)\s|A\s+Assembleia\s+da\s+Rep[úu]blica\s+(?:decreta|resolve)|O\s+Governo\s+Regional|A\s+Assembleia\s+Legislativa)/i;

  // Heurística adicional: linha que CONTÉM "ao abrigo de" ou "no uso da
  // competência" — típica fórmula promulgatória de Portaria/Despacho mesmo
  // sem "Assim" no início (ex. "Manda o Governo, ao abrigo de…")
  const FORMULA_CONTAINS_RE = /\bao\s+abrigo\s+(?:do|da|dos|das)\b|\bno\s+uso\s+da\s+compet[êe]ncia\b|\bem\s+execu[çc][ãa]o\s+(?:do|da)\b/i;

  // Conclusion markers
  const VISTO_RE = /^Visto\s+e\s+aprovado\s+em\s+Conselho\s+de\s+Ministros/i;
  const APROVADA_RE = /^Aprovad[oa]\s+em\b/i;
  const PROMULGADO_RE = /^Promulgad[oa]\s+em\b/i;
  const REFERENDADO_RE = /^Referendad[oa]\s+em\b/i;
  const ASSINADO_RE = /^Assinado\s+em\b/i;
  // "Em 30 de abril de 2025." — frequentemente precede assinaturas em Portarias
  const EM_DATE_RE = /^Em\s+\d{1,2}\s+de\s+\w+\s+de\s+\d{4}\.?\s*$/i;

  // Data inline "de DD de MMMM (de YYYY)?" — partilhada entre parse() e parseBody()
  const DATE_INLINE_RE = /de\s+(\d{1,2})\s+de\s+(\w+)(?:\s+de\s+(\d{4}))?/i;

  // Annex
  const ANNEX_RE = /^Anexo(?:\s+([IVX]+|\d+))?(?:\s*\(.*\))?\s*$/i;

  // -----------------------------------------------------------------------
  // Main parse function
  // -----------------------------------------------------------------------
  function parse(rawText) {
    const lines = normalizeLines(rawText);
    const result = {
      actType: null, subtype: null,
      number: '', year: new Date().getFullYear(),
      country: 'pt',
      shortTitle: '',
      adoptionDate: '', publicationDate: '', docDate: '', docDateText: '',
      recitals: [], formula: '',
      bodyKind: 'articles',  // resolved by act type
      articles: [],  // [{num, heading, paragraphs: [{num, content, subPoints}]}]
      paragraphs: [],  // for paragraph-based acts (RCM, Res-AR)
      attachments: [],
      signatures: [],
      habilitante: '', habilitanteLabel: '',
      warnings: [],
    };

    // Step 1: detect type + number
    const fullText = lines.join('\n');
    let typeMatch = null;
    for (const tp of TYPE_PATTERNS) {
      const m = fullText.match(tp.re);
      if (m) {
        result.actType = tp.type;
        result.number = m[1];
        result.year = parseInt(m[2], 10);
        if (m[3] === 'A') result.country = 'pt-20';
        else if (m[3] === 'M') result.country = 'pt-30';
        typeMatch = tp;
        break;
      }
    }
    if (!result.actType) {
      result.warnings.push('Não foi possível detectar o tipo de ato. Assumindo "Decreto-Lei".');
      result.actType = 'dec-lei';
    }

    // Subtype detection
    const subtypeHints = SUBTYPE_HINTS[result.actType] || [];
    for (const hint of subtypeHints) {
      if (hint.re.test(fullText)) {
        result.subtype = hint.value;
        break;
      }
    }
    if (!result.subtype) {
      // Default subtype per type
      const defaults = {
        'dec-lei': 'dec-lei-ordinario', 'lei': 'lei-comum',
        'decreto-ar': 'decreto-ar-outros', 'res-ar': 'res-ar-recomendacao',
        'portaria': 'portaria-regulamentar', 'res-cm': 'res-cm-normativa',
        'despacho-normativo': 'despacho-normativo',
        'dlr': 'dlr-ordinario', 'drr': 'drr-execucao',
      };
      result.subtype = defaults[result.actType];
    }

    // Body kind by type
    result.bodyKind = ['res-cm', 'res-ar'].includes(result.actType) ? 'paragraphs' : 'articles';

    // Step 2: detect date in header "de DD de MMMM" or "de DD de MMMM de YYYY"
    const months = {
      janeiro: 1, fevereiro: 2, 'março': 3, marco: 3, abril: 4, maio: 5, junho: 6,
      julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
    };
    const dateRe = DATE_INLINE_RE;
    const dm = fullText.match(dateRe);
    if (dm) {
      const day = String(dm[1]).padStart(2, '0');
      const mo = months[dm[2].toLowerCase().replace('ç', 'c')];
      const yr = dm[3] || result.year;
      if (mo) {
        result.docDate = `${yr}-${String(mo).padStart(2, '0')}-${day}`;
        result.docDateText = `${parseInt(day, 10)} de ${dm[2]}`;
        result.publicationDate = result.docDate;
      }
    }

    // Step 3: extract ementa (short title)
    // Heurística: linha curta (< 250 chars), uma frase única, logo após o
    // header (tipo + data). Se NÃO houver ementa explícita (frequente em
    // Portarias modernas), deixa vazio em vez de absorver o preâmbulo.
    //
    // Indicadores de que NÃO é ementa (é considerando implícito):
    //   - linha > 250 chars
    //   - começa por "A " / "O " / "Importa " (verbos típicos de recital)
    //   - cita "Decreto-Lei n.º …" ou "Lei n.º …" no meio (típico de recital)
    if (typeMatch) {
      const typeLineIdx = lines.findIndex(l => typeMatch.re.test(l));
      if (typeLineIdx >= 0) {
        for (let i = typeLineIdx + 1; i < Math.min(typeLineIdx + 8, lines.length); i++) {
          const ln = lines[i];
          if (!ln) continue;
          if (CONS_RE.test(ln) || ART_RE.test(ln) || ART_INLINE_RE.test(ln) ||
              FORMULA_RE.test(ln) || FORMULA_CONTAINS_RE.test(ln)) break;
          if (dateRe.test(ln) && ln.length < 30) continue;  // skip date-only lines
          // Anti-falso-positivo: descartar candidatos longos ou claramente
          // narrativos. Se nenhum candidato passa o filtro, shortTitle fica
          // vazio (preferível a poluir com preâmbulo).
          if (ln.length > 250) break;
          if (/\b(Decreto[- ]Lei|Lei)\s+n\.?[ºo°]?\s*\d+\/\d{4}/i.test(ln)) break;
          if (/^(A\s+org[âa]nica|Importa\s+|Considerando|O\s+presente)/i.test(ln)) break;
          if (ln.length > 15) {
            result.shortTitle = ln.replace(/[.;]\s*$/, '');
            break;
          }
        }
      }
    }

    // Step 4: detect adoption date from "Visto e aprovado em Conselho de Ministros de ..."
    for (const ln of lines) {
      if (VISTO_RE.test(ln) || APROVADA_RE.test(ln)) {
        const d = ln.match(dateRe);
        if (d) {
          const mo = months[d[2].toLowerCase().replace('ç', 'c')];
          if (mo) {
            result.adoptionDate = `${d[3] || result.year}-${String(mo).padStart(2, '0')}-${String(d[1]).padStart(2, '0')}`;
            break;
          }
        }
      }
    }
    if (!result.adoptionDate) result.adoptionDate = result.publicationDate || `${result.year}-01-01`;
    if (!result.publicationDate) result.publicationDate = result.adoptionDate;
    if (!result.docDate) result.docDate = result.publicationDate;

    // Step 5: parse body — walk through lines tracking state
    parseBody(lines, result);

    // Step 6: detect habilitante from preamble (ref to "Decreto-Lei n.º X/Y" not the act itself)
    detectHabilitante(result);

    // Step 7: detect signatures from conclusion section (heuristic — last lines)
    detectSignatures(lines, result);

    return result;
  }

  // -----------------------------------------------------------------------
  // Body parsing — state machine
  // -----------------------------------------------------------------------
  function parseBody(lines, r) {
    let mode = 'header';   // header | preamble | body | annex | conclusions
    let curArticle = null;
    let curParagraph = null;
    let curAnnex = null;
    let articleSeq = 1;
    let paragraphSeq = 1;
    let recitalSeq = 1;
    let annexSeq = 1;

    // Localizar o índice do header (linha onde aparece o tipo+número) para
    // saber a partir de onde podemos tratar texto narrativo como recitais
    // implícitos.
    const TYPE_LINE_PATTERNS = TYPE_PATTERNS.map(t => t.re);
    let headerLineIdx = -1;
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      if (TYPE_LINE_PATTERNS.some(re => re.test(lines[i]))) { headerLineIdx = i; break; }
    }

    for (let i = 0; i < lines.length; i++) {
      const ln = lines[i];
      if (!ln) continue;

      // ----- detect annex start -----
      if (ANNEX_RE.test(ln)) {
        curAnnex = {
          id: `anx_${annexSeq++}`,
          heading: ln,
          subheading: '',
          content: '',
        };
        r.attachments.push(curAnnex);
        mode = 'annex';
        // Optionally consume next line as subheading
        if (lines[i + 1] && !ART_RE.test(lines[i + 1]) && !ART_INLINE_RE.test(lines[i + 1])) {
          curAnnex.subheading = lines[i + 1];
          i++;
        }
        continue;
      }

      // ----- "Em DD de mes de YYYY." precedendo assinaturas -----
      if (EM_DATE_RE.test(ln)) {
        mode = 'conclusions';
        curArticle = null; curParagraph = null;
        continue;  // handled later in detectSignatures (linha guardada)
      }

      // ----- detect conclusion markers (transition out of body) -----
      if (VISTO_RE.test(ln) || APROVADA_RE.test(ln) || PROMULGADO_RE.test(ln) ||
          REFERENDADO_RE.test(ln) || ASSINADO_RE.test(ln)) {
        mode = 'conclusions';
        curArticle = null; curParagraph = null;
        continue;  // handled later in detectSignatures
      }

      // ----- recital explícito ("Considerando que…") -----
      if (CONS_RE.test(ln) && mode !== 'body' && mode !== 'annex') {
        r.recitals.push({ id: `rec_${recitalSeq++}`, text: ln });
        mode = 'preamble';
        continue;
      }

      // ----- fórmula promulgatória / dispositiva -----
      // Detecta de duas formas:
      //   (a) linha começa por palavras canónicas ("Assim,", "Manda o Governo",
      //       "Nos termos…", "A Assembleia…")
      //   (b) linha contém "ao abrigo de…" e ainda não temos articulado
      //       (caso típico de Portarias que omitem "Assim,")
      if ((FORMULA_RE.test(ln) || (FORMULA_CONTAINS_RE.test(ln) && !curArticle)) && !curArticle) {
        if (r.formula) r.formula += ' ' + ln;
        else r.formula = ln;
        mode = 'body';
        continue;
      }

      // ----- recital IMPLÍCITO -----
      // Linha narrativa entre o header e a fórmula promulgatória que não
      // começa por "Considerando" — captura preâmbulos reais que omitem
      // essa palavra. Convenção legística: cada parágrafo do source ⇒
      // recital próprio (não concatenar).
      if ((mode === 'header' || mode === 'preamble') && headerLineIdx >= 0 && i > headerLineIdx &&
          !ART_RE.test(ln) && !ART_INLINE_RE.test(ln) && !ANNEX_RE.test(ln) &&
          !(DATE_INLINE_RE.test(ln) && ln.length < 30) /* linha só com data */ &&
          ln.length > 30 /* linha narrativa, não fragmento */) {
        r.recitals.push({ id: `rec_${recitalSeq++}`, text: ln });
        mode = 'preamble';
        continue;
      }

      // ----- article (with inline heading) -----
      let m = ln.match(ART_INLINE_RE);
      if (m) {
        const num = m[2] ? `Artigo ${m[1]}.º-${m[2]}` : `Artigo ${m[1]}.º`;
        const eIdSuffix = m[2] ? `${m[1]}_${m[2].toLowerCase()}` : m[1];
        curArticle = {
          id: `art_${eIdSuffix}`,
          num,
          heading: m[3].trim(),
          paragraphs: [],
        };
        r.articles.push(curArticle);
        curParagraph = null;
        mode = 'body';
        articleSeq = parseInt(m[1], 10) + 1;
        continue;
      }

      // ----- article (heading on next line) -----
      m = ln.match(ART_RE);
      if (m) {
        const num = m[2] ? `Artigo ${m[1]}.º-${m[2]}` : `Artigo ${m[1]}.º`;
        const eIdSuffix = m[2] ? `${m[1]}_${m[2].toLowerCase()}` : m[1];
        const heading = (lines[i + 1] && !NUM_RE.test(lines[i + 1]) && !ALPHA_RE.test(lines[i + 1]) && !ART_RE.test(lines[i + 1]))
          ? lines[++i] : '';
        curArticle = {
          id: `art_${eIdSuffix}`,
          num,
          heading: heading,
          paragraphs: [],
        };
        r.articles.push(curArticle);
        curParagraph = null;
        mode = 'body';
        articleSeq = parseInt(m[1], 10) + 1;
        continue;
      }

      // ----- number ("1 -" inside article or as body element in RCM) -----
      m = ln.match(NUM_RE);
      if (m && (mode === 'body' || mode === 'preamble')) {
        const n = parseInt(m[1], 10);
        if (r.bodyKind === 'paragraphs') {
          // RCM/Res-AR: paragraph directly in body
          curParagraph = {
            id: `para_${n}`,
            num: `${n} -`,
            content: m[2].trim(),
            subPoints: [],
          };
          r.paragraphs.push(curParagraph);
        } else if (curArticle) {
          curParagraph = {
            id: `${curArticle.id}__para_${n}`,
            num: `${n} -`,
            content: m[2].trim(),
            subPoints: [],
          };
          curArticle.paragraphs.push(curParagraph);
        }
        mode = 'body';
        continue;
      }

      // ----- subalínea ("i)", "ii)", "iii)", ...) — testar ANTES de alínea
      //       porque "i)" também casa ALPHA_RE.
      const mRoman = ln.match(ROMAN_RE);
      if (mRoman && curParagraph && curParagraph.subPoints.length) {
        const token = mRoman[1].toLowerCase();
        const lastSp = curParagraph.subPoints[curParagraph.subPoints.length - 1];
        // Disambiguate single "i": if last alínea is single char and "i" doesn't
        // continue the alphabet (e.g. last was "b" → "c" would be expected),
        // treat as subalínea. If last was "h" → "i" continues, treat as alínea.
        const isMultiRoman = token.length > 1 || token === 'v' || token === 'x';
        const continuesAlpha = lastSp.num.length === 2  // "X)"
          && String.fromCharCode(lastSp.num.charCodeAt(0) + 1) === token;
        if (isMultiRoman || !continuesAlpha) {
          if (!lastSp.subPoints) lastSp.subPoints = [];
          lastSp.subPoints.push({
            id: `${lastSp.id}__sublit_${token}`,
            num: `${token})`,
            content: mRoman[2].trim(),
          });
          continue;
        }
      }

      // ----- alínea ("a)") -----
      m = ln.match(ALPHA_RE);
      if (m && curParagraph) {
        const letter = m[1].toLowerCase();
        curParagraph.subPoints.push({
          id: `${curParagraph.id}__lit_${letter}`,
          num: `${letter})`,
          content: m[2].trim(),
          subPoints: [],
        });
        continue;
      }

      // ----- annex content (free text accumulation) -----
      if (mode === 'annex' && curAnnex) {
        curAnnex.content += (curAnnex.content ? ' ' : '') + ln;
        continue;
      }

      // ----- continuation of current paragraph / alinea / subalinea -----
      if (mode === 'body' && curParagraph) {
        if (curParagraph.subPoints.length) {
          const lastSp = curParagraph.subPoints[curParagraph.subPoints.length - 1];
          // Se a alínea já tem subalíneas, continuação vai para a última subalínea
          if (lastSp.subPoints && lastSp.subPoints.length) {
            const lastSsp = lastSp.subPoints[lastSp.subPoints.length - 1];
            lastSsp.content += ' ' + ln;
          } else {
            lastSp.content += ' ' + ln;
          }
        } else {
          curParagraph.content += ' ' + ln;
        }
        continue;
      }
      if (mode === 'body' && curArticle && !curParagraph) {
        // Article body without explicit "1 -" → single anonymous paragraph
        curParagraph = {
          id: `${curArticle.id}__para_1`,
          num: '',
          content: ln,
          subPoints: [],
        };
        curArticle.paragraphs.push(curParagraph);
        continue;
      }
      if (mode === 'preamble' && r.recitals.length) {
        // Continuation of last recital
        r.recitals[r.recitals.length - 1].text += ' ' + ln;
        continue;
      }
    }

    // Ensure body has at least one element
    if (r.bodyKind === 'articles' && !r.articles.length) {
      r.articles.push({
        id: 'art_1', num: 'Artigo 1.º', heading: '',
        paragraphs: [{ id: 'art_1__para_1', num: '', content: '', subPoints: [] }],
      });
      r.warnings.push('Nenhum articulado detectado — criado artigo 1.º vazio.');
    }
    if (r.bodyKind === 'paragraphs' && !r.paragraphs.length) {
      r.paragraphs.push({ id: 'para_1', num: '1 -', content: '', subPoints: [] });
      r.warnings.push('Nenhum ponto resolutivo detectado — criado ponto 1 vazio.');
    }
  }

  // -----------------------------------------------------------------------
  // Habilitante detection (Portaria / Despacho / DRR / DL autorizado)
  // -----------------------------------------------------------------------
  // Heurística: extrai TODAS as citações de diplomas na fórmula promulgatória
  // ("ao abrigo de…" e similares) e escolhe a MAIS PROXIMAL — a última (em
  // Português a cadeia "ao abrigo de A e B" termina no autorizante imediato).
  // Para Portarias regulamentares de orgânicas, o autorizante é frequentemente
  // o Decreto-Lei que aprovou a orgânica.
  function detectHabilitante(r) {
    const needs = ['portaria', 'despacho-normativo', 'drr'].includes(r.actType) ||
                  ['dec-lei-autorizado', 'dlr-autorizado'].includes(r.subtype);
    if (!needs) return;

    // Procurar na fórmula primeiro (mais frequente) e depois em recitais.
    const sources = r.formula
      ? [r.formula, ...r.recitals.map(rc => rc.text)]
      : r.recitals.map(rc => rc.text);

    // Pattern global — captura "tipo n.º N/YYYY" + opcional ", de DD de mês"
    const habGlobalRe = /(Decreto[- ]Lei|Lei(?:\s+Org[âa]nica)?)\s+n\.?[ºo°]?\s*(\d+(?:-[A-Z])?)\s*\/\s*(\d{4})(?:,?\s+de\s+(\d{1,2}\s+de\s+\w+(?:\s+de\s+\d{4})?))?/gi;

    const candidates = [];
    sources.forEach(src => {
      let m;
      habGlobalRe.lastIndex = 0;
      while ((m = habGlobalRe.exec(src)) !== null) {
        const isLei = /lei/i.test(m[1]) && !/decreto/i.test(m[1]);
        candidates.push({
          type: isLei ? 'lei' : 'dec-lei',
          number: m[2],
          year: m[3],
          dateText: m[4] || '',
          raw: m[0].replace(/\s+/g, ' ').trim(),
        });
      }
    });

    if (!candidates.length) return;

    // Estratégia: escolher o ÚLTIMO Decreto-Lei se houver — é o autorizante
    // imediato em Portarias de orgânica. Se só houver Lei, pega a última.
    const dls = candidates.filter(c => c.type === 'dec-lei');
    const choice = dls.length ? dls[dls.length - 1] : candidates[candidates.length - 1];

    r.habilitante = `https://eli.gov.pt/eli/pt/${choice.type}/${choice.year}/${choice.number}/pt`;
    r.habilitanteLabel = choice.raw;
  }

  // -----------------------------------------------------------------------
  // Signature detection
  // -----------------------------------------------------------------------
  // Estratégia em 2 passos:
  //   1. Identifica papel-base por tipo de acto (template-driven)
  //   2. Tenta extrair NOMES da linha real de assinaturas (geralmente a
  //      última linha não-vazia que não é artigo nem anexo).
  //      Formato típico: "O Ministro da X, Nome A. - O Ministro da Y, Nome B."
  //      ou "O Primeiro-Ministro, Nome A. - Promulgado em … - Nome B."
  //
  // Mapa: rótulo no texto → eId do papel
  const ROLE_KEYWORD_MAP = [
    { re: /Primeiro[- ]Ministro/i,            as: 'primeiro-ministro' },
    { re: /Presidente\s+da\s+Rep[úu]blica/i,  as: 'presidente-republica' },
    { re: /Presidente\s+da\s+Assembleia\s+da\s+Rep[úu]blica/i, as: 'presidente-ar' },
    { re: /Presidente\s+da\s+Assembleia\s+Legislativa.*?A[çc]ores/i, as: 'presidente-alra' },
    { re: /Presidente\s+da\s+Assembleia\s+Legislativa.*?Madeira/i,   as: 'presidente-alrm' },
    { re: /Representante\s+da\s+Rep[úu]blica.*?A[çc]ores/i, as: 'representante-republica-acores' },
    { re: /Representante\s+da\s+Rep[úu]blica.*?Madeira/i,   as: 'representante-republica-madeira' },
    { re: /Presidente\s+do\s+Governo\s+Regional.*?A[çc]ores/i, as: 'presidente-governo-regional-acores' },
    { re: /Presidente\s+do\s+Governo\s+Regional.*?Madeira/i,   as: 'presidente-governo-regional-madeira' },
    // Genéricos — verificar DEPOIS dos específicos
    { re: /Ministr[oa]\b/i, as: 'ministro' },
    { re: /Secret[áa]ri[oa]\s+de\s+Estado/i, as: 'secretario-estado' },
  ];

  // Extrai segmentos da linha de assinaturas. Separadores típicos: " - ",
  // ".\s+-\s+", " — " (em dash), ". —". O parser conserva apenas segmentos
  // não vazios com pelo menos um nome próprio (heurística: começa por maiúscula).
  function _splitSignatureLine(line) {
    const segments = line.split(/\s*[-—–]\s*(?=[OAU])/);  // split antes de "O ", "A ", "U "
    if (segments.length <= 1) return [line];
    return segments.map(s => s.trim()).filter(Boolean);
  }

  // Parses um segmento "O Ministro de X, João Silva." → { as, name, title }
  // Estratégia de eId para `as`:
  //   - Para cargos canónicos (PM, PR, Presidente AR…) usa eId fixo
  //   - Para ministros específicos, gera slug do título completo
  //     ("Ministro de Estado e das Finanças" → "ministro-estado-financas")
  //   Isto preserva o título completo na pegada ELI-PT e permite ao
  //   exporter gerar `<TLCRole>` com `showAs` adequado.
  function _parseSignatureSegment(seg) {
    const m = seg.match(/^(?:O|A|Os|As|U[mn]a?)?\s*(.+?),\s*(.+?)\.?\s*$/);
    if (!m) return null;
    const title = m[1].trim();
    const name = m[2].trim();
    // Identificar grupo canónico (para template-driven role assignment)
    let baseAs = null;
    for (const r of ROLE_KEYWORD_MAP) {
      if (r.re.test(title)) { baseAs = r.as; break; }
    }
    if (!baseAs) return null;
    // Se for um cargo COM modificador (e.g. "Ministro de Estado e das Finanças"),
    // gerar eId específico do título. Cargos sem modificador ficam genéricos.
    let as = baseAs;
    if (baseAs === 'ministro' || baseAs === 'secretario-estado') {
      const slug = _slugifyRole(title);
      if (slug && slug !== baseAs) as = slug;
    }
    return { as, name, title };
  }

  // Slugify "Ministro de Estado e das Finanças" → "ministro-estado-financas".
  // Conservador: remove stopwords ("de", "do", "da", "e", "dos", "das"),
  // remove acentos, junta com hífen.
  function _slugifyRole(title) {
    return String(title || '')
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')  // remove acentos
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter(w => w && !['de','do','da','dos','das','e','a','o','os','as'].includes(w))
      .join('-')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function detectSignatures(lines, r) {
    // 1. Procurar linha(s) de assinatura nas últimas 30 linhas.
    //    Ignorar anexos (já capturados) e linhas curtas.
    const tail = lines.slice(-30).filter(Boolean);
    const tailText = tail.join(' ');
    const parsedSigs = [];

    // Heurística: a linha de assinaturas começa com "O " ou "A " seguido de
    // um título de cargo (Ministro/Primeiro-Ministro/Presidente/Secretário…)
    // e tem uma vírgula com nome próprio a seguir. Pode conter vários
    // segmentos separados por " - ".
    const titleStarter = /(?:^|[-—–]\s+)(?:O|A|Os|As)\s+(Ministr[oa]|Primeiro[- ]Ministro|Secret[áa]ri[oa]|Presidente|Representante)\b/;
    for (let i = tail.length - 1; i >= 0; i--) {
      const ln = tail[i];
      if (ART_RE.test(ln) || ART_INLINE_RE.test(ln)) continue;
      if (!titleStarter.test(ln)) continue;
      const segments = _splitSignatureLine(ln);
      segments.forEach(seg => {
        const sig = _parseSignatureSegment(seg);
        if (sig) parsedSigs.push(sig);
      });
      if (parsedSigs.length) break;  // achou — não procurar mais acima
    }

    // 2. Determinar papel-base (signature / countersignature / promulgation)
    //    com base no tipo de acto + sinais textuais
    const sigs = [];
    const hasPromulgated = /promulgad[oa]/i.test(tailText);
    const hasReferended = /referendad[oa]/i.test(tailText);

    if (r.actType === 'dec-lei') {
      const pm = parsedSigs.find(s => s.as === 'primeiro-ministro');
      sigs.push({ role: 'countersignature', as: 'primeiro-ministro',
                  name: pm?.name || '', title: pm?.title || '', date: r.adoptionDate });
      if (hasPromulgated) {
        const pr = parsedSigs.find(s => s.as === 'presidente-republica');
        sigs.push({ role: 'promulgation', as: 'presidente-republica',
                    name: pr?.name || '', title: pr?.title || '', date: r.adoptionDate });
      }
      // Ministros adicionais (referendados) — preservar título específico
      parsedSigs.filter(s => /^ministr/i.test(s.as) && s.as !== 'primeiro-ministro').forEach(s => {
        sigs.push({ role: 'countersignature', as: s.as, name: s.name, title: s.title, date: r.adoptionDate });
      });
    } else if (r.actType === 'lei') {
      const par = parsedSigs.find(s => s.as === 'presidente-ar');
      const pr = parsedSigs.find(s => s.as === 'presidente-republica');
      const pm = parsedSigs.find(s => s.as === 'primeiro-ministro');
      sigs.push({ role: 'signature', as: 'presidente-ar', name: par?.name || '', title: par?.title || '', date: r.adoptionDate });
      sigs.push({ role: 'promulgation', as: 'presidente-republica', name: pr?.name || '', title: pr?.title || '', date: r.adoptionDate });
      sigs.push({ role: 'countersignature', as: 'primeiro-ministro', name: pm?.name || '', title: pm?.title || '', date: r.adoptionDate });
    } else if (r.actType === 'res-cm') {
      const pm = parsedSigs.find(s => s.as === 'primeiro-ministro');
      sigs.push({ role: 'signature', as: 'primeiro-ministro', name: pm?.name || '', title: pm?.title || '', date: r.adoptionDate });
    } else if (r.actType === 'portaria' || r.actType === 'despacho-normativo') {
      // Portarias podem ter VÁRIOS ministros assinantes (frequente para
      // diplomas conjuntos). Emitir uma assinatura por cada ministro,
      // preservando título completo no campo `title` para showAs.
      // Aceita qualquer eId que comece por "ministro" ou "secretario-".
      const ministers = parsedSigs.filter(s =>
        /^ministr/i.test(s.as) || /^secretario/i.test(s.as) || s.as === 'primeiro-ministro');
      if (ministers.length) {
        ministers.forEach(m => sigs.push({
          role: 'signature', as: m.as, name: m.name, title: m.title, date: r.adoptionDate,
        }));
      } else {
        sigs.push({ role: 'signature', as: 'ministro', name: '', date: r.adoptionDate });
      }
    } else if (r.actType === 'decreto-ar' || r.actType === 'res-ar') {
      const par = parsedSigs.find(s => s.as === 'presidente-ar');
      sigs.push({ role: 'signature', as: 'presidente-ar', name: par?.name || '', date: r.adoptionDate });
      if (r.actType === 'decreto-ar') {
        const pr = parsedSigs.find(s => s.as === 'presidente-republica');
        sigs.push({ role: 'promulgation', as: 'presidente-republica', name: pr?.name || '', date: r.adoptionDate });
      }
    } else if (r.actType === 'dlr') {
      const reg = r.country === 'pt-30' ? 'madeira' : 'acores';
      const alr = parsedSigs.find(s => s.as === `presidente-alr${reg === 'madeira' ? 'm' : 'a'}`);
      const rr = parsedSigs.find(s => s.as === `representante-republica-${reg}`);
      sigs.push({ role: 'signature', as: `presidente-alr${reg === 'madeira' ? 'm' : 'a'}`,
                  name: alr?.name || '', date: r.adoptionDate });
      sigs.push({ role: 'promulgation', as: `representante-republica-${reg}`,
                  name: rr?.name || '', date: r.adoptionDate });
    } else if (r.actType === 'drr') {
      const reg = r.country === 'pt-30' ? 'madeira' : 'acores';
      const pgr = parsedSigs.find(s => s.as === `presidente-governo-regional-${reg}`);
      const rr = parsedSigs.find(s => s.as === `representante-republica-${reg}`);
      sigs.push({ role: 'signature', as: `presidente-governo-regional-${reg}`,
                  name: pgr?.name || '', date: r.adoptionDate });
      sigs.push({ role: 'promulgation', as: `representante-republica-${reg}`,
                  name: rr?.name || '', date: r.adoptionDate });
    }

    r.signatures = sigs;
  }

  // -----------------------------------------------------------------------
  // Adapter — convert parser result to editor doc state
  // -----------------------------------------------------------------------
  function toDocState(parsed) {
    const doc = newDocument(parsed.actType);  // get base structure with bookkeeping
    doc.subtype = parsed.subtype || doc.subtype;
    doc.number = parsed.number;
    doc.year = parsed.year;
    doc.country = parsed.country;
    doc.shortTitle = parsed.shortTitle;
    doc.adoptionDate = parsed.adoptionDate;
    doc.publicationDate = parsed.publicationDate;
    doc.docDate = parsed.docDate;
    doc.docDateText = parsed.docDateText;
    doc.recitals = parsed.recitals.length ? parsed.recitals : doc.recitals;
    doc.formula = parsed.formula || FORMULAS[doc.subtype] || '';
    doc.habilitante = parsed.habilitante || '';
    doc.habilitanteLabel = parsed.habilitanteLabel || '';
    doc.signatures = parsed.signatures.length ? parsed.signatures : doc.signatures;
    doc.attachments = parsed.attachments;

    if (parsed.bodyKind === 'articles' && parsed.articles.length) {
      doc.body = { kind: 'articles', items: parsed.articles };
      // Ensure each paragraph has subPoints array
      doc.body.items.forEach(a => {
        a.paragraphs.forEach(p => { if (!p.subPoints) p.subPoints = []; });
      });
      // Update bookkeeping
      const lastNum = parsed.articles
        .map(a => parseInt(a.num.match(/\d+/)?.[0] || '0', 10))
        .reduce((a, b) => Math.max(a, b), 0);
      doc.nextArticleNum = lastNum + 1;
    } else if (parsed.bodyKind === 'paragraphs' && parsed.paragraphs.length) {
      doc.body = { kind: 'paragraphs', items: parsed.paragraphs };
      doc.body.items.forEach(p => { if (!p.subPoints) p.subPoints = []; });
      doc.nextParaNum = parsed.paragraphs.length + 1;
    }

    doc.nextRecitalNum = (doc.recitals.length || 0) + 1;
    doc.nextAttachmentNum = (doc.attachments.length || 0) + 1;

    return doc;
  }

  // -----------------------------------------------------------------------
  // DOCX support — uses mammoth.js from CDN (loaded lazily)
  // -----------------------------------------------------------------------
  let mammothLoaded = false;
  async function loadMammoth() {
    if (mammothLoaded) return;
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js';
      s.onload = () => { mammothLoaded = true; resolve(); };
      s.onerror = () => reject(new Error('Falha ao carregar mammoth.js da CDN.'));
      document.head.appendChild(s);
    });
  }

  async function parseDocx(arrayBuffer) {
    await loadMammoth();
    const result = await window.mammoth.extractRawText({ arrayBuffer });
    return parse(result.value);
  }

  // -----------------------------------------------------------------------
  // AKN-PT XML import (round-trip) — partial; v0.1.0 best-effort
  // -----------------------------------------------------------------------
  function parseAknXml(xmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');
    if (doc.querySelector('parsererror')) {
      throw new Error('XML inválido.');
    }
    const act = doc.querySelector('act');
    if (!act) throw new Error('Não encontrei elemento <act> na raiz.');

    const result = {
      actType: act.getAttribute('name') || 'dec-lei',
      subtype: '', number: '', year: new Date().getFullYear(),
      country: 'pt', shortTitle: '',
      adoptionDate: '', publicationDate: '', docDate: '', docDateText: '',
      recitals: [], formula: '',
      bodyKind: 'articles',
      articles: [], paragraphs: [],
      attachments: [], signatures: [],
      habilitante: '', habilitanteLabel: '',
      warnings: [],
    };

    const ns = 'http://docs.oasis-open.org/legaldocml/ns/akn/3.0/CSD17';
    const q = (sel, ctx) => (ctx || doc).getElementsByTagNameNS(ns, sel);
    const qq = (sel, ctx) => q(sel, ctx)[0];

    // FRBR Work
    const work = qq('FRBRWork');
    if (work) {
      const subType = qq('FRBRsubtype', work);
      if (subType) result.subtype = subType.getAttribute('value');
      const numElem = qq('FRBRnumber', work);
      if (numElem) result.number = numElem.getAttribute('value');
      const dateElem = qq('FRBRdate', work);
      if (dateElem) result.adoptionDate = dateElem.getAttribute('date');
      const countryElem = qq('FRBRcountry', work);
      if (countryElem) result.country = countryElem.getAttribute('value');
      const uri = qq('FRBRuri', work);
      if (uri) {
        const m = uri.getAttribute('value').match(/\/(\d{4})\/(\d+)\//);
        if (m) { result.year = parseInt(m[1], 10); }
      }
    }

    // FRBR Expression
    const exprDate = q('FRBRdate');
    for (const d of exprDate) {
      if (d.getAttribute('name') === 'publication') {
        result.publicationDate = d.getAttribute('date');
        result.docDate = d.getAttribute('date');
        break;
      }
    }

    // Preface
    const sht = qq('shortTitle');
    if (sht) result.shortTitle = sht.textContent.trim();
    const dd = qq('docDate');
    if (dd) result.docDateText = dd.textContent.replace(/^\s*de\s+/, '').trim();

    // Recitals
    for (const rec of q('recital')) {
      const p = qq('p', rec);
      result.recitals.push({
        id: rec.getAttribute('eId') || `rec_${result.recitals.length + 1}`,
        text: p ? p.textContent.trim() : '',
      });
    }
    // Skip habilitante recital (rec_habilitante) for clean round-trip
    const habIdx = result.recitals.findIndex(r => r.id === 'rec_habilitante');
    if (habIdx >= 0) {
      const ref = q('ref', q('recital')[habIdx])[0];
      if (ref) {
        result.habilitante = ref.getAttribute('href');
        result.habilitanteLabel = ref.textContent.trim();
      }
      result.recitals.splice(habIdx, 1);
    }

    // Formula
    const f = qq('formula');
    if (f && f.getAttribute('type') === 'enacting') {
      const p = qq('p', f);
      if (p) result.formula = p.textContent.trim();
    }

    // Body
    result.bodyKind = ['res-cm', 'res-ar'].includes(result.actType) ? 'paragraphs' : 'articles';
    const body = qq('body');
    if (body) {
      if (result.bodyKind === 'articles') {
        for (const art of body.children) {
          if (art.localName !== 'article') continue;
          const num = qq('num', art);
          const heading = qq('heading', art);
          const paragraphs = [];
          for (const para of art.children) {
            if (para.localName !== 'paragraph') continue;
            paragraphs.push(parseParagraph(para, ns));
          }
          result.articles.push({
            id: art.getAttribute('eId'),
            num: num ? num.textContent : '',
            heading: heading ? heading.textContent : '',
            paragraphs,
          });
        }
      } else {
        for (const para of body.children) {
          if (para.localName !== 'paragraph') continue;
          result.paragraphs.push(parseParagraph(para, ns));
        }
      }
    }

    // Attachments
    for (const att of q('attachment')) {
      const h = qq('heading', att);
      const sh = qq('subheading', att);
      const mb = qq('mainBody', att);
      let content = '';
      if (mb) {
        for (const p of q('p', mb)) {
          content += (content ? '\n' : '') + p.textContent.trim();
        }
      }
      result.attachments.push({
        id: att.getAttribute('eId'),
        heading: h ? h.textContent : '',
        subheading: sh ? sh.textContent : '',
        content,
      });
    }

    // Signatures
    for (const sig of q('signature')) {
      const person = qq('person', sig);
      result.signatures.push({
        role: sig.getAttribute('role'),
        as: person ? (person.getAttribute('as') || '').replace(/^#/, '') : '',
        name: '',
        date: result.adoptionDate || result.publicationDate || '',
      });
    }

    return result;
  }

  function parseParagraph(para, ns) {
    const numElem = para.getElementsByTagNameNS(ns, 'num')[0];
    const contentElem = para.getElementsByTagNameNS(ns, 'content')[0];
    const introElem = para.getElementsByTagNameNS(ns, 'intro')[0];
    const listElem = para.getElementsByTagNameNS(ns, 'list')[0];

    let content = '';
    if (contentElem) {
      const p = contentElem.getElementsByTagNameNS(ns, 'p')[0];
      if (p) content = p.textContent.trim();
    }
    if (introElem) {
      const p = introElem.getElementsByTagNameNS(ns, 'p')[0];
      if (p) content = p.textContent.trim();
    }

    const subPoints = [];
    if (listElem) {
      for (const pt of listElem.children) {
        if (pt.localName !== 'point') continue;
        const numP = pt.getElementsByTagNameNS(ns, 'num')[0];
        const pp = pt.getElementsByTagNameNS(ns, 'content')[0];
        const ppe = pp ? pp.getElementsByTagNameNS(ns, 'p')[0] : null;
        subPoints.push({
          id: pt.getAttribute('eId'),
          num: numP ? numP.textContent : '',
          content: ppe ? ppe.textContent.trim() : '',
        });
      }
    }

    return {
      id: para.getAttribute('eId'),
      num: numElem ? numElem.textContent : '',
      content,
      subPoints,
    };
  }

  return { parse, parseDocx, parseAknXml, toDocState };
})();

if (typeof window !== "undefined") window.ImportParser = ImportParser;
