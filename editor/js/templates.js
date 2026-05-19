// AKN-PT Editor — Templates per act type
// EUPL-1.2

const ACT_TYPES = [
  {
    id: 'dec-lei', name: 'Decreto-Lei', subtitle: 'Governo (CM) · art. 198.º CRP',
    desc: 'Diploma legislativo do Governo, em Conselho de Ministros.',
    coverage: 'full',
    subtypes: [
      { value: 'dec-lei-ordinario', label: 'Ordinário (al. a) art. 198.º)' },
      { value: 'dec-lei-autorizado', label: 'Autorizado (al. b))' },
      { value: 'dec-lei-parlamentar', label: 'Parlamentar (al. c))' },
      { value: 'dec-lei-transposicao', label: 'Transposição (directiva UE)' },
      { value: 'dec-lei-alterador', label: 'Alterador (modifica outro diploma)' },
    ],
  },
  {
    id: 'lei', name: 'Lei', subtitle: 'AR · art. 161.º CRP',
    desc: 'Diploma legislativo da Assembleia da República.',
    coverage: 'full',
    subtypes: [
      { value: 'lei-comum', label: 'Comum (al. c) art. 161.º)' },
      { value: 'lei-organica', label: 'Orgânica (n.º 2 art. 166.º)' },
      { value: 'lei-de-bases', label: 'De bases' },
      { value: 'lei-autorizacao', label: 'De autorização legislativa' },
      { value: 'lei-de-revisao', label: 'De revisão constitucional' },
    ],
  },
  {
    id: 'portaria', name: 'Portaria', subtitle: 'Ministro(s) · lei habilitante específica',
    desc: 'Regulamento ministerial, com lei habilitante obrigatória.',
    coverage: 'full',
    subtypes: [
      { value: 'portaria-regulamentar', label: 'Regulamentar' },
      { value: 'portaria-execucao', label: 'De execução' },
      { value: 'portaria-extensao', label: 'De extensão de CCT' },
    ],
  },
  {
    id: 'res-cm', name: 'Resolução do CM', subtitle: 'CM · art. 200.º CRP',
    desc: 'Resolução do Conselho de Ministros. Pontos resolutivos, sem articulado.',
    coverage: 'full',
    subtypes: [
      { value: 'res-cm-normativa', label: 'Normativa' },
      { value: 'res-cm-politica', label: 'Política' },
      { value: 'res-cm-administrativa', label: 'Administrativa' },
    ],
  },
  {
    id: 'decreto-ar', name: 'Decreto da AR', subtitle: 'AR · art. 166.º n.º 5 CRP',
    desc: 'Aprovação parlamentar de tratado internacional ou matéria análoga.',
    coverage: 'skeleton',
    subtypes: [
      { value: 'decreto-ar-tratado', label: 'Tratado / convenção' },
      { value: 'decreto-ar-mandato', label: 'Mandato presidencial' },
      { value: 'decreto-ar-outros', label: 'Outros' },
    ],
  },
  {
    id: 'res-ar', name: 'Resolução da AR', subtitle: 'AR · art. 166.º n.º 5 CRP',
    desc: 'Resolução parlamentar. Estrutura tipo RCM (sem articulado).',
    coverage: 'skeleton',
    subtypes: [
      { value: 'res-ar-recomendacao', label: 'Recomendação ao Governo' },
      { value: 'res-ar-aprovacao', label: 'Aprovação de documento' },
      { value: 'res-ar-politica', label: 'Política' },
      { value: 'res-ar-cessacao-vigencia', label: 'Cessação de vigência (art. 169.º)' },
    ],
  },
  {
    id: 'despacho-normativo', name: 'Despacho normativo', subtitle: 'Ministro(s) · lei habilitante',
    desc: 'Despacho normativo ministerial. Estrutura semelhante a portaria.',
    coverage: 'skeleton',
    subtypes: [
      { value: 'despacho-normativo', label: 'Normativo' },
      { value: 'despacho-conjunto', label: 'Conjunto (vários ministros)' },
    ],
  },
  {
    id: 'dlr', name: 'Decreto Legislativo Regional', subtitle: 'ALR Açores ou Madeira · arts. 227.º/232.º',
    desc: 'Diploma legislativo regional. Assinado pelo Representante da República.',
    coverage: 'skeleton',
    subtypes: [
      { value: 'dlr-ordinario', label: 'Ordinário' },
      { value: 'dlr-autorizado', label: 'Autorizado' },
    ],
    regional: true,
  },
  {
    id: 'drr', name: 'Decreto Regulamentar Regional', subtitle: 'Governo Regional · art. 227.º al. d)',
    desc: 'Regulamento do Governo Regional. Lei habilitante obrigatória.',
    coverage: 'skeleton',
    subtypes: [
      { value: 'drr-execucao', label: 'De execução' },
      { value: 'drr-regulamentar', label: 'Regulamentar' },
    ],
    regional: true,
  },
];

