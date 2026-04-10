#!/usr/bin/env node
/**
 * Générateur SQL d'import de membres dans la généalogie Aly Koïra
 *
 * Usage: node scripts/import-membres.mjs [fichier]
 *
 * Génère 2 fichiers SQL dans scripts/output/ :
 *   - import_YYYY-MM-DD_HHhmm.sql   (script d'import)
 *   - rollback_YYYY-MM-DD_HHhmm.sql  (script de rollback)
 *
 * Relations bidirectionnelles :
 *   - enfant.father_id = père.id  ET  père.children[] += enfant.id
 *   - enfant.mother_ref = mère.id ET  mère.children[] += enfant.id
 *   - père.spouses[] += mère.id   ET  mère.spouses[] += père.id
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { createInterface } from 'readline';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Config Supabase (lecture seule pour recherche) ---
const envPath = resolve(__dirname, '../.env.selfhost');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^(\w+)=(.+)$/);
  if (match) env[match[1]] = match[2].trim();
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

// --- Readline ---
const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

// --- SQL builders ---
const sqlLines = [];
const rollbackLines = [];
const createdIds = [];

function esc(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

function sqlComment(text) {
  sqlLines.push(`\n-- ${text}`);
  rollbackLines.push(`\n-- ${text}`);
}

function emitInsertMember({ id, name, firstName, lastName, alias, gender, generation, fatherId, motherRef }) {
  createdIds.push(id);
  sqlLines.push(`INSERT INTO members (id, name, first_name, alias, gender, generation, father_id, mother_ref, spouses, children, photo_url, note, birth_city, birth_country, village)
VALUES (${esc(id)}, ${esc(name)}, ${esc(firstName)}, ${esc(alias)}, ${esc(gender)}, ${generation}, ${fatherId ? esc(fatherId) : 'NULL'}, ${motherRef ? esc(motherRef) : 'NULL'}, ARRAY[]::TEXT[], ARRAY[]::TEXT[], NULL, NULL, NULL, NULL, NULL);`);

  rollbackLines.push(`DELETE FROM members WHERE id = ${esc(id)};`);
}

function emitUpdateFatherId(childId, childName, fatherId) {
  sqlLines.push(`-- ${childName}: father_id = ${fatherId}
UPDATE members SET father_id = ${esc(fatherId)} WHERE id = ${esc(childId)};`);

  rollbackLines.push(`-- Restaurer father_id de ${childName}
UPDATE members SET father_id = NULL WHERE id = ${esc(childId)};`);
}

function emitUpdateMotherRef(childId, childName, motherRef) {
  sqlLines.push(`-- ${childName}: mother_ref = ${motherRef}
UPDATE members SET mother_ref = ${esc(motherRef)} WHERE id = ${esc(childId)};`);

  rollbackLines.push(`-- Restaurer mother_ref de ${childName}
UPDATE members SET mother_ref = NULL WHERE id = ${esc(childId)};`);
}

function emitAddChildToParent(parentId, parentName, childId, childName) {
  sqlLines.push(`-- ${parentName}.children += ${childName}
UPDATE members SET children = array_append(children, ${esc(childId)}) WHERE id = ${esc(parentId)} AND NOT (${esc(childId)} = ANY(children));`);

  rollbackLines.push(`-- Retirer ${childName} des enfants de ${parentName}
UPDATE members SET children = array_remove(children, ${esc(childId)}) WHERE id = ${esc(parentId)};`);
}

function emitAddSpouse(member1Id, name1, member2Id, name2) {
  // Bidirectionnel
  sqlLines.push(`-- Conjoints: ${name1} <-> ${name2}
UPDATE members SET spouses = array_append(spouses, ${esc(member2Id)}) WHERE id = ${esc(member1Id)} AND NOT (${esc(member2Id)} = ANY(spouses));
UPDATE members SET spouses = array_append(spouses, ${esc(member1Id)}) WHERE id = ${esc(member2Id)} AND NOT (${esc(member1Id)} = ANY(spouses));`);

  rollbackLines.push(`-- Retirer conjoints: ${name1} <-> ${name2}
UPDATE members SET spouses = array_remove(spouses, ${esc(member2Id)}) WHERE id = ${esc(member1Id)};
UPDATE members SET spouses = array_remove(spouses, ${esc(member1Id)}) WHERE id = ${esc(member2Id)};`);
}

// --- Helpers ---
function parseName(fullInput) {
  const ditMatch = fullInput.match(/^(.+?)\s+dit\s+(.+)$/i);

  if (ditMatch) {
    const beforeDit = ditMatch[1].trim();
    const afterDit = ditMatch[2].trim();
    const beforeParts = beforeDit.split(/\s+/);
    const afterParts = afterDit.split(/\s+/);

    if (beforeParts.length === 1 && afterParts.length > 1) {
      // "Abacar dit Koa Arboncana" -> prénom=Abacar, nom=Arboncana, surnom=Koa
      return {
        firstName: beforeParts[0],
        lastName: afterParts.slice(1).join(' '),
        name: afterParts[0],
        alias: afterParts[0],
      };
    } else {
      // "Hamma Makiyou Sidi dit Papi" -> prénom=Hamma, nom=Makiyou Sidi, surnom=Papi
      return {
        firstName: beforeParts[0],
        lastName: beforeParts.slice(1).join(' '),
        name: afterDit,
        alias: afterDit,
      };
    }
  }

  const parts = fullInput.trim().split(/\s+/);
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ') || '',
    name: fullInput.trim(),
    alias: null,
  };
}

function parsePersonRef(ref) {
  // Formats: "Nom", "Nom:F", "Nom:UUID", "Nom:UUID:F"
  const matchIdGender = ref.match(/^(.+?):([0-9a-f-]{36}):([MF])$/i);
  if (matchIdGender) {
    return { fullName: matchIdGender[1].trim(), id: matchIdGender[2], gender: matchIdGender[3].toUpperCase() };
  }
  const matchId = ref.match(/^(.+?):([0-9a-f-]{36})$/);
  if (matchId) {
    return { fullName: matchId[1].trim(), id: matchId[2], gender: null };
  }
  const matchGender = ref.match(/^(.+?):([MF])$/i);
  if (matchGender) {
    return { fullName: matchGender[1].trim(), id: null, gender: matchGender[2].toUpperCase() };
  }
  return { fullName: ref.trim(), id: null, gender: null };
}

function guessGender(firstName) {
  const femaleNames = [
    'safietou', 'fati', 'hajarata', 'habilatou', 'mariam', 'aminta',
    'rakietou', 'haoulatou', 'hadaye', 'chiya', 'aissata', 'aminata',
    'fatoumata', 'hawa', 'kadiatou', 'mariama', 'oumou', 'rabi',
    'salamatou', 'zeinabou', 'balkissa', 'bibata', 'djamila',
    'fanta', 'hadja', 'hamsatou', 'hassana', 'maimouna',
  ];
  const lowerFirst = (firstName || '').toLowerCase();
  if (femaleNames.some((f) => lowerFirst.startsWith(f))) return 'F';
  const femaleEndings = ['tou', 'ta', 'am', 'ya', 'atou', 'aye'];
  if (femaleEndings.some((e) => lowerFirst.endsWith(e))) return 'F';
  return 'M';
}

async function searchMember(name) {
  const { data } = await supabase
    .from('members')
    .select('id, name, first_name, alias, gender, generation, father_id, mother_ref, spouses, children')
    .or(`name.ilike.%${name}%,alias.ilike.%${name}%,first_name.ilike.%${name}%`)
    .limit(5);
  return data || [];
}

async function getMember(id) {
  const { data } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .single();
  return data;
}

async function resolvePerson(fullName, knownId) {
  if (knownId) {
    const existing = await getMember(knownId);
    if (existing) {
      console.log(`  -> ${fullName} trouvé en base (id: ${knownId})`);
      return { member: existing, isNew: false };
    }
    console.log(`  !! ${fullName} ID ${knownId} non trouvé en base !`);
  }

  const results = await searchMember(fullName);
  if (results.length > 0) {
    console.log(`\n  WARNING: Personne(s) similaire(s) trouvée(s) pour "${fullName}":`);
    results.forEach((r, i) => {
      console.log(`    [${i + 1}] ${r.name} (${r.first_name || '-'}) - ${r.gender} - gen ${r.generation} - id: ${r.id}`);
    });
    const answer = await ask(`  Utiliser une de ces personnes ? (1-${results.length} ou N pour créer): `);
    const idx = parseInt(answer, 10);
    if (idx >= 1 && idx <= results.length) {
      console.log(`  -> Utilisation de "${results[idx - 1].name}" (${results[idx - 1].id})`);
      return { member: results[idx - 1], isNew: false };
    }
  }

  return null;
}

// --- Parsing du fichier ---
function parseInputFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);

  const result = {
    grandMother: null,
    father: null,
    childGroups: [],
  };

  // Enfants en attente d'une mère (accumulés avant "Leur mère s'appelle")
  let pendingChildren = [];

  for (const line of lines) {
    // Ligne de contexte: "Les ... enfants ... de X dont leur père (est) Y"
    const contextFatherMatch = line.match(
      /les\s+(?:autres\s+)?(?:petits?\s+)?enfants?\s+(?:directs?|indirects?)\s+de\s+(.+?)\s+dont\s+leur\s+p[eè]re\s+(?:est\s+)?(.+)/i
    );
    if (contextFatherMatch) {
      result.grandMother = parsePersonRef(contextFatherMatch[1]);
      result.father = parsePersonRef(contextFatherMatch[2]);
      continue;
    }

    // Ligne de contexte variante: "... dont leur mère s'appelle Y et leur père s'appelle Z"
    const contextBothMatch = line.match(
      /les\s+(?:autres\s+)?(?:petits?\s+)?enfants?\s+(?:directs?|indirects?)\s+de\s+(.+?)\s+dont\s+leur\s+m[eè]re\s+(?:est|s['']appelle)\s+(.+?)\s+et\s+leur\s+p[eè]re\s+(?:est|s['']appelle)\s+(.+)/i
    );
    if (contextBothMatch) {
      result.grandMother = parsePersonRef(contextBothMatch[1]);
      result.contextMother = parsePersonRef(contextBothMatch[2]);
      result.father = parsePersonRef(contextBothMatch[3]);
      continue;
    }

    // Ligne de contexte variante: "... dont leur mère s'appelle Y" (sans père)
    const contextMotherMatch = line.match(
      /les\s+(?:autres\s+)?(?:petits?\s+)?enfants?\s+(?:directs?|indirects?)\s+de\s+(.+?)\s+dont\s+leur\s+m[eè]re\s+(?:est|s['']appelle)\s+(.+)/i
    );
    if (contextMotherMatch) {
      result.grandMother = parsePersonRef(contextMotherMatch[1]);
      result.contextMother = parsePersonRef(contextMotherMatch[2]);
      continue;
    }

    // Ligne de contexte simple: "Les enfants de X" (un seul parent, pas de "dont")
    const contextSimpleMatch = line.match(
      /^les\s+(?:autres\s+)?(?:petits?\s+)?enfants?\s+(?:directs?\s+|indirects?\s+)?de\s+(.+)/i
    );
    if (contextSimpleMatch) {
      const parentRef = parsePersonRef(contextSimpleMatch[1]);
      // Le genre sera résolu dans main() (par ID en base, genre explicite, ou heuristique)
      result.singleParent = parentRef;
      continue;
    }

    // Mère (singulier ou pluriel): s'applique aux enfants PRÉCÉDENTS
    const motherMatch = line.match(/(?:leur|sa)\s+m[eè]re\s+s['']appelle\s+(.+)/i);
    if (motherMatch) {
      if (pendingChildren.length > 0) {
        result.childGroups.push({
          mother: parsePersonRef(motherMatch[1]),
          children: pendingChildren,
        });
        pendingChildren = [];
      }
      continue;
    }

    // Enfant numéroté
    const childMatch = line.match(/^\d+[-–]\s*(.+)$/);
    if (childMatch) {
      let childRaw = childMatch[1].trim();
      let explicitGender = null;
      let explicitId = null;

      // Extraire suffixe :F ou :M en fin de ligne
      const genderSuffix = childRaw.match(/:([MF])$/i);
      if (genderSuffix) {
        explicitGender = genderSuffix[1].toUpperCase();
        childRaw = childRaw.slice(0, -2).trim();
      }

      // Extraire UUID (avec éventuellement :G après, déjà extrait)
      const uuidMatch = childRaw.match(/:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
      if (uuidMatch) {
        explicitId = uuidMatch[1];
        childRaw = childRaw.slice(0, -(uuidMatch[0].length)).trim();
      }

      const parsed = parseName(childRaw);
      if (explicitGender) parsed.explicitGender = explicitGender;
      if (explicitId) parsed.explicitId = explicitId;
      pendingChildren.push(parsed);
      continue;
    }
  }

  // Enfants restants sans mère déclarée
  if (pendingChildren.length > 0) {
    result.childGroups.push({ mother: null, children: pendingChildren });
  }

  return result;
}

// --- Main ---
async function main() {
  const inputFile = process.argv[2] || resolve(__dirname, 'membres.txt');
  console.log(`\n Lecture de: ${inputFile}`);
  console.log(` Supabase: ${env.VITE_SUPABASE_URL}\n`);

  const data = parseInputFile(inputFile);

  // --- Résoudre le parent unique (si format "Les enfants de X") ---
  if (data.singleParent) {
    const ref = data.singleParent;
    let gender = ref.gender || null;

    if (!gender && ref.id) {
      const existing = await getMember(ref.id);
      if (existing) {
        gender = existing.gender;
        console.log(`Parent "${ref.fullName}" trouvé en base: ${gender === 'F' ? 'Femme' : 'Homme'}`);
      }
    }

    if (!gender) {
      gender = guessGender(parseName(ref.fullName).firstName);
    }

    if (gender === 'F') {
      data.contextMother = ref;
    } else {
      data.father = ref;
    }
  }

  // Résumé
  console.log('=== Résumé du fichier ===');
  if (data.grandMother) {
    console.log(`Grand-mère: ${data.grandMother.fullName} ${data.grandMother.id ? `(${data.grandMother.id})` : '(sans ID)'}`);
  }
  if (data.father) {
    console.log(`Père: ${data.father.fullName} ${data.father.id ? `(${data.father.id})` : '(sans ID)'}`);
  }
  for (const group of data.childGroups) {
    const motherRef = group.mother || data.contextMother;
    const motherLabel = motherRef
      ? `${motherRef.fullName} ${motherRef.id ? `(${motherRef.id})` : '(sans ID)'}${!group.mother && data.contextMother ? ' (contexte)' : ''}`
      : '(mère inconnue)';
    console.log(`\nMère: ${motherLabel}`);
    for (const child of group.children) {
      const surnom = child.alias ? ` dit ${child.alias}` : '';
      console.log(`  - ${child.firstName} ${child.lastName}${surnom}`);
    }
  }

  const confirm = await ask('\nGénérer les scripts SQL ? (O/n): ');
  if (confirm.toLowerCase() === 'n') {
    console.log('Annulé.');
    rl.close();
    return;
  }

  // --- En-tête SQL ---
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}h${String(now.getMinutes()).padStart(2, '0')}`;

  sqlLines.push(`-- ==========================================================================`);
  sqlLines.push(`-- IMPORT MEMBRES — Généré le ${now.toLocaleString('fr-FR')}`);
  sqlLines.push(`-- Source: ${inputFile}`);
  sqlLines.push(`-- ==========================================================================`);
  sqlLines.push(`-- Relations bidirectionnelles :`);
  sqlLines.push(`--   enfant.father_id -> père   ET  père.children[] += enfant`);
  sqlLines.push(`--   enfant.mother_ref -> mère  ET  mère.children[] += enfant`);
  sqlLines.push(`--   père.spouses[] += mère     ET  mère.spouses[] += père`);
  sqlLines.push(`-- ==========================================================================\n`);
  sqlLines.push(`BEGIN;\n`);

  rollbackLines.push(`-- ==========================================================================`);
  rollbackLines.push(`-- ROLLBACK IMPORT — Généré le ${now.toLocaleString('fr-FR')}`);
  rollbackLines.push(`-- Annule l'import de: ${inputFile}`);
  rollbackLines.push(`-- ==========================================================================\n`);
  rollbackLines.push(`BEGIN;\n`);

  // --- Résoudre le père ---
  console.log('\n=== Résolution des personnes de référence ===');

  let fatherMember = null;
  let fatherName = '';
  if (data.father) {
    const result = await resolveOrCreateParent(data.father, 'M');
    fatherMember = result.member;
    fatherName = result.name;
  }

  // --- Résoudre la grand-mère ---
  let grandMotherMember = null;
  if (data.grandMother) {
    const resolved = await resolvePerson(data.grandMother.fullName, data.grandMother.id);
    if (resolved) {
      grandMotherMember = resolved.member;
    }
  }

  // --- Résoudre la mère de contexte (variante "dont leur mère s'appelle") ---
  let contextMotherMember = null;
  let contextMotherName = '';
  if (data.contextMother) {
    const resolved = await resolvePerson(data.contextMother.fullName, data.contextMother.id);
    if (resolved) {
      contextMotherMember = resolved.member;
      contextMotherName = contextMotherMember.name;
    }
  }

  // Relation grand-mère -> père
  if (fatherMember && grandMotherMember) {
    if (!fatherMember.mother_ref || fatherMember.mother_ref !== grandMotherMember.id) {
      sqlComment(`Relation: ${grandMotherMember.name} est mère de ${fatherName}`);
      emitUpdateMotherRef(fatherMember.id, fatherName, grandMotherMember.id);
    }
    if (!(grandMotherMember.children || []).includes(fatherMember.id)) {
      emitAddChildToParent(grandMotherMember.id, grandMotherMember.name, fatherMember.id, fatherName);
    }
  }

  // Helper: résoudre ou créer un parent
  async function resolveOrCreateParent(personRef, gender) {
    const resolved = await resolvePerson(personRef.fullName, personRef.id);
    if (resolved) return { member: resolved.member, name: resolved.member.name };

    // Si un ID est fourni, ne pas créer — l'utiliser tel quel
    if (personRef.id) {
      console.log(`  !! ${personRef.fullName} (ID: ${personRef.id}) non trouvé en base — utilisé sans création`);
      const parsed = parseName(personRef.fullName);
      return {
        member: { id: personRef.id, ...parsed, gender, generation: 0, spouses: [], children: [] },
        name: parsed.name,
      };
    }

    // Pas d'ID : créer automatiquement
    console.log(`  Création automatique: ${personRef.fullName} (${gender === 'F' ? 'Femme' : 'Homme'})`);
    const parsed = parseName(personRef.fullName);
    const generation = fatherMember ? fatherMember.generation : (contextMotherMember ? contextMotherMember.generation : 4);
    const id = randomUUID();
    const member = { id, ...parsed, gender, generation, spouses: [], children: [] };
    sqlComment(`Création: ${parsed.name} (${gender})`);
    emitInsertMember({
      id,
      name: parsed.name,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      alias: parsed.alias || parsed.name,
      gender,
      generation,
      fatherId: null,
      motherRef: null,
    });
    return { member, name: parsed.name };
  }

  // --- Groupes d'enfants ---
  for (const group of data.childGroups) {
    let motherMember = null;
    let motherName = '';

    if (group.mother) {
      sqlComment(`=== Groupe: enfants avec mère ${group.mother.fullName} ===`);
      const result = await resolveOrCreateParent(group.mother, 'F');
      motherMember = result.member;
      motherName = result.name;
    } else if (contextMotherMember) {
      // Utiliser la mère de contexte (de la ligne "dont leur mère s'appelle")
      sqlComment(`=== Groupe: enfants avec mère de contexte ${contextMotherName} ===`);
      motherMember = contextMotherMember;
      motherName = contextMotherName;
    } else {
      sqlComment(`=== Groupe: enfants sans mère identifiée ===`);
    }

    // Conjoints bidirectionnels
    if (fatherMember && motherMember) {
      const fatherSpouses = fatherMember.spouses || [];
      if (!fatherSpouses.includes(motherMember.id)) {
        emitAddSpouse(fatherMember.id, fatherName, motherMember.id, motherName);
      }
    }

    // Enfants
    for (const child of group.children) {
      const fullChildName = `${child.firstName} ${child.lastName}`.trim();
      console.log(`\n  Traitement: ${fullChildName}${child.alias ? ` dit ${child.alias}` : ''}`);

      const resolved = await resolvePerson(fullChildName, child.explicitId || null);

      if (resolved) {
        // Personne existante -> mettre à jour les relations manquantes
        const existing = resolved.member;
        sqlComment(`Personne existante: ${existing.name} (${existing.id})`);

        if (fatherMember && !existing.father_id) {
          emitUpdateFatherId(existing.id, existing.name, fatherMember.id);
          emitAddChildToParent(fatherMember.id, fatherName, existing.id, existing.name);
        }
        if (motherMember && !existing.mother_ref) {
          emitUpdateMotherRef(existing.id, existing.name, motherMember.id);
          emitAddChildToParent(motherMember.id, motherName, existing.id, existing.name);
        }
      } else if (child.explicitId) {
        // ID fourni mais non trouvé en base — utiliser tel quel, ne PAS créer
        console.log(`  !! ID fourni (${child.explicitId}) non trouvé en base — utilisé sans création`);
        const childId = child.explicitId;
        sqlComment(`Personne avec ID fourni: ${fullChildName} (${childId})`);

        if (fatherMember) {
          emitAddChildToParent(fatherMember.id, fatherName, childId, fullChildName);
        }
        if (motherMember) {
          emitAddChildToParent(motherMember.id, motherName, childId, fullChildName);
        }
      } else {
        // Nouvelle personne — genre: explicite > heuristique > M par défaut
        const finalGender = child.explicitGender || guessGender(child.firstName);
        console.log(`  Genre: ${finalGender === 'F' ? 'Femme' : 'Homme'}${child.explicitGender ? ' (explicite)' : ''}`);

        const generation = fatherMember ? fatherMember.generation + 1 : 5;
        const id = randomUUID();
        const childAlias = child.alias || fullChildName;
        const childDisplayName = child.name;

        sqlComment(`Création: ${fullChildName}${child.alias ? ` dit ${child.alias}` : ''}`);
        emitInsertMember({
          id,
          name: childDisplayName,
          firstName: child.firstName,
          lastName: child.lastName,
          alias: childAlias,
          gender: finalGender,
          generation,
          fatherId: fatherMember?.id || null,
          motherRef: motherMember?.id || null,
        });

        // Relations bidirectionnelles parent -> enfant
        if (fatherMember) {
          emitAddChildToParent(fatherMember.id, fatherName, id, childDisplayName);
        }
        if (motherMember) {
          emitAddChildToParent(motherMember.id, motherName, id, childDisplayName);
        }
      }
    }
  }

  // --- Finaliser les fichiers SQL ---
  sqlLines.push(`\nCOMMIT;`);
  sqlLines.push(`\n-- ==========================================================================`);
  sqlLines.push(`-- ${createdIds.length} personne(s) créée(s)`);
  sqlLines.push(`-- Rollback disponible: rollback_${timestamp}.sql`);
  sqlLines.push(`-- ==========================================================================`);

  rollbackLines.push(`\nCOMMIT;`);
  rollbackLines.push(`\n-- ==========================================================================`);
  rollbackLines.push(`-- Rollback de ${createdIds.length} personne(s) créée(s)`);
  rollbackLines.push(`-- ==========================================================================`);

  // Écrire les fichiers
  const outputDir = resolve(__dirname, 'output');
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  const importPath = resolve(outputDir, `import_${timestamp}.sql`);
  const rollbackPath = resolve(outputDir, `rollback_${timestamp}.sql`);

  writeFileSync(importPath, sqlLines.join('\n') + '\n', 'utf-8');
  writeFileSync(rollbackPath, rollbackLines.join('\n') + '\n', 'utf-8');

  console.log(`\n=== Scripts SQL générés ===`);
  console.log(`  Import:   ${importPath}`);
  console.log(`  Rollback: ${rollbackPath}`);
  console.log(`  Personnes à créer: ${createdIds.length}`);
  console.log(`\nPour exécuter: copier le contenu de import_${timestamp}.sql dans le SQL Editor Supabase`);

  rl.close();
}

main().catch((err) => {
  console.error('Erreur:', err);
  rl.close();
  process.exit(1);
});
