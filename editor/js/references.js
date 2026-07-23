// AKN-PT Editor — resolução de referências cruzadas
// EUPL-1.2
//
// Dois tipos de referência são detectados em texto livre (content / intro /
// recital / formula) e materializados como `<ref href="…">` no XML AKN-PT
// exportado:
//
//   1. INTERNAS — apontam para um elemento dentro do próprio diploma
//      Padrões reconhecidos (case-insensitive, mas preservando o texto):
//        - "artigo 3.º"                              → #art_3
//        - "n.º 2 do artigo 5.º"                     → #art_5__para_2
//        - "alínea a) do n.º 1 do artigo 4.º"        → #art_4__para_1__lit_a
//        - "subalínea i) da alínea b) do n.º 2 do artigo 5.º"
//                                                    → #art_5__para_2__lit_b__sublit_i
//
//   2. EXTERNAS — diplomas portugueses referidos por tipo/número/ano [+data]
//      A citação completa inclui a data, permitindo o URI canónico data.dre.pt:
//        - "Decreto-Lei n.º 43-B/2024, de 2 de julho"
//              → https://data.dre.pt/eli/dec-lei/43-B/2024/07/02
//        - "Lei n.º 7/2009, de 12 de fevereiro"
//              → https://data.dre.pt/eli/lei/7/2009/02/12
//      Citação ABREVIADA (sem data) → DreMock se conhecido, senão fallback
//      eli.gov.pt (ano+número):
//        - "Decreto-Lei n.º 21/2023"  → https://eli.gov.pt/eli/pt/dec-lei/2023/21/pt
//        - Diretivas UE (mantém URI ELI europeu se fornecida no texto)
//
// API:
//   References.findAll(text, doc)        → [{kind, raw, start, end, href, label}]
//   References.toXmlEscaped(text, doc)   → string com <ref> XML, já XML-safe
//   References.toHtmlPreview(text, doc)  → HTML para preview com tooltips
//
// O texto retornado por `toXmlEscaped` JÁ ESTÁ XML-encoded (escape do resto +
// elementos `<ref>` literais). Substitui `escapeXml(text)` directamente.

