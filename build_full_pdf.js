const fs = require('fs');
const path = require('path');
const https = require('https');
const { marked } = require('marked');
const { execSync } = require('child_process');

async function fetchMermaidSvg(mermaidCode) {
  return new Promise((resolve) => {
    // Encode mermaid diagram in base64
    const base64 = Buffer.from(mermaidCode.trim()).toString('base64');
    const url = 'https://mermaid.ink/svg/' + base64;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 && data.includes('<svg')) {
          resolve(data);
        } else {
          console.warn('Fallback: mermaid.ink returned status', res.statusCode);
          resolve('<pre class="mermaid-fallback">' + mermaidCode + '</pre>');
        }
      });
    }).on('error', (err) => {
      console.error('Error fetching mermaid svg:', err.message);
      resolve('<pre class="mermaid-fallback">' + mermaidCode + '</pre>');
    });
  });
}

async function main() {
  console.log('--- GENERANDO INFORME TÉCNICO PDF (MATRICES Y TABLAS ESTRUCTURALES) ---');
  
  const mdPath = path.join(__dirname, 'Sistema de Gestión de Cirugía Bariátrica.md');
  const mdContent = fs.readFileSync(mdPath, 'utf-8');

  // Find all mermaid blocks
  const mermaidRegex = /```mermaid\r?\n([\s\S]*?)```/g;
  let match;
  const mermaidBlocks = [];
  while ((match = mermaidRegex.exec(mdContent)) !== null) {
    mermaidBlocks.push(match[1]);
  }

  console.log('Diagramas Mermaid detectados:', mermaidBlocks.length);

  // Fetch SVGs for all diagrams
  const svgs = [];
  for (let i = 0; i < mermaidBlocks.length; i++) {
    console.log(`Procesando diagrama ${i + 1}/${mermaidBlocks.length}...`);
    const svg = await fetchMermaidSvg(mermaidBlocks[i]);
    svgs.push(svg);
  }

  // Replace mermaid blocks with placeholder tokens
  let processedMd = mdContent;
  let diagramIndex = 0;
  processedMd = processedMd.replace(mermaidRegex, () => {
    const token = `__MERMAID_DIAGRAM_${diagramIndex}__`;
    diagramIndex++;
    return token;
  });

  // Parse markdown with marked
  marked.setOptions({
    gfm: true,
    breaks: false
  });

  let htmlBody = marked.parse(processedMd);

  // Replace tokens with actual SVGs wrapped in styled divs
  svgs.forEach((svg, idx) => {
    const svgWrapper = `<div class="mermaid-container">${svg}</div>`;
    htmlBody = htmlBody.replace(`__MERMAID_DIAGRAM_${idx}__`, svgWrapper);
  });

  // Full HTML template with print CSS
  const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Sistema de Gestión de Cirugía Bariátrica (UCIBAM) - Informe Técnico</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');

    @page {
      size: letter;
      margin: 15mm 13mm 15mm 13mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 9pt;
      line-height: 1.48;
      color: #1e293b;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }

    h1, h2, h3, h4, h5, h6 {
      color: #0f172a;
      font-weight: 800;
      margin-top: 1.2em;
      margin-bottom: 0.35em;
      page-break-after: avoid;
      break-after: avoid;
    }

    h1 {
      font-size: 14pt;
      border-bottom: 2px solid #00A3E0;
      padding-bottom: 0.2em;
      margin-top: 1.3em;
    }

    h2 {
      font-size: 11.5pt;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 0.15em;
    }

    h3 {
      font-size: 10pt;
    }

    h4 {
      font-size: 9.5pt;
    }

    p {
      margin-top: 0.3em;
      margin-bottom: 0.45em;
      text-align: justify;
    }

    ul, ol {
      margin-top: 0.3em;
      margin-bottom: 0.45em;
      padding-left: 1.3em;
    }

    li {
      margin-bottom: 0.2em;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.8em 0;
      font-size: 7.5pt;
      page-break-inside: avoid;
      break-inside: avoid;
      background: #ffffff;
    }

    th, td {
      border: 1px solid #cbd5e1;
      padding: 4px 6.5px;
      text-align: left;
      vertical-align: top;
    }

    th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 7pt;
      letter-spacing: 0.2px;
    }

    tr:nth-child(even) {
      background-color: #f8fafc;
    }

    code {
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
      font-size: 7.5pt;
      background-color: #f1f5f9;
      color: #0369a1;
      padding: 1px 3px;
      border-radius: 3px;
      border: 1px solid #e2e8f0;
    }

    pre {
      background-color: #0f172a;
      color: #f8fafc;
      padding: 7px 11px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 7pt;
      line-height: 1.35;
      margin: 0.6em 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    pre code {
      background: none;
      color: inherit;
      border: none;
      padding: 0;
      font-size: inherit;
    }

    blockquote {
      margin: 0.7em 0;
      padding: 5px 11px;
      border-left: 3.5px solid #00A3E0;
      background-color: #f0f9ff;
      color: #0369a1;
      font-size: 8.5pt;
      border-radius: 0 6px 6px 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    blockquote p {
      margin: 0;
    }

    hr {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 1em 0;
    }

    .mermaid-container {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0.8em auto;
      padding: 10px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      page-break-inside: avoid;
      break-inside: avoid;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
      max-width: 100%;
      text-align: center;
    }

    .mermaid-container svg {
      max-width: 95% !important;
      height: auto !important;
      max-height: 380px !important;
    }

    a {
      color: #00A3E0;
      text-decoration: none;
    }
  </style>
</head>
<body>
  ${htmlBody}
</body>
</html>`;

  const staticHtmlPath = path.join(__dirname, 'static_report.html');
  fs.writeFileSync(staticHtmlPath, fullHtml, 'utf-8');
  console.log('HTML estático con SVGs generado en:', staticHtmlPath);

  // Convert to PDF using Edge headless
  const pdfFilePath = path.join(__dirname, 'Sistema de Gestión de Cirugía Bariátrica.pdf');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  
  const edgeCmd = `"${edgePath}" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfFilePath}" "${staticHtmlPath}"`;
  
  console.log('Generando PDF mediante Edge headless...');
  try {
    execSync(edgeCmd, { stdio: 'inherit' });
    const stat = fs.statSync(pdfFilePath);
    console.log('✅ ¡PDF GENERADO CON ÉXITO!');
    console.log('Ruta del PDF:', pdfFilePath);
    console.log('Tamaño del archivo:', stat.size, 'bytes');
  } catch (e) {
    console.error('Error al generar PDF:', e.message);
  }
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
