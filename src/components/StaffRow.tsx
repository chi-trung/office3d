// One staff line in the sidebar: avatar, name, role, status dot.

import { useState, type ReactElement } from 'react';
import { TEAMS } from '@/data/staff';
import { initialsOf } from '@/lib/staffForm';
import { statusColor, statusLabel } from '@/lib/status';
import { useOfficeStore } from '@/store/officeStore';
import type { Staff } from '@/types';

export default function StaffRow({ member }: { member: Staff }): ReactElement {
  const selectedId = useOfficeStore((s) => s.selectedId);
  const select = useOfficeStore((s) => s.select);
  const [imgFailed, setImgFailed] = useState(false);

  const team = TEAMS.find((t) => t.id === member.teamId);
  const teamColor = team?.color ?? '#9ca3af';
  const isSelected = selectedId === member.id;

  return (
    <button
      type="button"
      className={`staff-row${isSelected ? ' is-selected' : ''}`}
      onClick={() => select(member.id)}
    >
      {member.avatarUrl && !imgFailed ? (
        <img
          className="staff-avatar"
          src={member.avatarUrl}
          alt=""
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className="staff-avatar staff-avatar--initials" style={{ background: teamColor }}>
          {initialsOf(member.name)}
        </span>
      )}
      <span className="staff-row-text">
        <span className="staff-row-name">{member.name}</span>
        <span className="staff-row-role">{member.role}</span>
      </span>
      <span
        className="status-dot"
        style={{ background: statusColor(member.status) }}
        title={statusLabel(member.status)}
      />
    </button>
  );
}
