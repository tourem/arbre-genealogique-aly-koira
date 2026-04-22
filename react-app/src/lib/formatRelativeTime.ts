// Abreviations officielles FR. "août", "juin", "mai" n'ont pas d'abrev. traditionnelle
// et s'ecrivent en toutes lettres ; on conserve ce choix pour la lisibilite.
const MONTH_SHORT_FR = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

/**
 * Formatage FR d'une difference de temps entre `ts` et `now`.
 *
 * Table :
 *   - < 60s       : "à l'instant"
 *   - < 60min     : "il y a N min"
 *   - < 24h       : "il y a N h"
 *   - < 48h       : "hier"
 *   - < 7 jours   : "il y a N jours"
 *   - >= 7 jours  : "le D mois" (ex. "le 15 avr.", "le 1 août")
 *
 * Passe `now` en parametre pour etre testable sans mock de Date.
 */
export function formatRelativeTime(ts: number, now: number = Date.now()): string {
  const deltaMs = now - ts;
  const deltaSec = Math.floor(deltaMs / 1000);
  const deltaMin = Math.floor(deltaSec / 60);
  const deltaH = Math.floor(deltaMin / 60);
  const deltaDays = Math.floor(deltaH / 24);

  if (deltaSec < 60) return "à l'instant";
  if (deltaMin < 60) return `il y a ${deltaMin} min`;
  if (deltaH < 24) return `il y a ${deltaH} h`;
  if (deltaH < 48) return 'hier';
  if (deltaDays < 7) return `il y a ${deltaDays} jours`;

  const d = new Date(ts);
  const day = d.getDate();
  const month = MONTH_SHORT_FR[d.getMonth()];
  return `le ${day} ${month}`;
}
