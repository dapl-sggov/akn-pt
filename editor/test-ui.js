// AKN-PT Editor — testes de UI via jsdom (corre em CI + localmente)
// EUPL-1.2
//
// Verifica que o interface carrega sem erros JS, tem os componentes
// esperados, os menus funcionam (abrir/fechar/ESC/click-outside).
// Para correr: `npm install jsdom@24 && node editor/test-ui.js`

const fs = require('fs');
const path = require('path');

let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch (e) {
  console.error('jsdom não instalado. Corra: npm install jsdom@24');
  process.exit(1);
}

const ROOT = path.resolve(__dirname);
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost/' });
const { window } = dom;

const errors = [];
window.addEventListener('error', (e) => errors.push(e.message));
window.console = console;
window.confirm = () => true;
window.prompt = (msg, def) => def || 'TEST';
window.alert = () => {};

if (typeof window.BroadcastChannel === 'undefined') {
  window.BroadcastChannel = class { postMessage() {} close() {} };
}

const files = html.match(/src="js\/[^"]+"/g).map(s => s.replace(/src="js\/|"/g, ''));
const combined = files.map(f => fs.readFileSync(path.join(ROOT, 'js', f), 'utf8')).join('\n\n');
window.eval(combined);
window.document.dispatchEvent(new window.Event('DOMContentLoaded'));

setTimeout(() => {
  const $ = (sel) => window.document.querySelector(sel);
  const $$ = (sel) => [...window.document.querySelectorAll(sel)];
  const checks = [];

  // 1. Landing
  checks.push(['landing cards (9)', $$('.type-card').length === 9]);

  // 2. Abrir DL
  $$('.type-card').find(c => c.textContent.includes('Decreto-Lei')).click();
  checks.push(['editor abre com artigos', window.State.get().body.items.length > 0]);

  // 3. 4 tabs
  const tabs = $$('.tab').map(t => t.dataset.tab);
  const expected = ['info', 'review', 'links', 'output'];
  checks.push(['4 tabs presentes', tabs.length === 4 && expected.every(t => tabs.includes(t))]);

  // 4. Menus inicialmente fechados
  checks.push(['menus iniciam fechados', $$('[data-menu-panel].open').length === 0]);

  // 5. Abrir export menu
  const trigger = $('[data-menu="export"] [data-menu-trigger]');
  trigger.click();
  checks.push(['export menu abre', $$('[data-menu-panel].open').length === 1]);

  // 6. Click outside fecha
  window.document.body.click();
  checks.push(['click outside fecha', $$('[data-menu-panel].open').length === 0]);

  // 7. ESC fecha
  trigger.click();
  window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
  checks.push(['ESC fecha', $$('[data-menu-panel].open').length === 0]);

  // 8. Escolher opção fecha menu
  trigger.click();
  $('[data-export="xml"]').click();
  checks.push(['escolher opção fecha', $$('[data-menu-panel].open').length === 0]);

  // 9. Mutex: abrir um menu fecha o outro
  $('[data-menu="export"] [data-menu-trigger]').click();
  $('[data-menu="more"] [data-menu-trigger]').click();
  const exportOpen = $('[data-menu="export"] [data-menu-panel]').classList.contains('open');
  const moreOpen = $('[data-menu="more"] [data-menu-panel]').classList.contains('open');
  checks.push(['mutex de menus', !exportOpen && moreOpen]);

  // 10. Modais começam fechados
  checks.push(['modais iniciam fechados', $$('[data-modal]').every(m => m.classList.contains('hidden'))]);

  // 11. Bluebell-PT funciona
  const bbText = window.BluebellPt.serialize(window.State.get());
  const parsed = window.BluebellPt.parse(bbText);
  checks.push(['Bluebell-PT roundtrip', parsed.body.items.length === window.State.get().body.items.length]);

  // 12. DRE mock
  const dre = window.DreMock.suggest('decreto-lei 21 2023', 3);
  checks.push(['DRE-mock funciona', dre.length > 0]);

  // Print results
  let fails = 0;
  checks.forEach(([name, ok]) => {
    console.log(`${ok ? '✓' : '✗'} ${name}`);
    if (!ok) fails++;
  });

  if (errors.length) {
    console.log('\n✗ JS errors:');
    errors.forEach(e => console.log('  ' + e));
    fails += errors.length;
  }

  console.log(`\n${checks.length - fails}/${checks.length} OK${fails ? `, ${fails} falha(s)` : ''}`);
  process.exit(fails ? 1 : 0);
}, 200);
