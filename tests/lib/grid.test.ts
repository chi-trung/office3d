import { describe, expect, it } from 'vitest';
import { workstationPosition } from '@/lib/grid';

describe('workstationPosition', () => {
  it('index 0 is first row, first col', () => {
    expect(workstationPosition(0)).toEqual({ x: -5.4, z: -2.4, row: 0, col: 0 });
  });

  it('index 4 starts a new row', () => {
    expect(workstationPosition(4)).toEqual({ x: -5.4, z: 2.4, row: 1, col: 0 });
  });

  it('index 7 is last seat of second row', () => {
    expect(workstationPosition(7)).toEqual({ x: 5.4, z: 2.4, row: 1, col: 3 });
  });

  it('index 8 opens a new row without colliding', () => {
    const pos = workstationPosition(8);
    expect(pos.row).toBe(2);
    expect(pos.col).toBe(0);
    const firstEight = new Set(
      Array.from({ length: 8 }, (_, i) => {
        const p = workstationPosition(i);
        return `${p.x},${p.z}`;
      }),
    );
    expect(firstEight.has(`${pos.x},${pos.z}`)).toBe(false);
  });
});