// Fórmulas promulgatórias canónicas
const FORMULAS = {
  'dec-lei-ordinario': 'Assim: Nos termos da alínea a) do n.º 1 do artigo 198.º da Constituição, o Governo decreta o seguinte:',
  'dec-lei-autorizado': 'Assim: No uso da autorização legislativa concedida pela Lei n.º …/…, de … de …, e nos termos da alínea b) do n.º 1 do artigo 198.º da Constituição, o Governo decreta o seguinte:',
  'dec-lei-parlamentar': 'Assim: Nos termos das alíneas a) e c) do n.º 1 do artigo 198.º da Constituição, o Governo decreta o seguinte:',
  'dec-lei-transposicao': 'Assim: Nos termos da alínea a) do n.º 1 do artigo 198.º da Constituição, o Governo decreta o seguinte:',
  'dec-lei-alterador': 'Assim: Nos termos da alínea a) do n.º 1 do artigo 198.º da Constituição, o Governo decreta o seguinte:',
  'lei-comum': 'A Assembleia da República decreta, nos termos da alínea c) do artigo 161.º da Constituição, o seguinte:',
  'lei-organica': 'A Assembleia da República decreta, nos termos do n.º 2 do artigo 166.º e da alínea c) do artigo 161.º da Constituição, o seguinte:',
  'lei-de-bases': 'A Assembleia da República decreta, nos termos da alínea c) do artigo 161.º da Constituição, o seguinte:',
  'lei-autorizacao': 'A Assembleia da República decreta, nos termos das alíneas c) e d) do artigo 161.º da Constituição, o seguinte:',
  'lei-de-revisao': 'A Assembleia da República, nos termos do artigo 286.º da Constituição, aprova a seguinte lei de revisão constitucional:',
  'decreto-ar-tratado': 'A Assembleia da República resolve, nos termos do n.º 5 do artigo 166.º da Constituição, aprovar a Convenção …, cujo texto … se publica em anexo.',
  'decreto-ar-mandato': 'A Assembleia da República resolve, nos termos do n.º 5 do artigo 166.º da Constituição, …',
  'decreto-ar-outros': 'A Assembleia da República resolve, nos termos do n.º 5 do artigo 166.º da Constituição, …',
  'res-ar-recomendacao': 'A Assembleia da República resolve, nos termos do n.º 5 do artigo 166.º da Constituição, recomendar ao Governo …',
  'res-ar-aprovacao': 'A Assembleia da República resolve, nos termos do n.º 5 do artigo 166.º da Constituição, aprovar …',
  'res-ar-politica': 'A Assembleia da República resolve, nos termos do n.º 5 do artigo 166.º da Constituição, …',
  'res-ar-cessacao-vigencia': 'A Assembleia da República resolve, nos termos do n.º 5 do artigo 166.º da Constituição, fazer cessar a vigência do Decreto-Lei n.º …/…, de … de …',
  'portaria-regulamentar': 'Manda o Governo, pelo Ministro de …, ao abrigo do disposto no … do … do Decreto-Lei n.º …/…, de … de …, o seguinte:',
  'portaria-execucao': 'Manda o Governo, pelo Ministro de …, ao abrigo do disposto no … do … do Decreto-Lei n.º …/…, de … de …, o seguinte:',
  'portaria-extensao': 'Manda o Governo, pelo Ministro do Trabalho, Solidariedade e Segurança Social, ao abrigo do disposto no artigo 514.º do Código do Trabalho, o seguinte:',
  'res-cm-normativa': '',  // RCM tipicamente sem fórmula
  'res-cm-politica': '',
  'res-cm-administrativa': '',
  'despacho-normativo': 'Manda o Governo, pelo Ministro de …, ao abrigo do disposto no … do … do Decreto-Lei n.º …/…, de … de …, o seguinte:',
  'despacho-conjunto': 'Mandam os Ministros de … e de …, ao abrigo do disposto no … do … do Decreto-Lei n.º …/…, de … de …, o seguinte:',
  'dlr-ordinario': 'A Assembleia Legislativa da Região Autónoma dos Açores decreta, nos termos da alínea a) do n.º 1 do artigo 227.º e do n.º 1 do artigo 232.º da Constituição da República Portuguesa, e da alínea c) do n.º 1 do artigo 31.º do Estatuto Político-Administrativo da Região Autónoma dos Açores, o seguinte:',
  'dlr-autorizado': 'A Assembleia Legislativa da Região Autónoma dos Açores decreta, no uso da autorização legislativa concedida pela Lei n.º …/…, de … de …, e nos termos da alínea b) do n.º 1 do artigo 227.º e do n.º 1 do artigo 232.º da Constituição, o seguinte:',
  'drr-execucao': 'O Governo Regional dos Açores, ao abrigo do disposto na alínea d) do n.º 1 do artigo 227.º da Constituição da República Portuguesa, decreta o seguinte:',
  'drr-regulamentar': 'O Governo Regional dos Açores, ao abrigo do disposto na alínea d) do n.º 1 do artigo 227.º da Constituição da República Portuguesa, decreta o seguinte:',
};

