export const genColors: Record<number, string> = {
  0: '#9333ea',
  1: '#f59e0b',
  2: '#10b981',
  3: '#6366f1',
  4: '#ec4899',
  5: '#8b5cf6',
  6: '#14b8a6',
  7: '#f97316',
};

export const genNames: Record<number, string> = {
  0: 'Ancetre',
  1: '1ere',
  2: '2eme',
  3: '3eme',
  4: '4eme',
  5: '5eme',
  6: '6eme',
  7: '7eme',
};

// Note: roots IDs are now UUIDs after migration
// The app will dynamically find the root person by name/generation
export const ROOT_NAMES = [
  'Alkamahamane',
  'Ali Alkamahamane',
  'Mahamane',
  'Babachigaw',
  'Kobbo',
  'Moussa',
  'Omorou',
  'Tamimoune',
  'Mahadi',
  'Goussoumbi',
  'Hamatou Lassane',
];

/**
 * Numéro WhatsApp pour les demandes d'activation de compte
 * Format: code pays + numéro sans espaces ni caractères spéciaux
 * Exemple: '33612345678' pour +33 6 12 34 56 78
 */
export const WHATSAPP_ACTIVATION_NUMBER = '33662992985'; // TODO: Remplacer par le vrai numéro
