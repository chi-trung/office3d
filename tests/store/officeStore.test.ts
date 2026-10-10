// Office store state and actions.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOfficeStore } from '@/store/officeStore';
import { DEFAULT_STAFF } from '@/data/staff';
import type { Staff } from '@/types';

const get = () => useOfficeStore.getState();

const makeStaff = (id: string, name = id): Staff => ({
  ...DEFAULT_STAFF[0],
  id,
  name,
});

describe('useOfficeStore defaults', () => {
  it('matches controller ruling R1 defaults', async () => {
    // Fresh module so earlier mutations cannot leak in.
    vi.resetModules();
    const mod = await import('@/store/officeStore');
    const s = mod.useOfficeStore.getState();
    expect(s.staff).toEqual([]);
    expect(s.selectedId).toBeNull();
    expect(s.filterTeamId).toBeNull();
    expect(s.viewMode).toBe('3d');
    expect(s.theme).toBe('day');
    expect(s.hireOpen).toBe(false);
    expect(s.zoomPercent).toBe(51);
  });
});

describe('useOfficeStore staff actions', () => {
  beforeEach(() => {
    get().resetStaff();
    get().select(null);
    get().setFilter(null);
  });

  it('resetStaff sets staff to a copy of DEFAULT_STAFF', () => {
    get().resetStaff();
    const { staff } = get();
    expect(staff).toEqual(DEFAULT_STAFF);
    expect(staff).not.toBe(DEFAULT_STAFF);
  });

  it('setStaff replaces the whole list', () => {
    const list = [makeStaff('a'), makeStaff('b')];
    get().setStaff(list);
    expect(get().staff).toEqual(list);
  });

  it('addStaff appends one item', () => {
    const before = get().staff.length;
    get().addStaff(makeStaff('new1'));
    expect(get().staff.length).toBe(before + 1);
    expect(get().staff.at(-1)?.id).toBe('new1');
  });

  it('updateStaff patches by id', () => {
    const target = get().staff[0];
    get().updateStaff(target.id, { name: 'Renamed' });
    expect(get().staff[0].name).toBe('Renamed');
    expect(get().staff[0].id).toBe(target.id);
  });

  it('updateStaff ignores unknown ids', () => {
    const before = get().staff;
    get().updateStaff('missing', { name: 'Nope' });
    expect(get().staff).toEqual(before);
  });

  it('removeStaff drops by id and clears a matching selection', () => {
    const id = get().staff[0].id;
    get().select(id);
    get().removeStaff(id);
    expect(get().staff.some((s) => s.id === id)).toBe(false);
    expect(get().selectedId).toBeNull();
  });

  it('removeStaff keeps an unrelated selection', () => {
    get().select('kept');
    get().removeStaff(get().staff[0].id);
    expect(get().selectedId).toBe('kept');
  });
});

describe('useOfficeStore ui actions', () => {
  beforeEach(() => {
    get().select(null);
    get().setFilter(null);
  });

  it('select stores then clears', () => {
    get().select('x');
    expect(get().selectedId).toBe('x');
    get().setStaff([makeStaff('x')]);
    get().select(null);
    expect(get().selectedId).toBeNull();
  });

  it('setFilter stores then clears', () => {
    get().setFilter('product');
    expect(get().filterTeamId).toBe('product');
    get().setFilter(null);
    expect(get().filterTeamId).toBeNull();
  });

  it('setViewMode, setTheme, setHireOpen, setZoomPercent update state', () => {
    get().setViewMode('2d');
    expect(get().viewMode).toBe('2d');
    get().setViewMode('3d');
    expect(get().viewMode).toBe('3d');

    get().setTheme('night');
    expect(get().theme).toBe('night');
    get().setTheme('day');
    expect(get().theme).toBe('day');

    get().setHireOpen(true);
    expect(get().hireOpen).toBe(true);
    get().setHireOpen(false);
    expect(get().hireOpen).toBe(false);

    get().setZoomPercent(80);
    expect(get().zoomPercent).toBe(80);
    get().setZoomPercent(51);
    expect(get().zoomPercent).toBe(51);
  });
});