// Workflow step types (pegada legislativa)
const STEP_TYPES = [
  { value: 'iniciativa', label: 'Iniciativa' },
  { value: 'anteprojeto', label: 'Anteprojecto' },
  { value: 'consulta-publica', label: 'Consulta pública' },
  { value: 'consulta-aberta', label: 'Consulta aberta (informal)' },
  { value: 'consultas-obrigatorias', label: 'Consultas obrigatórias' },
  { value: 'discussao-na-generalidade', label: 'Discussão na generalidade' },
  { value: 'discussao-na-especialidade', label: 'Discussão na especialidade' },
  { value: 'audicao-publica', label: 'Audição pública' },
  { value: 'votacao-final-global', label: 'Votação final global' },
  { value: 'aprovacao-cm', label: 'Aprovação em CM' },
  { value: 'aprovacao-ar', label: 'Aprovação em plenário AR' },
  { value: 'promulgacao', label: 'Promulgação' },
  { value: 'assinatura', label: 'Assinatura ministerial' },
  { value: 'publicacao', label: 'Publicação no DR' },
];

const INPUT_TYPES = [
  { value: 'parecer-tecnico', label: 'Parecer técnico' },
  { value: 'parecer-juridico', label: 'Parecer jurídico' },
  { value: 'parecer-obrigatorio', label: 'Parecer obrigatório (por lei)' },
  { value: 'parecer-facultativo', label: 'Parecer facultativo' },
  { value: 'contributo-consulta-publica', label: 'Contributo (consulta pública)' },
  { value: 'contributo-consulta-aberta', label: 'Contributo (consulta aberta)' },
  { value: 'contributo-audicao', label: 'Contributo (audição parlamentar)' },
  { value: 'proposta-de-alteracao', label: 'Proposta de alteração' },
  { value: 'proposta-de-aditamento', label: 'Proposta de aditamento' },
  { value: 'proposta-de-eliminacao', label: 'Proposta de eliminação' },
  { value: 'representacao-interesse', label: 'Representação de interesse (lobby)' },
  { value: 'parecer-tribunal-de-contas', label: 'Parecer do Tribunal de Contas' },
  { value: 'parecer-conselho-economico-social', label: 'Parecer do CES' },
];

