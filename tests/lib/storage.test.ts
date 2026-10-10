// Staff localStorage persistence helpers.

import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_KEY, loadStaff, saveStaff } from '@/lib/storage';
import { DEFAULT_STAFF } from '@/data/staff';
import type { Staff } from '@/types';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('exposes the expected storage key', () => {
    expect(STORAGE_KEY).toBe('office3d-staff-v1');
  });

  it('save then load returns a deep-equal copy', () => {
    expect(saveStaff(DEFAULT_STAFF)).toBe(true);
    const loaded = loadStaff([]);
    expect(loaded).toEqual(DEFAULT_STAFF);
    expect(loaded).not.toBe(DEFAULT_STAFF);
  });

  it('load returns fallback when nothing is stored', () => {
    expect(loadStaff(DEFAULT_STAFF)).toEqual(DEFAULT_STAFF);
  });

  it('load returns fallback on broken JSON without throwing', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json{{{');
    expect(() => loadStaff(DEFAULT_STAFF)).not.toThrow();
    expect(loadStaff(DEFAULT_STAFF)).toEqual(DEFAULT_STAFF);
  });

  it('load returns fallback when value is not an array', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: 's1' }));
    expect(loadStaff(DEFAULT_STAFF)).toEqual(DEFAULT_STAFF);
  });

  it('load returns fallback when an item misses id or name', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: 's1' }, { name: 'No id' }]),
    );
    expect(loadStaff(DEFAULT_STAFF)).toEqual(DEFAULT_STAFF);
  });

  it('save returns false when setItem throws', () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error('quota exceeded');
    };
    try {
      expect(saveStaff(DEFAULT_STAFF)).toBe(false);
    } finally {
      Storage.prototype.setItem = original;
    }
  });

  it('load survives a getItem that throws', () => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = () => {
      throw new Error('private mode');
    };
    try {
      expect(loadStaff(DEFAULT_STAFF)).toEqual(DEFAULT_STAFF);
    } finally {
      Storage.prototype.getItem = original;
    }
  });

  it('round-trips a custom staff list', () => {
    const custom: Staff[] = [
      {
        ...DEFAULT_STAFF[0],
        id: 'x1',
        name: 'Custom',
      },
    ];
    expect(saveStaff(custom)).toBe(true);
    expect(loadStaff([])).toEqual(custom);
  });
});
