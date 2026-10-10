import { describe, expect, it } from 'vitest';
import { computeStatusCounts, statusColor, statusLabel } from '@/lib/status';
import { DEFAULT_STAFF } from '@/data/staff';

describe('computeStatusCounts', () => {
  it('counts 4 working, 2 idle, 1 offline over 7 staff', () => {
    expect(computeStatusCounts(DEFAULT_STAFF)).toEqual({
      working: 4,
      idle: 2,
      offline: 1,
      total: 7,
    });
  });
});

describe('statusColor', () => {
  it('maps each status to its color', () => {
    expect(statusColor('working')).toBe('#22c55e');
    expect(statusColor('idle')).toBe('#f59e0b');
    expect(statusColor('offline')).toBe('#9ca3af');
  });
});

describe('statusLabel', () => {
  it('maps each status to its Vietnamese label', () => {
    expect(statusLabel('working')).toBe('Đang làm');
    expect(statusLabel('idle')).toBe('Rảnh');
    expect(statusLabel('offline')).toBe('Offline');
  });
});
