// AKN-PT Editor — colaboração leve (cross-tab + share via URL)
// EUPL-1.2
//
// Sem servidor. Dois mecanismos:
//
//   1. CROSS-TAB SYNC (BroadcastChannel)
//      Quando o utilizador abre o editor em duas tabs do mesmo browser, ambas
//      ficam sincronizadas — alterações numa propagam-se à outra. Usa o
//      BroadcastChannel API (suportado em todos os browsers modernos).
//      Mostra um pequeno indicador "● live (2)" na topbar quando >1 tab está
//      activa.
//
//   2. SHARE VIA URL (compressão + hash)
//      O doc é serializado, comprimido com a CompressionStream API (gzip) e
//      colocado no fragmento da URL (#share=...). Ao abrir esse URL, o doc é
//      carregado automaticamente.
//      Limitação: URLs muito longas (> ~30 KB no Chrome) podem não funcionar.
//      Para diplomas grandes o utilizador tem de usar export XML em vez disto.
//
// Privacidade: tudo permanece local. BroadcastChannel só funciona entre tabs
// do mesmo browser/origin; o share por URL pode ser enviado para terceiros
// mas é o próprio utilizador a partilhá-lo (não há servidor que registe).

const Collab = (() => {
  const CHANNEL = 'akn-pt-editor';
  let bc = null;
  let listeners = new Set();
  let peers = 0;
  let selfId = `tab_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;
  let knownPeers = new Set();
  let lastBroadcastHash = '';
  let suppressNext = false;

  function init(onUpdate) {
    if (typeof BroadcastChannel === 'undefined') return false;
    if (bc) return true;  // já iniciado
    bc = new BroadcastChannel(CHANNEL);
    if (onUpdate) listeners.add(onUpdate);

    bc.onmessage = (ev) => {
      const msg = ev.data;
      if (!msg || msg.from === selfId) return;
      if (msg.type === 'hello') {
        knownPeers.add(msg.from);
        peers = knownPeers.size;
        // responder com o nosso estado actual para o novo
        bc.postMessage({ type: 'present', from: selfId });
        _emitPeers();
      } else if (msg.type === 'present') {
        knownPeers.add(msg.from);
        peers = knownPeers.size;
        _emitPeers();
      } else if (msg.type === 'bye') {
        knownPeers.delete(msg.from);
        peers = knownPeers.size;
        _emitPeers();
      } else if (msg.type === 'update' && msg.docHash !== lastBroadcastHash) {
        // suppressNext evita loop
        suppressNext = true;
        listeners.forEach(l => l(msg.doc));
      }
    };

    bc.postMessage({ type: 'hello', from: selfId });

    window.addEventListener('beforeunload', () => {
      try { bc.postMessage({ type: 'bye', from: selfId }); } catch {}
    });
    return true;
  }

  function broadcast(doc) {
    if (!bc) return;
    if (suppressNext) { suppressNext = false; return; }
    const docHash = _hash(JSON.stringify(doc));
    if (docHash === lastBroadcastHash) return;
    lastBroadcastHash = docHash;
    try { bc.postMessage({ type: 'update', from: selfId, doc, docHash }); } catch {}
  }

  function peerCount() { return peers; }
  function onPeersChange(fn) { peerListeners.add(fn); }
  const peerListeners = new Set();
  function _emitPeers() { peerListeners.forEach(f => f(peers)); }

  function _hash(s) {
    let h = 0; for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
    return String(h);
  }

  // ---- Share via URL ----------------------------------------------------

  // Codifica doc → base64url (sem compressão; gzip nativo no browser exige
  // async streams, mantém-se simples). Para docs grandes, devolve null.
  async function makeShareUrl(doc) {
    const json = JSON.stringify(doc);
    let b64;
    try {
      // tentar gzip + base64 (mais curto)
      const compressed = await _gzip(json);
      b64 = _bytesToB64Url(compressed);
    } catch {
      // fallback: só base64
      b64 = btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    const url = `${location.origin}${location.pathname}#share=${b64}`;
    if (url.length > 32000) return null;  // navegadores rejeitam URLs muito longas
    return url;
  }

  async function loadShareFromHash() {
    const m = (location.hash || '').match(/[#&]share=([^&]+)/);
    if (!m) return null;
    const b64 = m[1].replace(/-/g, '+').replace(/_/g, '/');
    try {
      // tentar descomprimir primeiro
      const bytes = _b64ToBytes(b64 + '='.repeat((4 - b64.length % 4) % 4));
      try {
        const text = await _gunzip(bytes);
        return JSON.parse(text);
      } catch {
        // se falhar, base64 puro
        const text = decodeURIComponent(escape(atob(b64 + '='.repeat((4 - b64.length % 4) % 4))));
        return JSON.parse(text);
      }
    } catch (e) {
      return null;
    }
  }

  async function _gzip(text) {
    const cs = new CompressionStream('gzip');
    const writer = cs.writable.getWriter();
    writer.write(new TextEncoder().encode(text));
    writer.close();
    const buf = await new Response(cs.readable).arrayBuffer();
    return new Uint8Array(buf);
  }
  async function _gunzip(bytes) {
    const ds = new DecompressionStream('gzip');
    const writer = ds.writable.getWriter();
    writer.write(bytes);
    writer.close();
    const buf = await new Response(ds.readable).arrayBuffer();
    return new TextDecoder().decode(buf);
  }

  function _bytesToB64Url(bytes) {
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function _b64ToBytes(b64) {
    const s = atob(b64);
    const bytes = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
    return bytes;
  }

  return { init, broadcast, peerCount, onPeersChange, makeShareUrl, loadShareFromHash };
})();

if (typeof window !== 'undefined') window.Collab = Collab;