// Signature roles by act type
const SIGNATURE_ROLES = {
  'dec-lei': [
    { role: 'countersignature', as: 'primeiro-ministro', label: 'Primeiro-Ministro (referenda)' },
    { role: 'promulgation', as: 'presidente-republica', label: 'Presidente da República (promulgação)' },
    { role: 'countersignature', as: 'ministro', label: 'Ministro competente (referenda)' },
  ],
  'lei': [
    { role: 'signature', as: 'presidente-ar', label: 'Presidente da AR' },
    { role: 'promulgation', as: 'presidente-republica', label: 'Presidente da República (promulgação)' },
    { role: 'countersignature', as: 'primeiro-ministro', label: 'Primeiro-Ministro (referenda)' },
  ],
  'decreto-ar': [
    { role: 'signature', as: 'presidente-ar', label: 'Presidente da AR' },
    { role: 'promulgation', as: 'presidente-republica', label: 'Presidente da República' },
  ],
  'res-ar': [
    { role: 'signature', as: 'presidente-ar', label: 'Presidente da AR' },
  ],
  'portaria': [
    { role: 'signature', as: 'ministro', label: 'Ministro competente' },
  ],
  'res-cm': [
    { role: 'signature', as: 'primeiro-ministro', label: 'Primeiro-Ministro' },
  ],
  'despacho-normativo': [
    { role: 'signature', as: 'ministro', label: 'Ministro competente' },
  ],
  'dlr': [
    { role: 'signature', as: 'presidente-alra', label: 'Presidente da ALR' },
    { role: 'promulgation', as: 'representante-republica-acores', label: 'Representante da República' },
  ],
  'drr': [
    { role: 'signature', as: 'presidente-governo-regional-acores', label: 'Presidente do Governo Regional' },
    { role: 'promulgation', as: 'representante-republica-acores', label: 'Representante da República' },
  ],
};

