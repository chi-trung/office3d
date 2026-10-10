import { describe, expect, it } from 'vitest';
import { mapPercentToDistance, mapZoomToPercent } from '@/lib/zoom';

describe('mapZoomToPercent', () => {
  it('nearest distance is 100%', () => {
    expect(mapZoomToPercent(12)).toBe(100);
  });

  it('farthest distance is 51%', () => {
    expect(mapZoomToPercent(45)).toBe(51);
  });

  it('mid distance stays strictly between 51 and 100', () => {
    const mid = mapZoomToPercent(28.5);
    expect(mid).toBeGreaterThan(51);
    expect(mid).toBeLessThan(100);
  });
});

describe('zoom round trip', () => {
  it('distance → percent → distance stays within 1 unit', () => {
    for (const d of [12, 20, 28.5, 33, 45]) {
      const back = mapPercentToDistance(mapZoomToPercent(d));
      expect(Math.abs(back - d)).toBeLessThan(1);
    }
  });
});
