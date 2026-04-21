// react-app/src/lib/parenteSonghay/fixtures/testFamily.ts
import type { PersonDict } from '../types';

/**
 * Arbre de référence du spec algorithme-parente-songhay.md §6.
 * 28 personnes sur 7 générations, incluant des unions intergénérationnelles
 * (Cheick a 2 chemins vers Sira) et des branches parallèle/croisée.
 */
export function makeTestFamily(): PersonDict {
  const p = (id: string, name: string, sex: 'M' | 'F', fatherId: string | null, motherId: string | null) =>
    ({ id, name, sex, fatherId, motherId });

  const dict: PersonDict = {};
  const add = (...persons: ReturnType<typeof p>[]) => {
    for (const person of persons) dict[person.id] = person;
  };

  // G0
  add(p('sira', 'Sira', 'F', null, null));

  // G1 — enfants de Sira
  add(
    p('modibo', 'Modibo', 'M', null, 'sira'),
    p('hadja',  'Hadja',  'F', null, 'sira'),
  );

  // G2 — enfants de Modibo
  add(
    p('drissa', 'Drissa', 'M', 'modibo', null),
    p('sekou',  'Sékou',  'M', 'modibo', null),
    p('awa',    'Awa',    'F', 'modibo', null),
  );

  // G2 — enfants de Hadja
  add(
    p('bourama',  'Bourama',  'M', null, 'hadja'),
    p('tieman',   'Tiéman',   'M', null, 'hadja'),
    p('niamoye',  'Niamoye',  'F', null, 'hadja'),
  );

  // G3 — enfants de Sékou
  add(
    p('bakary',  'Bakary',  'M', 'sekou', null),
    p('adama',   'Adama',   'M', 'sekou', null),
    p('djeneba', 'Djéneba', 'F', 'sekou', null),
  );

  // G3 — enfants de Awa
  add(p('khadidia', 'Khadidia', 'F', null, 'awa'));

  // G3 — enfants de Tiéman
  add(
    p('koniba', 'Koniba', 'M', 'tieman', null),
  );

  // G3 — enfants de Niamoye
  add(p('mariam', 'Mariam', 'F', null, 'niamoye'));

  // Cheick : fils de Bourama (père, branche Hadja) et Djéneba (mère, branche Sékou) — double chemin vers Sira.
  add(p('cheick', 'Cheick', 'M', 'bourama', 'djeneba'));

  // G4 — enfants de Bakary
  add(p('lassana', 'Lassana', 'M', 'bakary', null));

  // G4 — enfants de Koniba
  add(
    p('yaya',  'Yaya',  'M', 'koniba', null),
    p('lalla', 'Lalla', 'F', 'koniba', null),
  );

  // G4 — enfants de Cheick
  add(p('aissata', 'Aïssata', 'F', 'cheick', null));

  // G4 — enfants de Djéneba (Rokia)
  add(p('rokia', 'Rokia', 'F', null, 'djeneba'));

  // G5 — enfants de Lassana
  add(
    p('soumaila', 'Soumaïla', 'M', 'lassana', null),
    p('assa',     'Assa',     'F', 'lassana', null),
  );

  // G5 — enfants de Yaya / Lalla
  add(p('maimouna', 'Maïmouna', 'F', 'yaya', null));

  // G5 — enfants de Rokia
  add(p('issouf', 'Issouf', 'M', null, 'rokia'));

  // G6 — enfants de Soumaïla
  add(
    p('boubou', 'Boubou', 'M', 'soumaila', null),
    p('safi',   'Safi',   'F', 'soumaila', null),
  );

  // G6 — enfants de Issouf
  add(p('nene', 'Néné', 'F', 'issouf', null));

  return dict;
}
