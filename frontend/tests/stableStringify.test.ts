import { stableStringify } from '../app/lib/utils/stableStringify';

describe('stableStringify', () => {
  test('produces stable output regardless of key order', () => {
    const a = { b: 1, a: 2, nested: { z: 9, y: 8 } };
    const b = { a: 2, nested: { y: 8, z: 9 }, b: 1 };
    expect(stableStringify(a)).toEqual(stableStringify(b));
  });

  test('preserves array order while stabilizing object keys', () => {
    const a = [{ b: 1, a: 2 }, { d: 4, c: 3 }];
    const b = [{ a: 2, b: 1 }, { c: 3, d: 4 }];
    expect(stableStringify(a)).toEqual(stableStringify(b));
  });
});
