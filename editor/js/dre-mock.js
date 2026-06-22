// AKN-PT Editor — base mock do DRE (Diário da República)
// EUPL-1.2
//
// Em produção esta base seria substituída por chamadas a uma API real do
// DRE/INCM. Aqui temos ~40 diplomas reais frequentemente citados, suficientes
// para demonstrar a UX de autocomplete contra um corpus institucional.
//
// API
//   DreMock.search(query)        → [{label, eli, type, number, year, date, title}]
//   DreMock.byUri(uri)           → entry | null
//   DreMock.suggest(query, limit)→ array com max `limit` matches

const DreMock = (() => {

  // Diplomas hipotéticos (PT) — selecção real para demo
  const CORPUS = [
    // Constituição
    { type: 'crp', label: 'Constituição da República Portuguesa', number: '', year: 1976, date: '1976-04-02', eli: 'https://data.dre.pt/eli/crp/1976/04/02', title: 'Constituição da República Portuguesa' },
    // Códigos
    { type: 'cod', label: 'Código Civil', number: '47344', year: 1966, date: '1966-11-25', eli: 'https://data.dre.pt/eli/dec-lei/47344/1966/11/25', title: 'Aprova o Código Civil' },
    { type: 'cod', label: 'Código do Trabalho', number: '7', year: 2009, date: '2009-02-12', eli: 'https://data.dre.pt/eli/lei/7/2009/02/12', title: 'Aprova a revisão do Código do Trabalho' },
    { type: 'cod', label: 'Código de Procedimento Administrativo (CPA)', number: '4', year: 2015, date: '2015-01-07', eli: 'https://data.dre.pt/eli/dec-lei/4/2015/01/07', title: 'Aprova o novo CPA' },
    { type: 'cod', label: 'Código dos Contratos Públicos (CCP)', number: '18', year: 2008, date: '2008-01-29', eli: 'https://data.dre.pt/eli/dec-lei/18/2008/01/29', title: 'Aprova o CCP' },
    // Leis recentes representativas
    { type: 'lei', label: 'Lei n.º 5-A/2026 — pegada legislativa', number: '5-A', year: 2026, date: '2026-01-27', eli: 'https://data.dre.pt/eli/lei/5-a/2026/01/27', title: 'Procedimento legislativo aberto: pegada e workflow' },
    { type: 'lei', label: 'Lei n.º 7/2009 — Código do Trabalho', number: '7', year: 2009, date: '2009-02-12', eli: 'https://data.dre.pt/eli/lei/7/2009/02/12', title: 'Revisão do Código do Trabalho' },
    { type: 'lei', label: 'Lei n.º 58/2019 — RGPD nacional', number: '58', year: 2019, date: '2019-08-08', eli: 'https://data.dre.pt/eli/lei/58/2019/08/08', title: 'Execução do RGPD na ordem jurídica interna' },
    { type: 'lei', label: 'Lei n.º 93/2021 — Denunciantes (transposição Dir. 2019/1937)', number: '93', year: 2021, date: '2021-12-20', eli: 'https://data.dre.pt/eli/lei/93/2021/12/20', title: 'Regime geral de proteção de denunciantes' },
    { type: 'lei', label: 'Lei n.º 35/2014 — LGTFP', number: '35', year: 2014, date: '2014-06-20', eli: 'https://data.dre.pt/eli/lei/35/2014/06/20', title: 'Lei Geral do Trabalho em Funções Públicas' },
    { type: 'lei', label: 'Lei n.º 75/2013 — Autarquias locais', number: '75', year: 2013, date: '2013-09-12', eli: 'https://data.dre.pt/eli/lei/75/2013/09/12', title: 'Regime jurídico das autarquias locais' },
    // DLs recentes representativos
    { type: 'dec-lei', label: 'Decreto-Lei n.º 21/2023 — Denunciantes (transposição DL)', number: '21', year: 2023, date: '2023-03-27', eli: 'https://data.dre.pt/eli/dec-lei/21/2023/03/27', title: 'Transpõe a Diretiva (UE) 2019/1937' },
    { type: 'dec-lei', label: 'Decreto-Lei n.º 4/2015 — CPA', number: '4', year: 2015, date: '2015-01-07', eli: 'https://data.dre.pt/eli/dec-lei/4/2015/01/07', title: 'Aprova o novo CPA' },
    { type: 'dec-lei', label: 'Decreto-Lei n.º 18/2008 — CCP', number: '18', year: 2008, date: '2008-01-29', eli: 'https://data.dre.pt/eli/dec-lei/18/2008/01/29', title: 'Aprova o CCP' },
    { type: 'dec-lei', label: 'Decreto-Lei n.º 442/91 — CPA (antigo)', number: '442', year: 1991, date: '1991-11-15', eli: 'https://data.dre.pt/eli/dec-lei/442/1991/11/15', title: 'Antigo CPA' },
    { type: 'dec-lei', label: 'Decreto-Lei n.º 78/2021 — Águas pluviais (corpus AKN-PT)', number: '78', year: 2021, date: '2021-10-13', eli: 'https://data.dre.pt/eli/dec-lei/78/2021/10/13', title: 'Alteração ao DL 72/2020' },
    { type: 'dec-lei', label: 'Decreto-Lei n.º 72/2020 — Águas pluviais', number: '72', year: 2020, date: '2020-09-15', eli: 'https://data.dre.pt/eli/dec-lei/72/2020/09/15', title: 'Regime das águas pluviais urbanas' },
    { type: 'dec-lei', label: 'Decreto-Lei n.º 56/2021 — Apoios extraordinários PME', number: '56', year: 2021, date: '2021-06-30', eli: 'https://data.dre.pt/eli/dec-lei/56/2021/06/30', title: 'Apoios extraordinários a micro e pequenas empresas' },
    { type: 'dec-lei', label: 'Decreto-Lei n.º 22/2025 — Modernização', number: '22', year: 2025, date: '2025-11-05', eli: 'https://data.dre.pt/eli/dec-lei/22/2025/11/05', title: 'Modernização administrativa' },
    // Portarias representativas
    { type: 'portaria', label: 'Portaria n.º 249/2021 — Apoios PME', number: '249', year: 2021, date: '2021-11-22', eli: 'https://data.dre.pt/eli/port/249/2021/11/22', title: 'Regulamenta o regime de apoio extraordinário' },
    { type: 'portaria', label: 'Portaria n.º 233/2019 — Tabelas IRS', number: '233', year: 2019, date: '2019-07-26', eli: 'https://data.dre.pt/eli/port/233/2019/07/26', title: 'Tabelas de retenção IRS' },
    // RCMs
    { type: 'res-cm', label: 'RCM n.º 53/2020 — Plano de Recuperação', number: '53', year: 2020, date: '2020-07-10', eli: 'https://data.dre.pt/eli/resolconsmin/53/2020/07/10', title: 'Plano de Recuperação e Resiliência' },
    // Diretivas UE relevantes
    { type: 'eu-dir', label: 'Diretiva (UE) 2019/1937 — Denunciantes', number: '1937', year: 2019, date: '2019-10-23', eli: 'http://data.europa.eu/eli/dir/2019/1937/oj', title: 'Proteção das pessoas que denunciam violações do direito da União' },
    { type: 'eu-dir', label: 'Diretiva (UE) 2016/680 — Proteção dados na justiça', number: '680', year: 2016, date: '2016-04-27', eli: 'http://data.europa.eu/eli/dir/2016/680/oj', title: 'Proteção de dados em matéria penal' },
    { type: 'eu-dir', label: 'Diretiva 95/46/CE — Proteção dados (revogada)', number: '46', year: 1995, date: '1995-10-24', eli: 'http://data.europa.eu/eli/dir/1995/46/oj', title: 'Antiga Directiva da Protecção de Dados' },
    // Regulamentos UE
    { type: 'eu-reg', label: 'Regulamento (UE) 2016/679 — RGPD', number: '679', year: 2016, date: '2016-04-27', eli: 'http://data.europa.eu/eli/reg/2016/679/oj', title: 'Regulamento Geral sobre a Proteção de Dados' },
  ];

  function search(query) {
    if (!query || query.length < 2) return [];
    const q = _norm(query);
    const tokens = q.split(/\s+/).filter(Boolean);
    const scored = CORPUS.map(d => {
      const haystack = _norm(`${d.label} ${d.title} ${d.type} ${d.number} ${d.year}`);
      let score = 0;
      tokens.forEach(t => {
        if (haystack.includes(t)) score += 10;
        if (haystack.startsWith(t)) score += 5;
        if ((d.number + '').startsWith(t)) score += 15;
        if (String(d.year) === t) score += 20;
      });
      return { ...d, score };
    }).filter(d => d.score > 0)
      .sort((a, b) => b.score - a.score);
    return scored;
  }

  function suggest(query, limit = 8) {
    return search(query).slice(0, limit);
  }

  function byUri(uri) {
    return CORPUS.find(d => d.eli === uri) || null;
  }

  function _norm(s) {
    return String(s || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[º°ª\.]/g, '');
  }

  function all() { return CORPUS.slice(); }

  return { search, suggest, byUri, all };
})();

if (typeof window !== 'undefined') window.DreMock = DreMock;
if (typeof globalThis !== 'undefined') globalThis.DreMock = DreMock;
