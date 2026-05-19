// AKN-PT Editor — Cmd-K command palette
// EUPL-1.2
//
// Sobrepõe ao editor uma palette pesquisável que dispara qualquer acção
// secundária (snapshots, importar, partilhar, IA, etc.). Substitui o
// overflow menu (⋯) da topbar antiga.
//
// API:
//   CmdK.init(actions)   actions = [{id, label, group, hint, fn, when}]
//   CmdK.open()
//   CmdK.close()
//   CmdK.toggle()
//
// Atalho global: Ctrl/Cmd + K abre/fecha.

const CmdK = (() => {
  let _actions = [];
  let _isOpen = false;
  let _overlay = null;
  let _input = null;
  let _list = null;
  let _highlightedIdx = 0;
  let _visible = [];

  function init(actions) {
    _actions = actions || [];
    _buildDom();
    document.addEventListener('keydown', (ev) => {
      const isCmdK = (ev.ctrlKey || ev.metaKey) && (ev.key === 'k' || ev.key === 'K');
      if (isCmdK) {
        ev.preventDefault();
        toggle();
        return;
      }
      if (!_isOpen) return;
      if (ev.key === 'Escape') { ev.preventDefault(); close(); return; }
      if (ev.key === 'ArrowDown') { ev.preventDefault(); _move(1); return; }
      if (ev.key === 'ArrowUp') { ev.preventDefault(); _move(-1); return; }
      if (ev.key === 'Enter') { ev.preventDefault(); _runHighlighted(); return; }
    });
  }

  function _buildDom() {
    if (_overlay) return;
    _overlay = document.createElement('div');
    _overlay.id = 'cmdk-overlay';
    _overlay.className = 'cmdk-overlay hidden';
    _overlay.innerHTML = `
      <div class="cmdk-modal" role="dialog" aria-label="Acções">
        <div class="cmdk-input-wrap">
          <span class="cmdk-prefix">⌘K</span>
          <input id="cmdk-input" type="text" placeholder="Pesquisar acções, ir para artigo, importar…" autocomplete="off" spellcheck="false">
          <span class="cmdk-hint">ESC fecha</span>
        </div>
        <ul id="cmdk-list" class="cmdk-list" role="listbox"></ul>
        <div class="cmdk-footer">
          <span><kbd>↑↓</kbd> navegar</span>
          <span><kbd>↵</kbd> executar</span>
          <span><kbd>esc</kbd> fechar</span>
        </div>
      </div>
    `;
    document.body.appendChild(_overlay);
    _input = _overlay.querySelector('#cmdk-input');
    _list = _overlay.querySelector('#cmdk-list');
    _overlay.addEventListener('click', (ev) => {
      if (ev.target === _overlay) close();
    });
    _input.addEventListener('input', _render);
  }

  function _filter(q) {
    const doc = (typeof State !== 'undefined') ? State.get() : null;
    const eligible = _actions.filter(a => !a.when || a.when(doc));
    if (!q) return eligible;
    const ql = q.toLowerCase();
    return eligible.filter(a => {
      const hay = `${a.label} ${a.group || ''} ${a.hint || ''}`.toLowerCase();
      return ql.split(/\s+/).every(tok => hay.includes(tok));
    });
  }

  function _render() {
    if (!_isOpen) return;
    const q = _input.value.trim();
    _visible = _filter(q);
    _highlightedIdx = 0;
    if (!_visible.length) {
      _list.innerHTML = `<li class="cmdk-empty">Sem resultados para “${_escape(q)}”.</li>`;
      return;
    }
    // Agrupar por group
    const groups = new Map();
    _visible.forEach(a => {
      const g = a.group || 'Outros';
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push(a);
    });
    let idx = 0;
    let html = '';
    for (const [groupName, items] of groups) {
      html += `<li class="cmdk-group-head">${_escape(groupName)}</li>`;
      for (const a of items) {
        const active = idx === _highlightedIdx ? ' cmdk-active' : '';
        html += `<li class="cmdk-item${active}" data-idx="${idx}" role="option">
          <span class="cmdk-label">${_escape(a.label)}</span>
          ${a.hint ? `<span class="cmdk-item-hint">${_escape(a.hint)}</span>` : ''}
        </li>`;
        idx++;
      }
    }
    _list.innerHTML = html;
    _list.querySelectorAll('.cmdk-item').forEach(li => {
      li.addEventListener('click', () => {
        _highlightedIdx = parseInt(li.dataset.idx, 10);
        _runHighlighted();
      });
      li.addEventListener('mousemove', () => {
        _highlightedIdx = parseInt(li.dataset.idx, 10);
        _refreshActive();
      });
    });
  }

  function _refreshActive() {
    _list.querySelectorAll('.cmdk-item').forEach((li, i) => {
      li.classList.toggle('cmdk-active', parseInt(li.dataset.idx, 10) === _highlightedIdx);
    });
    const act = _list.querySelector('.cmdk-active');
    if (act) act.scrollIntoView({ block: 'nearest' });
  }

  function _move(delta) {
    if (!_visible.length) return;
    _highlightedIdx = (_highlightedIdx + delta + _visible.length) % _visible.length;
    _refreshActive();
  }

  function _runHighlighted() {
    const action = _visible[_highlightedIdx];
    if (!action) return;
    close();
    try { action.fn(); }
    catch (e) { console.error('CmdK action failed:', e); }
  }

  function _escape(s) {
    return String(s || '').replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
  }

  function open() {
    if (!_overlay) _buildDom();
    _isOpen = true;
    _overlay.classList.remove('hidden');
    _input.value = '';
    _render();
    setTimeout(() => _input.focus(), 0);
  }
  function close() {
    _isOpen = false;
    if (_overlay) _overlay.classList.add('hidden');
  }
  function toggle() { _isOpen ? close() : open(); }

  return { init, open, close, toggle };
})();

if (typeof window !== "undefined") window.CmdK = CmdK;