// Pre-filled rich templates — realistic legística for each act type.
// User overrides placeholders.
const RICH_TEMPLATES = {
  'dec-lei': {
    recitals: [
      'Considerando que o … constitui prioridade da política pública de …, importa estabelecer o regime jurídico aplicável a … .',
      'Foram ouvidos os órgãos representativos pertinentes, designadamente … .',
    ],
    shortTitle: 'Estabelece o regime jurídico aplicável a … .',
    articles: [
      { num: 'Artigo 1.º', heading: 'Objeto',
        content: 'O presente decreto-lei estabelece o regime jurídico aplicável a … .' },
      { num: 'Artigo 2.º', heading: 'Definições',
        intro: 'Para efeitos do presente decreto-lei, entende-se por:',
        points: [
          { letter: 'a', content: '«…», … ;' },
          { letter: 'b', content: '«…», … .' },
        ],
      },
      { num: 'Artigo 3.º', heading: 'Âmbito de aplicação',
        content: 'O presente decreto-lei aplica-se a … .' },
      { num: 'Artigo 4.º', heading: 'Entrada em vigor',
        content: 'O presente decreto-lei entra em vigor no dia seguinte ao da sua publicação.' },
    ],
  },
  'lei': {
    recitals: [],   // Lei AR tipicamente tem preâmbulo vazio
    shortTitle: 'Estabelece o regime de … .',
    articles: [
      { num: 'Artigo 1.º', heading: 'Objeto',
        content: 'A presente lei estabelece o regime de … .' },
      { num: 'Artigo 2.º', heading: 'Âmbito',
        content: 'A presente lei aplica-se a … .' },
      { num: 'Artigo 3.º', heading: 'Entrada em vigor',
        content: 'A presente lei entra em vigor 30 dias após a sua publicação.' },
    ],
  },
  'portaria': {
    recitals: [
      // Recital habilitante (ref injectado em runtime via campo habilitante)
      'O Decreto-Lei n.º …/…, de … de …, atribuiu ao membro do Governo responsável pela área de … a regulamentação operacional do regime nele previsto.',
      'Importa, por isso, fixar as condições de acesso, o procedimento e os requisitos aplicáveis, bem como o modelo de declaração a apresentar pelos interessados.',
    ],
    shortTitle: 'Regulamenta … .',
    articles: [
      { num: 'Artigo 1.º', heading: 'Objeto',
        content: 'A presente portaria regulamenta o disposto no artigo …º do Decreto-Lei n.º …/…, de … de …, fixando os requisitos e o procedimento aplicáveis.' },
      { num: 'Artigo 2.º', heading: 'Beneficiários',
        intro: 'Podem aceder aos termos previstos na presente portaria as entidades que, cumulativamente:',
        points: [
          { letter: 'a', content: 'Cumpram os requisitos … ;' },
          { letter: 'b', content: 'Tenham a situação tributária e contributiva regularizada;' },
          { letter: 'c', content: 'Não tenham incumprimentos pendentes junto da Administração Pública.' },
        ],
      },
      { num: 'Artigo 3.º', heading: 'Candidatura',
        content: 'A candidatura é apresentada através de formulário disponibilizado no portal …, instruída com a declaração constante do anexo à presente portaria.' },
      { num: 'Artigo 4.º', heading: 'Entrada em vigor',
        content: 'A presente portaria entra em vigor no dia seguinte ao da sua publicação.' },
    ],
    attachments: [
      {
        heading: 'Anexo',
        subheading: 'Modelo de declaração',
        content: 'Denominação social: ____________________________________________\nNIPC: __________________________________________________________\nSede: __________________________________________________________\nDeclaração sob compromisso de honra: o requerente declara cumprir todos os requisitos previstos no artigo 2.º da presente portaria.\n\nData e assinatura do representante legal: _________________________',
      },
    ],
    // Placeholder habilitante — user fills with real URI in meta tab
    habilitante: '',
    habilitanteLabel: '',
  },
  'res-cm': {
    recitals: [
      'Considerando que o … constitui prioridade estratégica nacional e que importa aprovar o … que enquadre a actuação dos serviços e organismos competentes.',
    ],
    shortTitle: 'Aprova o … .',
    paragraphs: [
      { num: '1 -', content: 'Aprovar o …, constante do anexo à presente resolução e que dela faz parte integrante.' },
      { num: '2 -', intro: 'Determinar que:', points: [
        { letter: 'a', content: 'A coordenação da execução compete a … ;' },
        { letter: 'b', content: 'A monitorização e avaliação são realizadas anualmente.' },
      ] },
      { num: '3 -', content: 'Encarregar os membros do Governo responsáveis pelas áreas de … de promover, no âmbito das respectivas competências, a execução do disposto na presente resolução.' },
      { num: '4 -', content: 'A presente resolução produz efeitos no dia seguinte ao da sua publicação.' },
    ],
    attachments: [
      { heading: 'Anexo', subheading: '…',
        content: '[Conteúdo substantivo do plano/estratégia/programa aprovado pela presente resolução.]' },
    ],
  },
  'decreto-ar': {
    recitals: [],
    shortTitle: 'Aprova a … .',
    articles: [
      { num: 'Artigo 1.º', heading: 'Aprovação',
        content: 'É aprovada a …, cujo texto, na versão autenticada em língua portuguesa, consta do anexo ao presente decreto.' },
    ],
    attachments: [
      { heading: 'Anexo', subheading: 'Texto da …',
        content: '[Texto integral da convenção/tratado/acordo.]' },
    ],
  },
  'res-ar': {
    recitals: [],
    shortTitle: 'Recomenda ao Governo … .',
    paragraphs: [
      { num: '1 -', content: 'Recomendar ao Governo a adopção de … .' },
    ],
  },
  'despacho-normativo': {
    recitals: [
      'O Decreto-Lei n.º …/…, de … de …, atribuiu ao membro do Governo responsável pela área de … a regulamentação de … .',
    ],
    shortTitle: 'Regulamenta … .',
    articles: [
      { num: 'Artigo 1.º', heading: 'Objeto',
        content: 'O presente despacho regulamenta … .' },
      { num: 'Artigo 2.º', heading: 'Procedimento',
        content: 'O procedimento aplicável é o constante do disposto no presente despacho.' },
      { num: 'Artigo 3.º', heading: 'Entrada em vigor',
        content: 'O presente despacho entra em vigor no dia seguinte ao da sua publicação.' },
    ],
  },
  'dlr': {
    recitals: [],
    shortTitle: 'Estabelece … no âmbito da Região Autónoma … .',
    articles: [
      { num: 'Artigo 1.º', heading: 'Objeto',
        content: 'O presente diploma estabelece … no âmbito da Região Autónoma … .' },
      { num: 'Artigo 2.º', heading: 'Entrada em vigor',
        content: 'O presente diploma entra em vigor no dia seguinte ao da sua publicação.' },
    ],
  },
  'drr': {
    recitals: [
      'O Decreto Legislativo Regional n.º …/…, de … de …, estabelece … .',
    ],
    shortTitle: 'Regulamenta … no âmbito da Região Autónoma … .',
    articles: [
      { num: 'Artigo 1.º', heading: 'Objeto',
        content: 'O presente diploma regulamenta … .' },
      { num: 'Artigo 2.º', heading: 'Entrada em vigor',
        content: 'O presente diploma entra em vigor no dia seguinte ao da sua publicação.' },
    ],
  },
};

