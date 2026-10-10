// Staff status counts and display helpers.

import type { Staff, StaffStatus } from '@/types';

const STATUS_COLORS: Record<StaffStatus, string> = {
  working: '#22c55e',
  idle: '#f59e0b',
  offline: '#9ca3af',
};

const STATUS_LABELS: Record<StaffStatus, string> = {
  working: 'Đang làm',
  idle: 'Rảnh',
  offline: 'Offline',
};

export function computeStatusCounts(staff: Pick<Staff, 'status'>[]): {
  working: number;
  idle: number;
  offline: number;
  total: number;
} {
  const counts = { working: 0, idle: 0, offline: 0, total: 0 };
  for (const member of staff) {
    counts[member.status] += 1;
    counts.total += 1;
  }
  return counts;
}

export function statusColor(status: StaffStatus): string {
  return STATUS_COLORS[status];
}

export function statusLabel(status: StaffStatus): string {
  return STATUS_LABELS[status];
}
