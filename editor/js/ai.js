// AKN-PT Editor — assistente IA
// EUPL-1.2
//
// Liga directamente à API da Anthropic (Claude) a partir do browser, com a
// chave da API fornecida pelo utilizador e guardada em localStorage. Para uso
// puramente local — em produção o gateway iria via backend institucional.
//
// Tarefas pré-definidas (cada uma com um system prompt curado):
//   - draftNote        : gera nota justificativa do diploma
//   - simplify         : reescreve texto em linguagem clara (1 parágrafo)
//   - detectAmbiguity  : identifica ambiguidades, vaguidade, anafóricos
//   - suggestHeading   : propõe epígrafe para artigo sem heading
//   - summarize        : sumário executivo do diploma (3-5 bullets)
//
// Modo "mock" — quando não há chave configurada, devolve respostas demo
// para que a UI seja testável sem dependência externa.

const AI = (() => {
  const KEY_STORAGE = 'akn-pt-ai-key-v1';
  const MODEL_STORAGE = 'akn-pt-ai-model-v1';
  const DEFAULT_MODEL = 'claude-sonnet-4-5';

  function setApiKey(k) { try { localStorage.setItem(KEY_STORAGE, k || ''); } catch {} }
  function getApiKey() { try { return localStorage.getItem(KEY_STORAGE) || ''; } catch { return ''; } }
  function setModel(m) { try { localStorage.setItem(MODEL_STORAGE, m || ''); } catch {} }
  function getModel() { try { return localStorage.getItem(MODEL_STORAGE) || DEFAULT_MODEL; } catch { return DEFAULT_MODEL; } }
  function isConfigured() { return !!getApiKey(); }

  // ----- Prompts -----------------------------------------------------------

  const SYSTEM_BASE = `És um assistente de drafting legislativo português. Trabalhas com diplomas portugueses (Decreto-Lei, Lei, Portaria, etc.) marcados em AKN-PT v0.1.0. Respondes em português europeu, na 3.ª pessoa, em registo formal mas claro. Privilegia a legística portuguesa: frases curtas, voz activa, terminologia oficial, evitar latim e estrangeirismos quando exista equivalente português. Não inventas factos jurídicos — quando precisas de informação que não tens, pedes ou marcas como suposição.`;

  const TASKS = {
    draftNote: {
      system: SYSTEM_BASE + `\n\nTarefa: redigir a NOTA JUSTIFICATIVA do diploma (3 a 5 parágrafos). Estrutura típica: (1) contexto e necessidade; (2) opções de fundo; (3) síntese do conteúdo dispositivo; (4) ponderação de impactos; (5) conformidade com legística e leis habilitantes. Devolve apenas o texto da nota, sem cabeçalhos.`,
      label: 'Nota justificativa',
      buildUser: (doc) => `Diploma:\n${_summarizeDoc(doc)}\n\nRedige a nota justificativa.`,
    },
    simplify: {
      system: SYSTEM_BASE + `\n\nTarefa: reescrever o texto seguinte em linguagem clara, mantendo rigor jurídico mas reduzindo subordinação, voz passiva e nominalizações. Devolve apenas o texto reescrito.`,
      label: 'Simplificar texto',
      buildUser: (text) => `Texto a simplificar:\n\n${text}`,
    },
    detectAmbiguity: {
      system: SYSTEM_BASE + `\n\nTarefa: analisar o texto seguinte e identificar AMBIGUIDADES (sintácticas, semânticas, anafóricas), VAGUIDADES e termos indefinidos. Devolve uma lista numerada curta, máx. 5 itens, cada um com (a) trecho citado entre aspas, (b) tipo de problema, (c) sugestão de reformulação. Se não houver problemas relevantes, responde "Sem ambiguidades detectadas".`,
      label: 'Detectar ambiguidade',
      buildUser: (text) => `Texto a analisar:\n\n${text}`,
    },
    suggestHeading: {
      system: SYSTEM_BASE + `\n\nTarefa: propor 3 alternativas curtas de EPÍGRAFE (heading) para o artigo seguinte. Cada alternativa: 2 a 6 palavras, em nominal, sem ponto final. Devolve apenas as 3 alternativas, uma por linha.`,
      label: 'Sugerir epígrafe',
      buildUser: (article) => `Artigo (sem epígrafe):\n${article.num}\n${article.paragraphs.map(p => `${p.num || ''} ${p.content}`).join('\n')}`,
    },
    summarize: {
      system: SYSTEM_BASE + `\n\nTarefa: produzir um SUMÁRIO EXECUTIVO do diploma em 3 a 5 bullets, cada um com no máximo 2 linhas. Foca no que o diploma faz (não no que considera). Devolve apenas a lista, com hífenes.`,
      label: 'Sumário executivo',
      buildUser: (doc) => `Diploma:\n${_summarizeDoc(doc)}`,
    },
  };

  function _summarizeDoc(doc) {
    const parts = [];
    parts.push(`Tipo: ${doc.actName} (${doc.subtype || 'sem subtipo'})`);
    if (doc.number) parts.push(`Número: ${doc.number}/${doc.year}`);
    if (doc.shortTitle) parts.push(`Ementa: ${doc.shortTitle}`);
    if (doc.habilitanteLabel) parts.push(`Habilitante: ${doc.habilitanteLabel}`);
    if (doc.recitals && doc.recitals.length) {
      parts.push(`\nConsiderandos:`);
      doc.recitals.forEach(r => parts.push(`- ${r.text}`));
    }
    if (doc.body && doc.body.kind === 'articles') {
      parts.push(`\nArticulado:`);
      doc.body.items.forEach(a => {
        parts.push(`${a.num} — ${a.heading || ''}`);
        a.paragraphs.forEach(p => {
          parts.push(`  ${p.num || ''} ${p.content}`);
          (p.subPoints || []).forEach(sp => parts.push(`    ${sp.num} ${sp.content}`));
        });
      });
    } else if (doc.body) {
      parts.push(`\nPontos resolutivos:`);
      doc.body.items.forEach(p => parts.push(`${p.num} ${p.content}`));
    }
    return parts.join('\n');
  }

  // ----- API call ---------------------------------------------------------

  async function callClaude(task, input, opts = {}) {
    const def = TASKS[task];
    if (!def) throw new Error(`Tarefa desconhecida: ${task}`);
    const apiKey = getApiKey();
    const system = def.system;
    const user = def.buildUser(input);

    if (!apiKey) {
      return _mockResponse(task, user);
    }

    const body = {
      model: opts.model || getModel(),
      max_tokens: opts.maxTokens || 1024,
      system,
      messages: [{ role: 'user', content: user }],
    };

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`API ${resp.status}: ${errText.slice(0, 200)}`);
    }
    const data = await resp.json();
    const text = (data.content || []).map(c => c.text || '').join('\n').trim();
    return text;
  }

  // ----- Mock responses (sem chave) --------------------------------------
  // Permite testar a UI / fluxo sem chave configurada.
  function _mockResponse(task, prompt) {
    const responses = {
      draftNote: `[Mock — configure a chave da API para resposta real]\n\nO presente diploma vem dar resposta a uma necessidade identificada no quadro de aplicação prática do regime em vigor, suprindo lacunas técnicas e clarificando obrigações dos sujeitos envolvidos.\n\nForam ponderadas alternativas, designadamente a manutenção do regime actual com orientações administrativas, tendo sido afastadas por insuficiência de estabilidade jurídica.\n\nO articulado proposto observa as exigências da legística e do princípio da legalidade, mantendo conformidade com a lei habilitante e com o direito da União Europeia aplicável.`,
      simplify: `[Mock] Versão simplificada do texto: ${prompt.slice(0, 80).replace(/\s+/g, ' ')}…`,
      detectAmbiguity: `[Mock — sem chave]\n1. "designadamente" — termo aberto; sugere lista exaustiva ou eliminação.\n2. Anafora não resolvida em "o mesmo" — substituir pelo referente.\n3. "em prazo razoável" — vaguidade; fixar prazo concreto.`,
      suggestHeading: `[Mock]\nObjeto\nÂmbito de aplicação\nDisposições gerais`,
      summarize: `[Mock — sem chave]\n- Cria o regime jurídico de X.\n- Define entidade responsável e procedimento.\n- Estabelece sanções e revoga regime anterior.\n- Entra em vigor 30 dias após publicação.`,
    };
    return Promise.resolve(responses[task] || `[Mock] Sem resposta canónica para ${task}.`);
  }

  // ---- Task registry exposto ---------------------------------------------
  function taskList() {
    return Object.entries(TASKS).map(([id, def]) => ({ id, label: def.label }));
  }

  return {
    setApiKey, getApiKey, setModel, getModel, isConfigured,
    callClaude, taskList,
  };
})();

if (typeof window !== "undefined") window.AI = AI;
