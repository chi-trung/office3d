// Modal for adding a new staff member or editing the selected one.
// Closes on Esc, backdrop click, × or a successful submit; closing keeps
// the current selection (StaffCard stays as-is).

import { useEffect, useState, type FormEvent, type MouseEvent, type ReactElement } from 'react';
import { TEAMS } from '@/data/staff';
import { newStaffId } from '@/lib/newId';
import { validateStaffForm, type StaffFormErrors, type StaffFormValues } from '@/lib/staffForm';
import { statusLabel } from '@/lib/status';
import { MAX_STAFF } from '@/scene/world';
import { useOfficeStore } from '@/store/officeStore';
import type { CharacterSpec, Staff, StaffStatus, TeamId } from '@/types';

const SHIRT_COLORS: readonly string[] = [
  '#7fb3e8',
  '#b48ce8',
  '#5c7a99',
  '#f2a3c0',
  '#8fd6a8',
  '#e8e8e8',
  '#3c6e71',
];
const SKIN_TONES: readonly string[] = [
  '#e8c39e',
  '#d9a56c',
  '#f0c8a0',
  '#f5d0b0',
  '#c68642',
  '#ffdbac',
  '#8d5524',
];
const HAIR_COLORS: readonly string[] = [
  '#3b2a1e',
  '#1c1c1c',
  '#6b4423',
  '#4a2c2a',
  '#2b2b2b',
  '#c2703e',
  '#0f0f0f',
];
const PANTS_COLORS: readonly string[] = [
  '#2f3542',
  '#3d3d3d',
  '#222831',
  '#5a4a68',
  '#40532c',
  '#292929',
];
const HAIR_STYLES: readonly CharacterSpec['hairStyle'][] = ['bald', 'short', 'cap', 'long'];
const ACCESSORIES: readonly CharacterSpec['accessory'][] = ['none', 'glasses', 'lanyard'];

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

// Random look; prefers a shirt color no teammate already wears.
function randomLook(staff: readonly Staff[], teamId: TeamId): CharacterSpec {
  const used = new Set(
    staff.filter((m) => m.teamId === teamId).map((m) => m.look.shirtColor),
  );
  const available = SHIRT_COLORS.filter((color) => !used.has(color));
  const pool = available.length > 0 ? available : SHIRT_COLORS;
  return {
    skinTone: pick(SKIN_TONES),
    hairColor: pick(HAIR_COLORS),
    hairStyle: pick(HAIR_STYLES),
    accessory: pick(ACCESSORIES),
    shirtColor: pick(pool),
    pantsColor: pick(PANTS_COLORS),
  };
}