const References = (() => {

  // ----- Patterns ---------------------------------------------------------

  // Sufixos comuns para "º": ., º, °, º, o, plain
  const ORD = `\\.[ºo°ᵒ]?|\\.°|º|°|\\.`;
  const NUMRE = `(\\d+)(?:\\s*[-‑–]\\s*[A-Z])?`;  // 5 ou 5-A

  // ordem: do mais específico para o menos
  const PATTERNS_INTERNAL = [
    {
      // "subalínea i) da alínea b) do n.º 2 do artigo 5.º"
      re: /\bsubal[íi]nea\s+([ivxlcdm]+)\)\s+d[ao]\s+al[íi]nea\s+([a-z])\)\s+d[ao]\s+n\.?[ºo°]?\s*(\d+)\s+d[ao]\s+artigo\s+(\d+)(?:\s*[-‑–]\s*[A-Z])?(?:\.[ºo°]?)?/gi,
      kind: 'subalinea',
      hrefFn: (m) => `#art_${m[4]}__para_${m[3]}__lit_${m[2].toLowerCase()}__sublit_${m[1].toLowerCase()}`,
    },
    {
      // "alínea a) do n.º 1 do artigo 4.º"
      re: /\bal[íi]nea\s+([a-z])\)\s+d[ao]\s+n\.?[ºo°]?\s*(\d+)\s+d[ao]\s+artigo\s+(\d+)(?:\s*[-‑–]\s*[A-Z])?(?:\.[ºo°]?)?/gi,
      kind: 'alinea',
      hrefFn: (m) => `#art_${m[3]}__para_${m[2]}__lit_${m[1].toLowerCase()}`,
    },
    {
      // "alínea a) do artigo 4.º"  (sem n.º — caso de paragraph único)
      re: /\bal[íi]nea\s+([a-z])\)\s+d[ao]\s+artigo\s+(\d+)(?:\s*[-‑–]\s*[A-Z])?(?:\.[ºo°]?)?/gi,
      kind: 'alinea-direct',
      hrefFn: (m) => `#art_${m[2]}__para_1__lit_${m[1].toLowerCase()}`,
    },
    {
      // "n.º 2 do artigo 5.º"
      re: /\bn\.?[ºo°]?\s*(\d+)\s+d[ao]\s+artigo\s+(\d+)(?:\s*[-‑–]\s*[A-Z])?(?:\.[ºo°]?)?/gi,
      kind: 'numero',
      hrefFn: (m) => `#art_${m[2]}__para_${m[1]}`,
    },
    {
      // "artigo 3.º" / "artigo 3.º-A"
      re: /\bartigo\s+(\d+)(\s*[-‑–]\s*[A-Z])?(?:\.[ºo°]?)?/gi,
      kind: 'artigo',
      hrefFn: (m) => `#art_${m[1]}${m[2] ? '_' + m[2].replace(/[\s‑–-]/g, '').toLowerCase() : ''}`,
    },
  ];

  const ACT_TYPE_TO_SLUG = {
    'decreto-lei': 'dec-lei',
    'decreto lei': 'dec-lei',
    'dec.-lei': 'dec-lei',
    'dl': 'dec-lei',
    'lei': 'lei',
    'lei orgânica': 'lei',
    'portaria': 'portaria',
    'resolução do conselho de ministros': 'res-cm',
    'rcm': 'res-cm',
    'resolução da assembleia da república': 'res-ar',
    'resolução': 'res-cm',
    'despacho normativo': 'despacho-normativo',
    'decreto da assembleia da república': 'decreto-ar',
    'decreto legislativo regional': 'dlr',
    'decreto regulamentar regional': 'drr',
  };

  // Externas — captura tipo (frase longa), número, ano e (opcional) a data
  // legística ", de {dia} de {mês} [de {ano}]". Grupos:
  //   m[1]=tipo  m[2]=número  m[3]=ano  m[4]=dia  m[5]=mês-extenso  m[6]=ano-na-data
  const RE_EXT_PT = new RegExp(
    `\\b(Decreto-Lei|Decreto\\u00a0Lei|Lei\\s+Org[\\u00e2a]nica|Lei|Portaria|Resolu[\\u00e7c][\\u00e3a]o\\s+do\\s+Conselho\\s+de\\s+Ministros|RCM|Resolu[\\u00e7c][\\u00e3a]o\\s+da\\s+Assembleia\\s+da\\s+Rep[\\u00fau]blica|Despacho\\s+normativo|Decreto\\s+da\\s+Assembleia\\s+da\\s+Rep[\\u00fau]blica|Decreto\\s+Legislativo\\s+Regional|Decreto\\s+Regulamentar\\s+Regional)\\s+n\\.?[\\u00ba\\u00b0o]?\\s*(\\d+(?:\\s*-\\s*[A-Za-z0-9]+)?)\\/(\\d{4})(?:,?\\s+de\\s+(\\d{1,2})\\s+de\\s+([A-Za-z\\u00e7\\u00c7]+)(?:\\s+de\\s+(\\d{4}))?)?`,
    'gi'
  );

  // Meses PT → número (para construir a data no URI canónico data.dre.pt).
  const MONTHS = {
    janeiro: 1, fevereiro: 2, 'março': 3, marco: 3, abril: 4, maio: 5, junho: 6,
    julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
  };
  function _monthToMM(name) {
    const m = MONTHS[String(name || '').toLowerCase().replace('ç', 'c')];
    return m ? String(m).padStart(2, '0') : '';
  }

  // Directivas UE — mantém URI ELI europeu se referida
  const RE_EXT_UE = /\bDiretiva\s+\(UE\)\s+(\d{4})\/(\d+)/gi;

  // ----- Find -------------------------------------------------------------

  function findAll(text, doc) {
    if (!text) return [];
    const matches = [];

    // Pré-computar conjunto de eIds existentes no doc para validar refs internas.
    // Sem isto, padrões como "artigo 198.º da Constituição" ou "alínea a) do
    // n.º 1 do artigo 8.º do Decreto-Lei n.º 56/2021" seriam (incorrectamente)
    // resolvidos como ponteiros internos.
    const eIds = _collectEids(doc);

    // internas — só matchar se NÃO há contexto que indique externo logo após
    // o nome do artigo (ex. "do Decreto-Lei", "da Constituição", "da Lei", etc.)
    // E só emitir se o eId alvo existir.
    PATTERNS_INTERNAL.forEach(p => {
      p.re.lastIndex = 0;
      let m;
      while ((m = p.re.exec(text)) !== null) {
        const href = p.hrefFn(m);
        // verificar overlapping (privilegia matches mais longos já adicionados)
        if (_overlaps(matches, m.index, m.index + m[0].length)) continue;
        // anti-falso-positivo: olhar 50 chars à frente para "do Decreto-Lei…",
        // "da Constituição", "da Lei…", "do referido", "do mesmo diploma", etc.
        const tail = text.slice(m.index + m[0].length, m.index + m[0].length + 80);
        if (/^\s*(?:da\s+Constitui[çc][ãa]o|do\s+(?:Decreto-Lei|C[óo]digo|Tratado|Estatuto|Regime|Regulamento|referido\s+diploma)|d[ao]\s+(?:Lei|Portaria|Resolu[çc][ãa]o|Despacho|Decreto)|d[ao]\s+mesmo\s+diploma|d[ao]\s+presente\s+(?:Lei|Decreto-Lei|Portaria|Resolu[çc][ãa]o))/i.test(tail)) {
          continue;
        }
        // só emitir se o eId alvo realmente existir
        if (eIds && !eIds.has(href.slice(1))) continue;
        matches.push({
          kind: p.kind, raw: m[0], start: m.index, end: m.index + m[0].length,
          href, label: m[0],
        });
      }
    });

    // externas PT
    RE_EXT_PT.lastIndex = 0;
    let m;
    while ((m = RE_EXT_PT.exec(text)) !== null) {
      if (_overlaps(matches, m.index, m.index + m[0].length)) continue;
      const slug = _slugForType(m[1]);
      const num = m[2].replace(/\s/g, '');
      const year = m[3];
      const href = _eliForExternal(slug, num, year, m[4], m[5], m[6]);
      matches.push({
        kind: 'external-pt', raw: m[0], start: m.index, end: m.index + m[0].length,
        href, label: m[0],
      });
    }

    // externas UE
    RE_EXT_UE.lastIndex = 0;
    while ((m = RE_EXT_UE.exec(text)) !== null) {
      if (_overlaps(matches, m.index, m.index + m[0].length)) continue;
      const year = m[1], num = m[2];
      const href = `http://data.europa.eu/eli/dir/${year}/${num}/oj`;
      matches.push({
        kind: 'external-ue', raw: m[0], start: m.index, end: m.index + m[0].length,
        href, label: m[0],
      });
    }

    matches.sort((a, b) => a.start - b.start);
    return matches;
  }

  function _overlaps(arr, s, e) {
    return arr.some(m => !(e <= m.start || s >= m.end));
  }

  function _collectEids(doc) {
    if (!doc || !doc.body) return null;
    const set = new Set();
    if (doc.body.kind === 'articles') {
      (doc.body.items || []).forEach(a => {
        set.add(a.id);
        (a.paragraphs || []).forEach(p => {
          set.add(p.id);
          (p.subPoints || []).forEach(sp => {
            set.add(sp.id);
            (sp.subPoints || []).forEach(ssp => set.add(ssp.id));
          });
        });
      });
    } else {
      (doc.body.items || []).forEach(p => {
        set.add(p.id);
        (p.subPoints || []).forEach(sp => set.add(sp.id));
      });
    }
    return set;
  }

  // URI ELI para uma citação externa (tipo+número+ano [+dia+mês]).
  // A citação legística COMPLETA em português inclui SEMPRE a data — ex.
  // "Decreto-Lei n.º 43-B/2024, de 2 de julho" — fornecendo tipo, número,
  // ano, DIA e MÊS. Logo o template canónico data.dre.pt
  // (/eli/{tipo}/{nº}/{ano}/{mês}/{dia}) É construível a partir da citação:
  //   (a) citação completa (com ", de {dia} de {mês}") → forma canónica data.dre.pt;
  //   (b) citação ABREVIADA (só tipo+nº/ano) → falta mês/dia: tenta-se o DreMock;
  //   (c) último recurso → forma eli.gov.pt (ano+número).
  // A constructibilidade NÃO distingue as formas: ambas se constroem da citação
  // completa. O que resta para a forma eli.gov.pt são pontos menores — jurisdição
  // explícita no URI e alinhamento estético com o padrão ano+número da UE. A forma
  // da INCM (data.dre.pt) não é errada: é a tradição legística PT. O caveat é só a
  // citação abreviada (incompleta por padrão legístico), não uma falha do esquema.
  // slug legística → slug ELI REAL da INCM (ver eli-pt/incm-eli-reference.md).
  const ELI_SLUG = {
    'dec-lei': 'dec-lei', 'lei': 'lei', 'portaria': 'port', 'res-cm': 'resolconsmin',
    'res-ar': 'resolassrep', 'despacho-normativo': 'despnorm', 'dlr': 'declegreg',
    'drr': 'decregulreg', 'decreto-ar': 'dec',
  };
  function _incmSlug(s) { return ELI_SLUG[s] || s; }

  function _eliForExternal(slug, num, year, dia, mesNome, anoData) {
    const incm = _incmSlug(slug);
    const numL = String(num).toLowerCase();
    const mm = _monthToMM(mesNome);
    if (dia && mm) {
      const yyyy = anoData || year;
      // Work canónico INCM termina em /p/dre (nacional; território p por defeito).
      return `https://data.dre.pt/eli/${incm}/${numL}/${yyyy}/${mm}/${String(dia).padStart(2, '0')}/p/dre`;
    }
    if (typeof DreMock !== 'undefined' && DreMock.all) {
      const needle = `/eli/${incm}/${numL}/${year}/`;
      const hit = DreMock.all().find(e => e.eli && e.eli.includes(needle));
      if (hit) return hit.eli;
    }
    // Índice real de atos (Atom feed da INCM), quando já carregado.
    if (typeof ActIndex !== 'undefined' && ActIndex.findAct) {
      const hit = ActIndex.findAct(numL, year, incm);
      if (hit && hit.eli) return hit.eli;
    }
    // Sem dia/mês e sem correspondência, o Work canónico da INCM NÃO é
    // construível. Devolve-se null em vez de inventar um URI não-canónico: os
    // consumidores rendem a citação como texto simples (ver toXmlEscaped), para
    // que nunca entre no XML exportado um href que não resolve.
    return null;
  }

  function _slugForType(raw) {
    const key = raw.toLowerCase().replace(/ /g, ' ').trim();
    return ACT_TYPE_TO_SLUG[key] || ACT_TYPE_TO_SLUG[key.replace(/\s+/g, ' ')] || 'lei';
  }

  // ----- Render para XML --------------------------------------------------

  // Substitui escapeXml(text) — devolve string com `<ref href=…>texto</ref>`
  // e o resto do texto já XML-escaped.
  function toXmlEscaped(text, doc) {
    if (!text) return '';
    const refs = findAll(text, doc);
    if (!refs.length) return _esc(text);
    let out = '', last = 0;
    refs.forEach(r => {
      if (r.start > last) out += _esc(text.slice(last, r.start));
      // Sem href resolvido, a citação sai como texto simples — nunca se emite
      // um <ref> com URI inventado (ver _eliForExternal).
      out += r.href
        ? `<ref href="${_escAttr(r.href)}">${_esc(r.raw)}</ref>`
        : _esc(r.raw);
      last = r.end;
    });
    if (last < text.length) out += _esc(text.slice(last));
    return out;
  }

  function _esc(s) {
    return String(s)
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", '&apos;');
  }
  function _escAttr(s) { return _esc(s); }

  // ----- Render para Preview HTML ----------------------------------------

  function toHtmlPreview(text, doc) {
    if (!text) return '';
    const refs = findAll(text, doc);
    if (!refs.length) return _escHtml(text);
    let out = '', last = 0;
    refs.forEach(r => {
      if (r.start > last) out += _escHtml(text.slice(last, r.start));
      if (!r.href) {
        // Citação detectada mas não resolúvel para ELI canónico: mostra-se
        // assinalada, sem hiperligação inventada.
        out += `<span class="ref ref-unresolved" title="Sem ELI canónico — falta a data completa da citação">${_escHtml(r.raw)}</span>`;
      } else {
        const isInternal = r.href.startsWith('#');
        const cls = isInternal ? 'ref ref-internal' : 'ref ref-external';
        out += `<a class="${cls}" href="${_escHtml(r.href)}" title="${_escHtml(r.href)}">${_escHtml(r.raw)}</a>`;
      }
      last = r.end;
    });
    if (last < text.length) out += _escHtml(text.slice(last));
    return out;
  }

  function _escHtml(s) {
    const div = document.createElement('div');
    div.textContent = String(s);
    return div.innerHTML;
  }

  // Lista detalhada de todas as refs num doc, com localização ("where")
  // e flag broken (apenas para refs internas cujo eId alvo não existe).
  // Devolve [{kind, raw, href, where, broken}] em ordem natural de leitura.
  function listAllForDoc(doc) {
    if (!doc) return [];
    const eIds = _collectEids(doc) || new Set();
    const out = [];
    const collect = (text, where) => {
      if (!text) return;
      findAll(text, doc).forEach(r => {
        let broken = false;
        if (r.href.startsWith('#')) {
          broken = !eIds.has(r.href.slice(1));
        }
        out.push({ kind: r.kind, raw: r.raw, href: r.href, where, broken });
      });
    };
    (doc.recitals || []).forEach((r, i) => collect(r.text, `Considerando ${i + 1}`));
    if (doc.formula) collect(doc.formula, 'Fórmula');
    if (doc.shortTitle) collect(doc.shortTitle, 'Ementa');
    if (doc.body && doc.body.kind === 'articles') {
      (doc.body.items || []).forEach(a => {
        collect(a.heading, `${a.num || a.id} (epígrafe)`);
        (a.paragraphs || []).forEach(p => {
          collect(p.content, `${a.num || a.id} ${p.num || ''}`.trim());
          (p.subPoints || []).forEach(sp => {
            collect(sp.content, `${a.num || a.id} ${p.num || ''} ${sp.num}`.trim());
            (sp.subPoints || []).forEach(ssp =>
              collect(ssp.content, `${a.num || a.id} ${p.num || ''} ${sp.num} ${ssp.num}`.trim()));
          });
        });
      });
    } else if (doc.body) {
      (doc.body.items || []).forEach(p => {
        collect(p.content, p.num || p.id);
        (p.subPoints || []).forEach(sp =>
          collect(sp.content, `${p.num || p.id} ${sp.num}`.trim()));
      });
    }
    return out;
  }

  // Stats: quantas refs foram detectadas em todo o doc
  function statsForDoc(doc) {
    const counters = { internal: 0, externalPt: 0, externalUe: 0, total: 0 };
    const visit = (t) => {
      if (!t) return;
      findAll(t, doc).forEach(r => {
        counters.total++;
        if (r.kind === 'external-pt') counters.externalPt++;
        else if (r.kind === 'external-ue') counters.externalUe++;
        else counters.internal++;
      });
    };
    (doc.recitals || []).forEach(r => visit(r.text));
    visit(doc.formula);
    visit(doc.shortTitle);
    if (doc.body && doc.body.kind === 'articles') {
      (doc.body.items || []).forEach(a => {
        visit(a.heading);
        (a.paragraphs || []).forEach(p => {
          visit(p.content);
          (p.subPoints || []).forEach(sp => {
            visit(sp.content);
            (sp.subPoints || []).forEach(ssp => visit(ssp.content));
          });
        });
      });
    } else if (doc.body) {
      (doc.body.items || []).forEach(p => {
        visit(p.content);
        (p.subPoints || []).forEach(sp => visit(sp.content));
      });
    }
    return counters;
  }

  return { findAll, toXmlEscaped, toHtmlPreview, statsForDoc, listAllForDoc };
})();

if (typeof window !== "undefined") window.References = References;
