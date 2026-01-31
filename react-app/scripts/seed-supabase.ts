/**
 * Seed script: migrates data from data/members.js into Supabase.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   npx tsx scripts/seed-supabase.ts
 *
 * This script:
 * 1. Reads the raw JS data object from ../data/members.js
 * 2. Transforms the compact {n, a, g, gen, f, m, sp, c} format
 *    into the full {id, name, alias, gender, generation, father_id, mother_ref, spouses, children} format
 * 3. Inserts rows ordered by generation (parents before children)
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.',
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Extract raw data ────────────────────────────────────────────────

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

  // The file declares: const D = { ... };
  // We extract the object literal and eval it safely using Function constructor
  const match = raw.match(/const\s+D\s*=\s*\{/);
  if (!match) throw new Error('Could not find "const D={" in members.js');

  // Find the matching closing brace
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
  // Use Function to evaluate the JS object literal
  const D = new Function(`return (${objectStr})`)() as Record<
    string,
    RawMember
  >;
  return D;
}

// ── Transform ───────────────────────────────────────────────────────

interface SupabaseMember {
  id: string;
  name: string;
  alias: string | null;
  gender: 'M' | 'F';
  generation: number;
  father_id: string | null;
  mother_ref: string | null;
  spouses: string[];
  children: string[];
}

function transform(raw: Record<string, RawMember>): SupabaseMember[] {
  return Object.values(raw).map((m) => ({
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
}

// ── Insert into Supabase ────────────────────────────────────────────

async function seed() {
  console.log('Loading members from data/members.js...');
  const raw = loadMembers();
  const members = transform(raw);
  console.log(`Found ${members.length} members.`);

  // Sort by generation so parents are inserted first
  members.sort((a, b) => a.generation - b.generation);

  // Group by generation for ordered insertion
  const byGen = new Map<number, SupabaseMember[]>();
  for (const m of members) {
    const gen = m.generation;
    if (!byGen.has(gen)) byGen.set(gen, []);
    byGen.get(gen)!.push(m);
  }

  const sortedGens = [...byGen.keys()].sort((a, b) => a - b);

  for (const gen of sortedGens) {
    const batch = byGen.get(gen)!;
    console.log(`Inserting generation ${gen}: ${batch.length} members...`);

    const { error } = await supabase.from('members').upsert(batch, {
      onConflict: 'id',
    });

    if (error) {
      console.error(`Error inserting generation ${gen}:`, error);
      process.exit(1);
    }
  }

  console.log(`\nDone! ${members.length} members inserted into Supabase.`);

  // Print summary stats
  const males = members.filter((m) => m.gender === 'M').length;
  const females = members.filter((m) => m.gender === 'F').length;
  const maxGen = Math.max(...members.map((m) => m.generation));
  console.log(`\nStats:`);
  console.log(`  Total: ${members.length}`);
  console.log(`  Males: ${males}`);
  console.log(`  Females: ${females}`);
  console.log(`  Generations: ${maxGen + 1} (G0-G${maxGen})`);
}

seed().catch(console.error);
