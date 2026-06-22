// AKN-PT Editor — versionamento (snapshots / milestones)
// EUPL-1.2
//
// Snapshots são fotografias nomeadas do documento, guardadas em localStorage.
// Cada snapshot tem id, label, date, summary, e — opcionalmente — uma `phase`
// do procedimento legislativo (rascunho, consulta-pública, CM-aprovacao,
// promulgação, publicação-DR, etc.). Quando há `phase`, o snapshot é tratado
// como "milestone" (cf. LEOS).
//
// API:
//   Snapshots.list()                          → [{id, label, date, summary, phase?, note?}]
//   Snapshots.save(label, opts)               → snapshot   (opts: {note, phase, relatedTo})
//                                               (compat: 2.º arg pode ser string ⇒ note)
//   Snapshots.load(id)                        → doc state (caller decide se aplica)
//   Snapshots.delete(id)
//   Snapshots.get(id)
//   Snapshots.clear()
//   Snapshots.listByPhase()                   → Map<phase, [entries]>
//   Snapshots.getPhasesForActType(actName)    → ['rascunho', 'consulta-pública', ...]
//
// O conteúdo completo do snapshot fica em chaves separadas
// (`akn-pt-snapshot-v1:{id}`) para não inchar a chave de listagem.

const Snapshots = (() => {
  const LIST_KEY = 'akn-pt-snapshots-v1';
  const PREFIX = 'akn-pt-snapshot-v1:';

  function _readList() {
    try { return JSON.parse(localStorage.getItem(LIST_KEY) || '[]'); }
    catch { return []; }
  }
  function _writeList(arr) {
    try { localStorage.setItem(LIST_KEY, JSON.stringify(arr)); } catch (e) {}
  }

  function _summarize(doc) {
    if (!doc) return '';
    const parts = [];
    if (doc.actName) parts.push(doc.actName);
    if (doc.number) parts.push(`n.º ${doc.number}/${doc.year}`);
    if (doc.body) {
      const n = doc.body.items ? doc.body.items.length : 0;
      parts.push(doc.body.kind === 'articles' ? `${n} artigo(s)` : `${n} ponto(s)`);
    }
    return parts.join(' · ');
  }

  function list() {
    return _readList().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }

  function save(label, opts) {
    const doc = State.get();
    if (!doc) throw new Error('Sem documento activo.');
    // Compat: se opts for string, é tratado como note (assinatura antiga).
    if (typeof opts === 'string') opts = { note: opts };
    opts = opts || {};
    const id = 'snap_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 5);
    const date = new Date().toISOString();
    const entry = {
      id,
      label: label || `Snapshot ${new Date().toLocaleString('pt-PT')}`,
      date,
      summary: _summarize(doc),
      note: opts.note || '',
    };
    if (opts.phase) entry.phase = opts.phase;
    if (opts.relatedTo) entry.relatedTo = opts.relatedTo;
    const arr = _readList();
    arr.push(entry);
    _writeList(arr);
    try {
      localStorage.setItem(PREFIX + id, JSON.stringify(doc));
    } catch (e) {
      // remove from list if storage failed
      _writeList(arr.filter(x => x.id !== id));
      throw new Error('localStorage cheio — apague snapshots antigos.');
    }
    return entry;
  }

  function get(id) {
    try { return JSON.parse(localStorage.getItem(PREFIX + id) || 'null'); }
    catch { return null; }
  }

  function load(id) { return get(id); }

  function del(id) {
    _writeList(_readList().filter(x => x.id !== id));
    localStorage.removeItem(PREFIX + id);
  }

  function clear() {
    _readList().forEach(s => localStorage.removeItem(PREFIX + s.id));
    localStorage.removeItem(LIST_KEY);
  }

  // Agrupa snapshots por fase do procedimento. Entries sem `phase` ficam
  // no balde 'sem-fase'. Map preserva ordem de inserção, mas dentro de cada
  // balde os entries vêm ordenados cronologicamente (asc — primeiro o mais
  // antigo, para mostrar progressão).
  function listByPhase() {
    const all = _readList().slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const map = new Map();
    all.forEach(s => {
      const phase = s.phase || 'sem-fase';
      if (!map.has(phase)) map.set(phase, []);
      map.get(phase).push(s);
    });
    return map;
  }

  // Vocabulário de fases por tipo de acto. Para já: tabela estática.
  // O `actName` é o slug do tipo (cf. ACT_TYPES em templates.js).
  const PHASES = {
    common: ['rascunho'],
    'dec-lei': ['rascunho', 'consulta-pública', 'CM-aprovação', 'promulgação', 'publicação-DR', 'rectificação'],
    'lei': ['rascunho', 'aprovação-plenário', 'votação-final-global', 'promulgação', 'publicação-DR', 'rectificação'],
    'portaria': ['rascunho', 'consulta-pública', 'assinatura-ministerial', 'publicação-DR', 'rectificação'],
    'res-cm': ['rascunho', 'consulta-pública', 'CM-aprovação', 'publicação-DR'],
    'res-ar': ['rascunho', 'aprovação-plenário', 'publicação-DR'],
    'decreto-ar': ['rascunho', 'aprovação-plenário', 'votação-final-global', 'promulgação', 'publicação-DR'],
    'despacho-normativo': ['rascunho', 'assinatura-ministerial', 'publicação-DR'],
    'dlr': ['rascunho', 'aprovação-ALR', 'assinatura-RR', 'publicação-DR'],
    'drr': ['rascunho', 'aprovação-governo-regional', 'assinatura-RR', 'publicação-DR'],
  };

  function getPhasesForActType(actName) {
    if (!actName) return PHASES.common;
    // tenta match directo; depois prefixo (e.g. 'dlr-acores' ⇒ 'dlr').
    if (PHASES[actName]) return PHASES[actName];
    const prefix = actName.split('-')[0];
    if (PHASES[prefix]) return PHASES[prefix];
    return PHASES.common;
  }

  // Auto-snapshot: chamado quando o utilizador faz uma operação significativa
  // (exportar XML, criar diploma novo, etc.). Mantém-se um máximo de N
  // auto-snapshots; o mais antigo é descartado quando se ultrapassa.
  function autoSnapshot(label) {
    const MAX_AUTO = 5;
    const all = _readList();
    const autos = all.filter(s => s.auto).sort((a, b) => a.date.localeCompare(b.date));
    while (autos.length >= MAX_AUTO) {
      const old = autos.shift();
      del(old.id);
    }
    const entry = save(label || 'auto-snapshot');
    // marcar como auto
    const arr = _readList();
    const e = arr.find(x => x.id === entry.id);
    if (e) { e.auto = true; _writeList(arr); }
    return entry;
  }

  return { list, save, get, load, delete: del, clear, autoSnapshot, listByPhase, getPhasesForActType };
})();

if (typeof window !== "undefined") window.Snapshots = Snapshots;