export default function HireDialog(): ReactElement {
  const staff = useOfficeStore((s) => s.staff);
  const selectedId = useOfficeStore((s) => s.selectedId);
  const setHireOpen = useOfficeStore((s) => s.setHireOpen);
  const addStaff = useOfficeStore((s) => s.addStaff);
  const updateStaff = useOfficeStore((s) => s.updateStaff);

  // The dialog mounts fresh on open, so the selection is snapshotted once:
  // edit mode when a member is selected, add mode otherwise.
  const member = staff.find((m) => m.id === selectedId) ?? null;
  const [editId] = useState<string | null>(() => member?.id ?? null);
  const [values, setValues] = useState<StaffFormValues>(() =>
    member === null
      ? { name: '', role: '', teamId: 'product', status: 'working', jiraUrl: '' }
      : {
          name: member.name,
          role: member.role,
          teamId: member.teamId,
          status: member.status,
          jiraUrl: member.jiraUrl,
        },
  );
  const [errors, setErrors] = useState<StaffFormErrors>({});
  // Add-mode only: the room has MAX_STAFF seats, so a full room blocks the
  // submit (edit mode is unaffected). Shown after a blocked attempt.
  const [fullNotice, setFullNotice] = useState(false);
  const atCapacity = editId === null && staff.length >= MAX_STAFF;

  // Capture-phase so Escape closes the dialog without StaffCard (which also
  // listens for Escape) clearing the selection.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setHireOpen(false);
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [setHireOpen]);

  const change = <K extends keyof StaffFormValues>(key: K, value: StaffFormValues[K]): void => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (key === 'name' || key === 'role' || key === 'jiraUrl') {
        return { ...prev, [key]: undefined };
      }
      return prev;
    });
  };

  const close = (): void => setHireOpen(false);

  // stopPropagation keeps StaffCard's outside-click handler from clearing
  // the selection while the dialog is open.
  const stopDown = (e: MouseEvent): void => e.stopPropagation();

  const onSubmit = (e: FormEvent): void => {
    e.preventDefault();
    if (atCapacity) {
      setFullNotice(true);
      return;
    }
    const result = validateStaffForm(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    const common = {
      name: values.name.trim(),
      role: values.role.trim(),
      teamId: values.teamId,
      status: values.status,
      jiraUrl: values.jiraUrl.trim(),
    };
    if (editId !== null) {
      updateStaff(editId, common);
    } else {
      addStaff({
        id: newStaffId(),
        ...common,
        look: randomLook(staff, values.teamId),
      });
    }
    setHireOpen(false);
  };

  const title = editId !== null ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên';

  return (
    <div
      className="hire-backdrop"
      onMouseDown={(e) => {
        e.stopPropagation();
        close();
      }}
    >
      <div
        className="hire-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={stopDown}
      >
        <button
          type="button"
          className="hire-close"
          aria-label="Đóng"
          onClick={close}
        >
          ×
        </button>
        <h2 className="hire-title">{title}</h2>
        <form onSubmit={onSubmit} noValidate>
          <div className="hire-field">
            <label htmlFor="hire-name">Tên</label>
            <input
              id="hire-name"
              type="text"
              value={values.name}
              autoFocus
              onChange={(e) => change('name', e.target.value)}
            />
            {errors.name ? <span className="hire-error">{errors.name}</span> : null}
          </div>
          <div className="hire-field">
            <label htmlFor="hire-role">Vai trò</label>
            <input
              id="hire-role"
              type="text"
              value={values.role}
              onChange={(e) => change('role', e.target.value)}
            />
            {errors.role ? <span className="hire-error">{errors.role}</span> : null}
          </div>
          <div className="hire-field">
            <label htmlFor="hire-team">Đội</label>
            <select
              id="hire-team"
              value={values.teamId}
              onChange={(e) => change('teamId', e.target.value as TeamId)}
            >
              {TEAMS.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.icon} {team.name}
                </option>
              ))}
            </select>
          </div>
          <div className="hire-field">
            <label htmlFor="hire-status">Trạng thái</label>
            <select
              id="hire-status"
              value={values.status}
              onChange={(e) => change('status', e.target.value as StaffStatus)}
            >
              <option value="working">{statusLabel('working')}</option>
              <option value="idle">{statusLabel('idle')}</option>
              <option value="offline">{statusLabel('offline')}</option>
            </select>
          </div>
          <div className="hire-field">
            <label htmlFor="hire-jira">Liên kết Jira (tuỳ chọn)</label>
            <input
              id="hire-jira"
              type="text"
              value={values.jiraUrl}
              onChange={(e) => change('jiraUrl', e.target.value)}
            />
            {errors.jiraUrl ? <span className="hire-error">{errors.jiraUrl}</span> : null}
          </div>
          {fullNotice ? (
            <p className="hire-notice" role="alert">
              Phòng đã đủ {MAX_STAFF} chỗ — không thể tuyển thêm. Bạn vẫn có thể chỉnh sửa nhân
              viên hiện có.
            </p>
          ) : null}
          <div className="hire-actions">
            <button type="button" className="btn" onClick={close}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary">
              {editId !== null ? 'Lưu' : 'Thêm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
