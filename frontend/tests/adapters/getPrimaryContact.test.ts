import { getPrimaryContact } from '../../app/lib/text-extraction/pdf';

describe('getPrimaryContact', () => {
  test('picks first email and phone when present', () => {
    const res = getPrimaryContact({ emails: ['a@x.com', 'b@x.com'], phones: ['123', '456'] });
    expect(res.primaryEmail).toBe('a@x.com');
    expect(res.primaryPhone).toBe('123');
  });

  test('handles missing emails', () => {
    const res = getPrimaryContact({ emails: [], phones: ['999'] });
    expect(res.primaryEmail).toBeNull();
    expect(res.primaryPhone).toBe('999');
  });

  test('handles missing phones', () => {
    const res = getPrimaryContact({ emails: ['z@x.com'], phones: [] });
    expect(res.primaryEmail).toBe('z@x.com');
    expect(res.primaryPhone).toBeNull();
  });

  test('handles no contacts', () => {
    const res = getPrimaryContact({ emails: [], phones: [] });
    expect(res.primaryEmail).toBeNull();
    expect(res.primaryPhone).toBeNull();
  });
});
