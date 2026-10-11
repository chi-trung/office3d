// Staff id factory: randomUUID where available, fallback otherwise.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { newStaffId } from '@/lib/newId';

describe('newStaffId', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a non-empty id', () => {
    expect(newStaffId().length).toBeGreaterThan(0);
  });

  it('returns a different id on each call', () => {
    expect(newStaffId()).not.toBe(newStaffId());
  });

  it('falls back to a staff- prefixed id without crypto.randomUUID', () => {
    vi.stubGlobal('crypto', {});
    const id = newStaffId();
    expect(id.startsWith('staff-')).toBe(true);
    expect(id.length).toBeGreaterThan('staff-'.length);
  });
});
