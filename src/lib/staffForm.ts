// Staff form values, validation and name initials.

import type { StaffStatus, TeamId } from '@/types';

export interface StaffFormValues {
  name: string;
  role: string;
  teamId: TeamId;
  status: StaffStatus;
  jiraUrl: string;
}

export type StaffFormErrors = Partial<Record<'name' | 'role' | 'jiraUrl', string>>;

export function validateStaffForm(v: StaffFormValues): { ok: boolean; errors: StaffFormErrors } {
  const errors: StaffFormErrors = {};
  if (!v.name.trim()) errors.name = 'Vui lòng nhập tên';
  if (!v.role.trim()) errors.role = 'Vui lòng nhập vai trò';
  const url = v.jiraUrl.trim();
  if (url && !url.startsWith('http') && !url.startsWith('#')) {
    errors.jiraUrl = 'Liên kết Jira không hợp lệ';
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

// First + last word initials, e.g. 'Nguyễn Văn An' -> 'NA'.
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0][0].toUpperCase();
  if (parts.length === 1) return first;
  return first + parts[parts.length - 1][0].toUpperCase();
}
