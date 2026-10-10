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
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (!isStaffArray(parsed)) return fallback;
    return parsed;
  } catch {
    // Broken JSON, private mode, or storage access errors.
    return fallback;
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
