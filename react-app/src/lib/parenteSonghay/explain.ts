// react-app/src/lib/parenteSonghay/explain.ts
import type { Relation } from './types';

type Labels = Record<string, string>;

function interpolate(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, key) => (key in vars ? String(vars[key]) : `{${key}}`));
}

function pickTemplate(r: Relation, L: Labels): string {
  switch (r.kind) {
    case 'direct-descendant':
      return r.distanceB === 1 ? L['explain.direct-descendant.parent'] : L['explain.direct-descendant.ancestor'];
    case 'direct-ascendant':
      return r.distanceA === 1 ? L['explain.direct-ascendant.child'] : L['explain.direct-ascendant.descendant'];
    case 'parallel':
      return L['explain.parallel'];
    case 'cross':
      return L['explain.cross'];
    case 'avuncular': {
      const term = r.termForA === L['term.hassa'] || r.termForB === L['term.hassa']
        ? 'hassa'
        : r.termForA === L['term.hawa'] || r.termForB === L['term.hawa']
        ? 'hawa'
        : 'parallel';
      if (term === 'hassa') return L['explain.avuncular.hassa'];
      if (term === 'hawa') return L['explain.avuncular.hawa'];
      return L['explain.avuncular.parallel'];
    }
    case 'distant-vertical':
      return L['explain.distant-vertical'];
  }
}

export function explainRelation(r: Relation, nameA: string, nameB: string, L: Labels): string {
  const tpl = pickTemplate(r, L);
  const lcaCouple = r.viaSpouse ? `${r.viaName} & ${r.viaSpouse.name}` : r.viaName;
  return interpolate(tpl, {
    nameA, nameB,
    termA: r.termForA, termB: r.termForB,
    lca: r.viaName,
    lcaCouple,
    dA: r.distanceA, dB: r.distanceB,
  });
}
