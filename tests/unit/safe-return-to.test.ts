import { describe, expect, it } from 'vitest';
import { safeReturnTo } from '../../src/lib/safe-return-to';

describe('local login return destinations', () => {
  it.each(['/dashboard/projects/123/contracts?view=recent', '/onboarding?invite=qa%20token', '/dashboard#summary'])('preserves path, query and fragment: %s', (path) => {
    expect(safeReturnTo(path)).toBe(path);
  });
  it.each([null, '', 'https://qa.invalid/escape', '//qa.invalid/escape', '/\\qa.invalid/escape', '/\t/qa.invalid/escape', '/\n/qa.invalid/escape'])('rejects invalid or normalized external input: %s', (path) => {
    expect(safeReturnTo(path)).toBe('/dashboard');
  });
});