// Returns a fresh document instance for a given act type, pre-populated
// with realistic legística placeholders.
function newDocument(actType) {
  const type = ACT_TYPES.find(t => t.id === actType);
  const today = new Date().toISOString().slice(0, 10);
  const subtype = type.subtypes[0].value;
  const rich = RICH_TEMPLATES[actType] || {};

  // Build recitals
  const recitals = (rich.recitals || ['Considerando que …']).map((text, i) => ({
    id: `rec_${i + 1}`, text,
  }));

  // Build body
  let body;
  if (['res-cm', 'res-ar'].includes(actType)) {
    const paras = (rich.paragraphs || [{ num: '1 -', content: '…' }]).map((p, i) => {
      const n = i + 1;
      const out = { id: `para_${n}`, num: p.num, content: p.content || p.intro || '', subPoints: [] };
      if (p.points) {
        out.subPoints = p.points.map(pt => ({
          id: `${out.id}__lit_${pt.letter}`, num: `${pt.letter})`, content: pt.content,
        }));
      }
      return out;
    });
    body = { kind: 'paragraphs', items: paras };
  } else {
    const arts = (rich.articles || [{ num: 'Artigo 1.º', heading: 'Objeto', content: '' }]).map((a, i) => {
      const aid = a.num.match(/(\d+(?:-[A-Z])?)/) ? `art_${(a.num.match(/(\d+)/) || ['', '1'])[1]}` : `art_${i + 1}`;
      const para = { id: `${aid}__para_1`, num: '', content: a.content || a.intro || '', subPoints: [] };
      if (a.points) {
        para.subPoints = a.points.map(pt => ({
          id: `${para.id}__lit_${pt.letter}`, num: `${pt.letter})`, content: pt.content,
        }));
      }
      return { id: aid, num: a.num, heading: a.heading, paragraphs: [para] };
    });
    body = { kind: 'articles', items: arts };
  }

  // Attachments
  const attachments = (rich.attachments || []).map((a, i) => ({
    id: `anx_${i + 1}`, heading: a.heading, subheading: a.subheading || '', content: a.content || '',
  }));

  // Bookkeeping starts after pre-filled items
  const lastArt = body.kind === 'articles'
    ? body.items.reduce((m, a) => Math.max(m, parseInt((a.num.match(/(\d+)/) || ['', '0'])[1], 10)), 0)
    : 0;

  return {
    actName: actType,
    subtype,
    number: '',
    year: new Date().getFullYear(),
    country: type.regional ? 'pt-20' : 'pt',
    shortTitle: rich.shortTitle || '',
    adoptionDate: today,
    publicationDate: today,
    docDate: today,
    docDateText: '',
    recitals,
    formula: FORMULAS[subtype] || '',
    body,
    signatures: (SIGNATURE_ROLES[actType] || []).map(s => ({
      role: s.role, as: s.as, name: '', date: today,
    })),
    attachments,
    workflow: [],
    habilitante: rich.habilitante || '',
    habilitanteLabel: rich.habilitanteLabel || '',
    nextArticleNum: lastArt + 1,
    nextParaNum: body.kind === 'paragraphs' ? body.items.length + 1 : 1,
    nextRecitalNum: recitals.length + 1,
    nextAttachmentNum: attachments.length + 1,
  };
}
