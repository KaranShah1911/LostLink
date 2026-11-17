// Prints how large diagram text will be when each figure is scaled to its page area.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { Graphviz } from '@hpcc-js/wasm-graphviz';
const g = await Graphviz.load();
const LAND = [774, 500], PORT = [510, 735], HALF = [510, 330];
const area = { architecture: LAND, database: LAND, claim_flow: LAND, report_flow: PORT, auth_flow: PORT, claim_states: [510, 400] };
for (const f of readdirSync('diagrams').filter((f) => f.endsWith('.dot'))) {
  const n = f.replace('.dot', '');
  const svg = g.dot(readFileSync('diagrams/' + f, 'utf8'));
  writeFileSync('diagrams/' + n + '.svg', svg);
  const [w, h] = svg.match(/viewBox="0.00 0.00 ([\d.]+) ([\d.]+)"/).slice(1).map(Number);
  const a = area[n]; const sc = Math.min(1, a[0] / w, a[1] / h);
  console.log(n.padEnd(14), `${w} x ${h}`.padEnd(16), 'scale', sc.toFixed(2), ' node text', (15 * sc).toFixed(1), 'pt  edge text', (13 * sc).toFixed(1), 'pt');
}
