// AKN-PT Editor — testes de UI via jsdom (corre em CI + localmente)
// EUPL-1.2
//
// Verifica que o interface v3 ("Cockpit de drafting") carrega sem erros
// JS e tem os novos componentes: pilha, breadcrumb, régua de actividade,
// Cmd-K palette, masthead.
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

  // 3. Masthead com cmd-k trigger
  checks.push(['cmdk trigger no masthead', $('#btn-cmdk') !== null]);

  // 4. Painel esquerdo é pilha (não TOC)
  checks.push(['pilha presente', $('#stack-list') !== null]);
  checks.push(['pilha tem o doc activo', $$('#stack-list .stack-item.active').length === 1]);

  // 5. Breadcrumb no canvas
  checks.push(['breadcrumb no canvas', $('#breadcrumb') !== null && $$('#breadcrumb > *').length > 0]);

  // 6. Régua de actividade à direita
  checks.push(['régua de actividade', $('#activity-feed') !== null]);
  checks.push(['filtros da régua (7)', $$('.activity-filter').length === 7]);

  // 7. Eventos live na régua
  checks.push(['régua tem eventos live', $$('#activity-feed .activity-item').length > 0]);

  // 8. Filtros funcionam
  const validationFilter = $$('.activity-filter').find(f => f.dataset.filter === 'validation');
  validationFilter.click();
  checks.push(['filtro validação activo', validationFilter.classList.contains('active')]);
  const allFilter = $$('.activity-filter').find(f => f.dataset.filter === 'all');
  allFilter.click();

  // 9. Export menu (único menu remanescente)
  const exportTrigger = $('[data-menu="export"] [data-menu-trigger]');
  exportTrigger.click();
  checks.push(['export menu abre', $$('[data-menu-panel].open').length === 1]);

  // 10. Click outside fecha
  window.document.body.click();
  checks.push(['click outside fecha', $$('[data-menu-panel].open').length === 0]);

  // 11. ESC fecha menus
  exportTrigger.click();
  window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
  checks.push(['ESC fecha export menu', $$('[data-menu-panel].open').length === 0]);

  // 12. Cmd-K overlay existe (criado por CmdK.init)
  checks.push(['Cmd-K overlay registado', $('#cmdk-overlay') !== null]);

  // 13. Cmd-K abre por trigger
  $('#btn-cmdk').click();
  checks.push(['Cmd-K abre via trigger', !$('#cmdk-overlay').classList.contains('hidden')]);

  // 14. Cmd-K mostra acções
  checks.push(['Cmd-K lista acções', $$('#cmdk-list .cmdk-item').length > 0]);

  // 15. Cmd-K pesquisa filtra
  const cmdInput = $('#cmdk-input');
  cmdInput.value = 'snapshot';
  cmdInput.dispatchEvent(new window.Event('input'));
  const filtered = $$('#cmdk-list .cmdk-item');
  checks.push(['Cmd-K filtra por pesquisa', filtered.length > 0 && filtered.length < 20]);

  // 16. Cmd-K fecha com ESC
  window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
  checks.push(['Cmd-K fecha com ESC', $('#cmdk-overlay').classList.contains('hidden')]);

  // 17. Modais começam fechados
  checks.push(['modais iniciam fechados',
    $$('[data-modal]').every(m => m.classList.contains('hidden'))]);

  // 18. Bluebell-PT funciona
  const bbText = window.BluebellPt.serialize(window.State.get());
  const parsed = window.BluebellPt.parse(bbText);
  checks.push(['Bluebell-PT roundtrip',
    parsed.body.items.length === window.State.get().body.items.length]);

  // 19. DRE mock
  const dre = window.DreMock.suggest('decreto-lei 21 2023', 3);
  checks.push(['DRE-mock funciona', dre.length > 0]);

  // 20. Pilha cresce com novo doc — voltar à landing, escolher outro
  window.history.pushState({}, '', '/');
  // Simular click no card "Lei" (sem fechar editor)
  $$('.type-card').find(c => c.textContent.includes('Lei') && !c.textContent.includes('Decreto'))?.click();
  const stackAfter = $$('#stack-list .stack-item').length;
  checks.push(['pilha cresce ao criar novo doc', stackAfter >= 2]);

  // 21. Identidade e pegada estão no canvas (não em tab)
  checks.push(['identidade no canvas', $('.canvas-card.identity-card') !== null]);
  checks.push(['pegada no canvas', $('.canvas-card.footprint-card') !== null]);

  // 22. Lab-only escondidos por defeito
  checks.push(['lab-only escondidos por defeito',
    $$('.lab-only').every(e => e.classList.contains('hidden') || !e.offsetParent)]);

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
