// AKN-PT Editor — exportadores adicionais (PDF, DOCX)
// EUPL-1.2
//
// PDF  : via Print API do browser numa janela popup com o Preview HTML
//        + folha de estilo de impressão dedicada. O utilizador escolhe
//        "Guardar como PDF" no diálogo do sistema.
// DOCX : geramos um ficheiro `.doc` com HTML+namespace Office (Mso). O Word
//        2007+ abre-o nativamente, sem necessidade de dependência JS pesada
//        (zero CDN, zero build). É menos "fiel" que docx.js mas mantém-se
//        coerente com o princípio "sem servidor, sem build" do editor.

const Exporters = (() => {

  // -------------------- PDF (browser print) --------------------------------

  // CSS embutido para a janela de impressão. Mantém a mesma família tipográfica
  // do editor (Spectral) e a estética sóbria.
  const PRINT_CSS = `
    @import url("https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap");
    @page { size: A4; margin: 2.5cm 2cm; }
    body {
      font-family: "Spectral", Georgia, serif;
      font-size: 11pt;
      line-height: 1.55;
      color: #1c1d22;
      margin: 0;
    }
    .preview-html { max-width: 100%; margin: 0; }
    h1 { font-size: 18pt; font-weight: 600; color: #2a3a6b; text-align: center; margin: 0 0 8pt; }
    .pv-doctype { font-weight: 700; }
    .pv-shorttitle { font-style: italic; color: #3d4049; margin-bottom: 18pt; }
    .pv-formula {
      font-style: italic; background: #f5f3ee;
      padding: 8pt 10pt; border-left: 3pt solid #2a3a6b; margin: 12pt 0;
    }
    .pv-recital { margin: 6pt 0; text-align: justify; }
    .pv-article { margin: 14pt 0; page-break-inside: avoid; }
    .pv-article-num { font-weight: 700; color: #2a3a6b; margin-bottom: 4pt; }
    .pv-article-heading { font-style: italic; font-weight: 500; }
    .pv-paragraph { margin: 6pt 0 6pt 1.2em; text-align: justify; }
    .pv-point     { margin: 2pt 0 2pt 2.4em; }
    .pv-subpoint  { margin: 2pt 0 2pt 3.6em; font-style: italic; }
    .pv-signatures { margin-top: 24pt; }
    .pv-signature  { text-align: right; font-style: italic; }
    .pv-attachment {
      margin-top: 28pt; border-top: 1px solid #c9c4b8; padding-top: 10pt;
      page-break-before: always;
    }
    .pv-attachment h2 { font-size: 13pt; color: #2a3a6b; }
    .pv-footprint {
      margin-top: 28pt; border-top: 1pt dashed #c9c4b8; padding-top: 10pt;
      font-size: 9.5pt; color: #3d4049; page-break-before: always;
    }
    .pv-footprint h3 { font-size: 12pt; color: #2a3a6b; margin: 0 0 6pt; }
    a { color: #2a3a6b; text-decoration: none; }
    a[href^="http"]::after { content: " (" attr(href) ")"; font-size: 0.85em; color: #6b6e78; }
    /* Identificador ELI visível: nas saídas para papel os metadados embutidos
       perdem-se, pelo que o identificador tem de ficar no próprio texto. */
    .eli-uri { margin-top: 2em; padding-top: 0.6em; border-top: 1px solid #c9c9c9;
               font-size: 0.8em; color: #55585f; word-break: break-all; }
  `;

  // Em modo alterador o doc é um invólucro sem articulado próprio (o texto vive
  // no alvo). O que faz sentido imprimir/exportar é a versão CONSOLIDADA.
  function _docParaRender(doc) {
    if (doc && doc.kind === 'amender' && typeof Amendment !== 'undefined') {
      try {
        // Consolidar a uma data REAL: o applyAll usa a sentinela 9999-12-31, que
        // não conta como consolidação, e o artefacto saía com o ELI (e o nome de
        // ficheiro) do acto PUBLICADO apesar de levar o texto consolidado.
        const hoje = new Date().toISOString().slice(0, 10);
        const marcos = (Amendment.timeline ? Amendment.timeline(doc) : []).filter(d => d && d <= hoje);
        const data = marcos.length ? marcos[marcos.length - 1] : hoje;
        return Amendment.applyAtDate(doc, data);
      } catch (e) { /* cai no doc original */ }
    }
    return doc;
  }

  // Título com o sufixo territorial (/A Açores, /M Madeira), como a INCM o cita.
  function _titulo(doc) {
    const suf = doc.country === 'pt-20' ? '/A' : doc.country === 'pt-30' ? '/M' : '';
    return `${displayActType(doc.actName)} n.º ${doc.number || 'X'}/${doc.year}${suf}`;
  }

  // Linha VISÍVEL com o identificador ELI — nas saídas para papel/Word os
  // metadados embutidos perdem-se, pelo que o identificador tem de ficar no
  // próprio texto. Falha em silêncio nunca: se não houver ELI, nada se imprime.
  function _eliLinha(doc, fmt) {
    if (typeof EliMetadata === 'undefined') return '';
    try {
      // Identifica-se a MANIFESTAÇÃO do formato que está a ser produzido, não o
      // Work: é esse o artefacto que o leitor tem em mãos.
      const uri = fmt ? EliMetadata.manifestationUri(doc, {}, fmt) : EliMetadata.workUri(doc);
      return uri ? `<p class="eli-uri">ELI: ${escapeHtml(uri)}</p>` : '';
    } catch (e) { return ''; }
  }

  // Nome de ficheiro derivado do identificador ELI (ver EliMetadata.fileBase).
  function _nomeFicheiro(doc, ext) {
    try {
      if (typeof EliMetadata !== 'undefined' && EliMetadata.fileBase) {
        return `${EliMetadata.fileBase(doc)}.${ext}`;
      }
    } catch (e) { /* cai no nome genérico */ }
    return `${doc.actName || 'documento'}-${doc.number || 'X'}-${doc.year}.${ext}`;
  }

  function exportPdf(docIn) {
    const doc = _docParaRender(docIn);
    const html = Preview.render(doc);
    const title = _titulo(doc);
    const w = window.open('', '_blank', 'width=900,height=1200');
    if (!w) throw new Error('Popup bloqueado — autorize popups para gerar PDF.');
    w.document.open();
    w.document.write(`<!DOCTYPE html>
<html lang="pt-PT">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <style>${PRINT_CSS}</style>
</head>
<body>
  ${html}
  ${_eliLinha(doc, 'pdf')}
  <script>
    window.addEventListener('load', () => {
      setTimeout(() => window.print(), 400);
    });
  </script>
</body>
</html>`);
    w.document.close();
  }

  // -------------------- DOCX (Word-compatible HTML) ------------------------
  //
  // Word abre ficheiros .doc cujo conteúdo é HTML com namespaces "mso"; é
  // a abordagem MHT antiga, ainda 100% suportada por Word desktop e online,
  // LibreOffice Writer e Google Docs (com "Open with Word").
  //
  // O ficheiro resultante mantém estilo razoável (tipografia, indentação,
  // bullets) e é editável como qualquer documento.

  function exportDocx(docIn) {
    const doc = _docParaRender(docIn);
    // O Word descarta <script>, pelo que o JSON-LD embutido não sobrevive:
    // remove-se e o identificador vai em texto e num <meta>.
    const previewHtml = Preview.render(doc).replace(/<script[\s\S]*?<\/script>/g, '')
      + _eliLinha(doc, 'html');
    const title = _titulo(doc);

    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)}</title>
<meta name="ELI" content="${escapeHtml((typeof EliMetadata !== 'undefined' && EliMetadata.expressionUri(doc)) || '')}">
<!--[if gte mso 9]>
<xml>
  <w:WordDocument>
    <w:View>Print</w:View>
    <w:Zoom>100</w:Zoom>
    <w:DoNotOptimizeForBrowser/>
  </w:WordDocument>
</xml>
<![endif]-->
<style>
  @page Section1 { size: 21cm 29.7cm; margin: 2.5cm 2cm; mso-page-orientation: portrait; }
  div.Section1 { page: Section1; }
  body { font-family: "Spectral", Georgia, serif; font-size: 11pt; line-height: 1.55; color: #1c1d22; }
  h1 { font-size: 18pt; font-weight: bold; color: #2a3a6b; text-align: center; }
  .pv-doctype { font-weight: bold; }
  .pv-shorttitle { font-style: italic; color: #3d4049; }
  .pv-formula { font-style: italic; background: #f5f3ee; padding: 8pt; border-left: 3pt solid #2a3a6b; }
  .pv-recital { margin: 6pt 0; text-align: justify; }
  .pv-article { margin: 14pt 0; }
  .pv-article-num { font-weight: bold; color: #2a3a6b; }
  .pv-article-heading { font-style: italic; }
  .pv-paragraph { margin: 6pt 0 6pt 1.2em; text-align: justify; }
  .pv-point { margin: 2pt 0 2pt 2.4em; }
  .pv-subpoint { margin: 2pt 0 2pt 3.6em; font-style: italic; }
  .pv-signature { text-align: right; font-style: italic; }
  .pv-attachment { margin-top: 28pt; border-top: 1px solid #c9c4b8; padding-top: 10pt; }
</style>
</head>
<body>
<div class="Section1">
${previewHtml}
</div>
</body>
</html>`;

    const filename = _nomeFicheiro(doc, 'doc');
    download(html, filename, 'application/msword;charset=utf-8');
  }

  // -------------------- Helpers --------------------------------------------

  function displayActType(actName) {
    const types = {
      'dec-lei': 'Decreto-Lei',
      'lei': 'Lei',
      'decreto-ar': 'Decreto da Assembleia da República',
      'res-ar': 'Resolução da Assembleia da República',
      'portaria': 'Portaria',
      'res-cm': 'Resolução do Conselho de Ministros',
      'despacho-normativo': 'Despacho normativo',
      'dlr': 'Decreto Legislativo Regional',
      'drr': 'Decreto Regulamentar Regional',
    };
    return types[actName] || actName;
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = String(s || '');
    return div.innerHTML;
  }

  function download(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return { exportPdf, exportDocx };
})();

if (typeof window !== "undefined") window.Exporters = Exporters;
