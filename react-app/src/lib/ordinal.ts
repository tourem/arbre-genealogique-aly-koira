/**
 * Formate un ordinal français avec exposant typographique unicode.
 * - n=1, gender='M' → "1ᵉʳ"
 * - n=1, gender='F' → "1ʳᵉ"
 * - n≥2 → "Nᵉ"  (ex: "2ᵉ", "10ᵉ")
 *
 * Les caractères ᵉ / ʳᵉ / ᵉʳ sont des superscripts unicode utilisables
 * directement dans un texte JSX sans balise <sup>.
 */
export function formatOrdinal(n: number, gender: 'M' | 'F'): string {
  if (n <= 0) return String(n);
  if (n === 1) return gender === 'M' ? '1ᵉʳ' : '1ʳᵉ';
  return `${n}ᵉ`;
}
