// react-app/src/lib/parenteSonghay/applyLabels.ts
import { defaultLabels } from './labels';

/**
 * Merge des overrides par-dessus les libellés par défaut.
 * Les clés inconnues dans les défauts sont ignorées silencieusement
 * (résilience : un override orphelin ne casse pas le dict).
 */
export function applyLabels(
  overrides: Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = { ...defaultLabels };
  for (const key of Object.keys(overrides)) {
    if (key in defaultLabels) {
      result[key] = overrides[key];
    }
  }
  return result;
}
