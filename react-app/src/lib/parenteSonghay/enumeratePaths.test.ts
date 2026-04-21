// react-app/src/lib/parenteSonghay/enumeratePaths.test.ts
import { describe, it, expect } from 'vitest';
import { enumeratePaths } from './enumeratePaths';
import type { PersonDict } from './types';

const tiny: PersonDict = {
  me:     { id: 'me',     name: 'Me',     sex: 'M', fatherId: 'dad', motherId: 'mom' },
  dad:    { id: 'dad',    name: 'Dad',    sex: 'M', fatherId: 'gpa', motherId: null  },
  mom:    { id: 'mom',    name: 'Mom',    sex: 'F', fatherId: null,  motherId: null  },
  gpa:    { id: 'gpa',    name: 'Gpa',    sex: 'M', fatherId: null,  motherId: null  },
};

describe('enumeratePaths', () => {
  it('includes the person herself as distance-0 path', () => {
    const paths = enumeratePaths('me', tiny);
    const selfPath = paths.find(p => p.ancestor === 'me');
    expect(selfPath).toBeDefined();
    expect(selfPath!.hops).toEqual([]);
  });

  it('finds father with P hop', () => {
    const paths = enumeratePaths('me', tiny);
    const dad = paths.find(p => p.ancestor === 'dad');
    expect(dad?.hops).toEqual(['P']);
  });

  it('finds mother with M hop', () => {
    const paths = enumeratePaths('me', tiny);
    const mom = paths.find(p => p.ancestor === 'mom');
    expect(mom?.hops).toEqual(['M']);
  });

  it('finds grandfather through father', () => {
    const paths = enumeratePaths('me', tiny);
    const gpa = paths.find(p => p.ancestor === 'gpa');
    expect(gpa?.hops).toEqual(['P', 'P']);
  });

  it('respects max_depth and protects against cycles', () => {
    const cyclic: PersonDict = {
      a: { id: 'a', name: 'A', sex: 'M', fatherId: 'b', motherId: null },
      b: { id: 'b', name: 'B', sex: 'M', fatherId: 'a', motherId: null },
    };
    const paths = enumeratePaths('a', cyclic, 5);
    expect(paths.length).toBeLessThanOrEqual(6);
  });

  it('enumerates all branches when both parents set', () => {
    const paths = enumeratePaths('me', tiny);
    const ancestors = paths.map(p => p.ancestor).sort();
    expect(ancestors).toEqual(['dad', 'gpa', 'me', 'mom']);
  });
});
