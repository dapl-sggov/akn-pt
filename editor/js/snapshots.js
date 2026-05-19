// AKN-PT Editor — versionamento (snapshots)
// EUPL-1.2
//
// Snapshots são fotografias nomeadas do documento, guardadas em localStorage.
// Cada snapshot tem id, label (autor escolhe), date, e cópia profunda do doc.
//
// API:
//   Snapshots.list()                      → [{id, label, date, summary}]
//   Snapshots.save(label, [note])         → snapshot
//   Snapshots.load(id)                    → doc state (caller decide se aplica)
//   Snapshots.delete(id)
//   Snapshots.get(id)
//   Snapshots.clear()
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

  function save(label, note) {
    const doc = State.get();
    if (!doc) throw new Error('Sem documento activo.');
    const id = 'snap_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 5);
    const date = new Date().toISOString();
    const entry = { id, label: label || `Snapshot ${new Date().toLocaleString('pt-PT')}`, date, summary: _summarize(doc), note: note || '' };
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

  return { list, save, get, load, delete: del, clear, autoSnapshot };
})();

if (typeof window !== "undefined") window.Snapshots = Snapshots;
