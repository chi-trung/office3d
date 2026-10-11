// localStorage persistence for the staff list.

import type { Staff } from '@/types';

export const STORAGE_KEY = 'office3d-staff-v1';

// Minimal runtime check: array of objects with string id + name.
function isStaffArray(value: unknown): value is Staff[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as { id?: unknown }).id === 'string' &&
        typeof (item as { name?: unknown }).name === 'string',
    )
  );
}

export function loadStaff(fallback: Staff[]): Staff[] {
  return loadStaffDetailed(fallback).staff;
}

export interface StaffLoadResult {
  staff: Staff[];
  storageBlocked: boolean;
}

// Same as loadStaff, but reports whether the fallback came from a storage
// failure (blocked access in private mode, or an unreadable payload).
// Callers use the flag for the spec's "báo nhẹ" notice; a merely empty or
// wrong-shaped value is not a failure.
export function loadStaffDetailed(fallback: Staff[]): StaffLoadResult {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return { staff: fallback, storageBlocked: false };
    const parsed: unknown = JSON.parse(raw);
    if (!isStaffArray(parsed)) return { staff: fallback, storageBlocked: false };
    return { staff: parsed, storageBlocked: false };
  } catch {
    // Blocked storage access or unreadable payload.
    return { staff: fallback, storageBlocked: true };
  }
}

export function saveStaff(staff: Staff[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(staff));
    return true;
  } catch {
    // Quota exceeded or storage unavailable.
    return false;
  }
}
