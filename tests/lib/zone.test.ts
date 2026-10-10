import { describe, expect, it } from 'vitest';
import { zoneColorFor } from '@/lib/zone';
import { TEAMS } from '@/data/staff';
import type { TeamId } from '@/types';

describe('zoneColorFor', () => {
  it('returns the team color for a known team', () => {
    expect(zoneColorFor('product', TEAMS)).toBe('#7fb3e8');
  });

  it('falls back to #cccccc for an unknown team id', () => {
    expect(zoneColorFor('marketing' as TeamId, TEAMS)).toBe('#cccccc');
  });
});
