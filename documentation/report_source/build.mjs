// Builds ../LostLink_Project_Report.pdf
//
//   cd documentation/report_source
//   npm install          (once: installs @hpcc-js/wasm-graphviz)
//   npm run build
//
// Steps:
//   1. Render every diagrams/*.dot file to SVG with Graphviz (WebAssembly build, no system install).
//      diagrams/use_case.svg is generated separately by `python3 diagrams/use_case.py`.
//   2. Insert the SVGs into report.html where it says <!--FIG:name-->.
//   3. Print the HTML to PDF with headless Google Chrome.
//   4. Read the PDF text (pdftotext) to find on which page each section starts, write those
//      numbers into the table of contents, and print again.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { Graphviz } from '@hpcc-js/wasm-graphviz';

const OUT_PDF = '../LostLink_Project_Report.pdf';
const BUILD = 'build';
mkdirSync(BUILD, { recursive: true });

// 1. Diagrams
const graphviz = await Graphviz.load();
const svgs = {};
for (const file of readdirSync('diagrams').filter((f) => f.endsWith('.dot'))) {
  const name = file.replace('.dot', '');
  let svg = graphviz.dot(readFileSync(`diagrams/${file}`, 'utf8'));
  svg = svg.replace(/^[\s\S]*?(<svg)/, '$1'); // drop XML prolog and DOCTYPE
  writeFileSync(`diagrams/${name}.svg`, svg);
  svgs[name] = svg;
}
svgs.use_case = readFileSync('diagrams/use_case.svg', 'utf8');

// 2. Compose the HTML
function compose(tocPages) {
  let html = readFileSync('report.html', 'utf8');
  html = html.replace(/<!--FIG:(\w+)-->/g, (_, name) => {
    if (!svgs[name]) throw new Error(`Missing diagram ${name}`);
    return svgs[name];
  });
  html = html.replace(/<span class="pg" data-for="([^"]+)"><\/span>/g, (_, id) => `<span class="pg">${tocPages[id] ?? ''}</span>`);
  writeFileSync(`${BUILD}/report.full.html`, html);
}

function printPdf() {
  execFileSync('google-chrome', [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--no-pdf-header-footer',
    '--run-all-compositor-stages-before-draw', '--virtual-time-budget=5000',
    `--print-to-pdf=${OUT_PDF}`, `file://${process.cwd()}/${BUILD}/report.full.html`,
  ], { stdio: 'ignore' });
}

// 3. First pass (TOC numbers empty)
compose({});
printPdf();

// 4. Find section start pages. Every heading listed in the TOC carries a marker in report.html:
//    <h1 id="..." data-toc="Exact heading text">. We look for that text on pages after the TOC.
const html = readFileSync('report.html', 'utf8');
const entries = [...html.matchAll(/id="([^"]+)"[^>]*data-toc="([^"]+)"/g)].map((m) => ({ id: m[1], text: m[2] }));
const pages = execFileSync('pdftotext', ['-layout', OUT_PDF, '-']).toString().split('\f');
const tocPages = {};
// Start searching on the page after the table of contents (which contains every heading text too).
let searchFrom = pages.findIndex((page) => page.includes('List of Figures')) + 1;
for (const { id, text } of entries) {
  const needle = text.replace(/\s+/g, ' ').trim();
  for (let p = searchFrom; p < pages.length; p++) {
    if (pages[p].replace(/\s+/g, ' ').includes(needle)) {
      tocPages[id] = p + 1;
      searchFrom = p;
      break;
    }
  }
  if (!tocPages[id]) console.warn(`TOC: heading not found in PDF: ${text}`);
}
compose(tocPages);
printPdf();
const info = execFileSync('pdfinfo', [OUT_PDF]).toString().match(/Pages:\s+(\d+)/)[1];
console.log(`Written ${OUT_PDF} (${info} pages)`);
