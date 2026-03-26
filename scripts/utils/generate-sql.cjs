/**
 * Generates SQL schema + data files from data/members.js
 * Usage: node scripts/generate-sql.cjs
 */

const fs = require('fs');
const path = require('path');

// ── Read and parse members.js ───────────────────────────────────────

const filePath = path.resolve(__dirname, '../../data/members.js');
const raw = fs.readFileSync(filePath, 'utf-8');

const match = raw.match(/const\s+D\s*=\s*\{/);
if (!match) throw new Error('Could not find "const D={" in members.js');

const startIdx = raw.indexOf('{', match.index);
let depth = 0;
let endIdx = startIdx;
for (let i = startIdx; i < raw.length; i++) {
  if (raw[i] === '{') depth++;
  if (raw[i] === '}') depth--;
  if (depth === 0) { endIdx = i; break; }
}

const objectStr = raw.slice(startIdx, endIdx + 1);
const D = new Function(`return (${objectStr})`)();

// ── Helpers ─────────────────────────────────────────────────────────

function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  return "'" + String(val).replace(/'/g, "''") + "'";
}

function pgArray(arr) {
  if (!arr || arr.length === 0) return "'{}'";
  const items = arr.map(v => '"' + String(v).replace(/"/g, '\\"') + '"').join(',');
  return "'{" + items + "}'";
}

// ── Generate SQL ────────────────────────────────────────────────────

const members = Object.values(D);
members.sort((a, b) => a.gen - b.gen);

let sql = '';

sql += `-- ═══════════════════════════════════════════════════════════════\n`;
sql += `-- DONNEES GENEALOGIQUES - Famille Aly Koira\n`;
sql += `-- Genere automatiquement depuis data/members.js\n`;
sql += `-- ${members.length} membres | ${new Date().toISOString().split('T')[0]}\n`;
sql += `-- ═══════════════════════════════════════════════════════════════\n\n`;

sql += `-- Vider la table avant insertion (optionnel)\n`;
sql += `-- TRUNCATE TABLE members;\n\n`;

// Group by generation
const byGen = {};
for (const m of members) {
  if (!byGen[m.gen]) byGen[m.gen] = [];
  byGen[m.gen].push(m);
}

const gens = Object.keys(byGen).map(Number).sort((a, b) => a - b);

for (const gen of gens) {
  const batch = byGen[gen];
  sql += `-- ══════════════════════════════════════════════════════════\n`;
  sql += `-- GENERATION ${gen} (${batch.length} membres)\n`;
  sql += `-- ══════════════════════════════════════════════════════════\n\n`;

  sql += `INSERT INTO members (id, name, alias, gender, generation, father_id, mother_ref, spouses, children) VALUES\n`;

  const rows = batch.map(m => {
    return `  (${esc(m.id)}, ${esc(m.n)}, ${esc(m.a)}, ${esc(m.g)}, ${m.gen}, ${esc(m.f)}, ${esc(m.m)}, ${pgArray(m.sp)}, ${pgArray(m.c)})`;
  });

  sql += rows.join(',\n');
  sql += `\nON CONFLICT (id) DO UPDATE SET\n`;
  sql += `  name = EXCLUDED.name,\n`;
  sql += `  alias = EXCLUDED.alias,\n`;
  sql += `  gender = EXCLUDED.gender,\n`;
  sql += `  generation = EXCLUDED.generation,\n`;
  sql += `  father_id = EXCLUDED.father_id,\n`;
  sql += `  mother_ref = EXCLUDED.mother_ref,\n`;
  sql += `  spouses = EXCLUDED.spouses,\n`;
  sql += `  children = EXCLUDED.children;\n\n`;
}

// Stats at the end
const males = members.filter(m => m.g === 'M').length;
const females = members.filter(m => m.g === 'F').length;
const maxGen = Math.max(...members.map(m => m.gen));

sql += `-- ══════════════════════════════════════════════════════════\n`;
sql += `-- STATISTIQUES\n`;
sql += `-- Total: ${members.length} membres\n`;
sql += `-- Hommes: ${males} | Femmes: ${females}\n`;
sql += `-- Generations: G0 a G${maxGen} (${maxGen + 1} generations)\n`;
sql += `-- ══════════════════════════════════════════════════════════\n`;

// ── Write files ─────────────────────────────────────────────────────

const outPath = path.resolve(__dirname, 'seed-data.sql');
fs.writeFileSync(outPath, sql, 'utf-8');
console.log(`Generated: ${outPath}`);
console.log(`  ${members.length} members (${males}M / ${females}F)`);
console.log(`  Generations: G0-G${maxGen}`);
