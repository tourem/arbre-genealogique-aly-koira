/**
 * Extract members from data/members.js and output as JSON.
 *
 * Usage:
 *   npx tsx scripts/extract-data.ts > members.json
 *
 * Outputs a JSON array of all members with full field names,
 * ready for database import.
 */

import * as fs from 'fs';
import * as path from 'path';

interface RawMember {
  id: string;
  n: string;
  a: string | null;
  g: 'M' | 'F';
  gen: number;
  f: string | null;
  m: string | null;
  sp?: string[];
  c?: string[];
}

function loadMembers(): Record<string, RawMember> {
  const filePath = path.resolve(__dirname, '../../data/members.js');
  const raw = fs.readFileSync(filePath, 'utf-8');

  const match = raw.match(/const\s+D\s*=\s*\{/);
  if (!match) throw new Error('Could not find "const D={" in members.js');

  const startIdx = raw.indexOf('{', match.index!);
  let depth = 0;
  let endIdx = startIdx;
  for (let i = startIdx; i < raw.length; i++) {
    if (raw[i] === '{') depth++;
    if (raw[i] === '}') depth--;
    if (depth === 0) {
      endIdx = i;
      break;
    }
  }

  const objectStr = raw.slice(startIdx, endIdx + 1);
  return new Function(`return (${objectStr})`)() as Record<string, RawMember>;
}

const raw = loadMembers();
const members = Object.values(raw).map((m) => ({
  id: m.id,
  name: m.n,
  alias: m.a,
  gender: m.g,
  generation: m.gen,
  father_id: m.f,
  mother_ref: m.m,
  spouses: m.sp || [],
  children: m.c || [],
}));

// Sort by generation
members.sort((a, b) => a.generation - b.generation);

console.log(JSON.stringify(members, null, 2));

// Also write to file
const outPath = path.resolve(__dirname, 'members-extracted.json');
fs.writeFileSync(outPath, JSON.stringify(members, null, 2));
console.error(`\nWritten ${members.length} members to ${outPath}`);
console.error(
  `Males: ${members.filter((m) => m.gender === 'M').length}, Females: ${members.filter((m) => m.gender === 'F').length}`,
);
console.error(
  `Generations: G${Math.min(...members.map((m) => m.generation))}-G${Math.max(...members.map((m) => m.generation))}`,
);
