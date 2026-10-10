import { describe, expect, it } from 'vitest';
import { initialsOf, validateStaffForm } from '@/lib/staffForm';
import type { StaffFormValues } from '@/lib/staffForm';

const valid: StaffFormValues = {
  name: 'Nguyễn Văn An',
  role: 'Frontend Dev',
  teamId: 'engineering',
  status: 'working',
  jiraUrl: '#',
};

describe('validateStaffForm', () => {
  it('rejects an empty name', () => {
    const res = validateStaffForm({ ...valid, name: '   ' });
    expect(res.ok).toBe(false);
    expect(res.errors.name).toBeTruthy();
  });

  it('rejects an empty role', () => {
    const res = validateStaffForm({ ...valid, role: '' });
    expect(res.ok).toBe(false);
    expect(res.errors.role).toBeTruthy();
  });

  it('accepts an empty jiraUrl', () => {
    expect(validateStaffForm({ ...valid, jiraUrl: '' }).ok).toBe(true);
  });

  it('rejects a jiraUrl that is neither http nor #', () => {
    const res = validateStaffForm({ ...valid, jiraUrl: 'not-a-link' });
    expect(res.ok).toBe(false);
    expect(res.errors.jiraUrl).toBeTruthy();
  });

  it('accepts a fully valid form', () => {
    expect(validateStaffForm(valid)).toEqual({ ok: true, errors: {} });
  });
});

describe('initialsOf', () => {
  it('takes first and last word initials', () => {
    expect(initialsOf('Nguyễn Văn An')).toBe('NA');
  });

  it('handles a single word', () => {
    expect(initialsOf('An')).toBe('A');
  });
});
