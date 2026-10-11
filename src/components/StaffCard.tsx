// Popup for the selected staff member. Closes on Esc, outside click or ×.
// The backdrop is visual only (pointer-events: none) so OrbitControls keep
// working while the card is open.

import { useEffect, useRef, useState, type ReactElement } from 'react';
import { TEAMS } from '@/data/staff';
import { initialsOf } from '@/lib/staffForm';
import { statusColor, statusLabel } from '@/lib/status';
import { useOfficeStore } from '@/store/officeStore';

export default function StaffCard(): ReactElement | null {
  const selectedId = useOfficeStore((s) => s.selectedId);
  const staff = useOfficeStore((s) => s.staff);
  const select = useOfficeStore((s) => s.select);
  const setHireOpen = useOfficeStore((s) => s.setHireOpen);
  const cardRef = useRef<HTMLDivElement>(null);
  const [imgFailed, setImgFailed] = useState(false);

  const member = staff.find((m) => m.id === selectedId) ?? null;
  const memberId = member?.id ?? null;

  // Reset the avatar fallback when the selected member changes or closes,
  // otherwise one failed image leaves every later member on initials.
  useEffect(() => {
    setImgFailed(false);
  }, [memberId]);

  useEffect(() => {
    if (memberId === null) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') select(null);
    };
    const onDown = (e: MouseEvent): void => {
      const card = cardRef.current;
      if (card && !card.contains(e.target as Node)) select(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [memberId, select]);

  if (member === null) return null;

  const team = TEAMS.find((t) => t.id === member.teamId);

  return (
    <>
      <div className="staff-card-backdrop" aria-hidden="true" />
      <div className="staff-card" ref={cardRef} role="dialog" aria-label={member.name}>
        <button
          type="button"
          className="staff-card-close"
          aria-label="Đóng"
          onClick={() => select(null)}
        >
          ×
        </button>
        <span className="staff-card-avatar" style={{ background: team?.color ?? '#9ca3af' }}>
          {member.avatarUrl && !imgFailed ? (
            <img src={member.avatarUrl} alt="" onError={() => setImgFailed(true)} />
          ) : (
            initialsOf(member.name)
          )}
        </span>
        <h2 className="staff-card-name">{member.name}</h2>
        <p className="staff-card-role">{member.role}</p>
        <p className="staff-card-team">
          {team?.icon} {team?.name}
        </p>
        <span className="status-pill" style={{ color: statusColor(member.status) }}>
          <span className="status-dot" style={{ background: statusColor(member.status) }} />
          {statusLabel(member.status)}
        </span>
        <div className="staff-card-actions">
          <button type="button" className="btn" onClick={() => setHireOpen(true)}>
            Sửa
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.open(member.jiraUrl, '_blank', 'noopener,noreferrer')}
          >
            Assign work
          </button>
          <a
            className="staff-card-link"
            href={member.jiraUrl}
            target="_blank"
            rel="noreferrer"
          >
            Mở Jira
          </a>
        </div>
      </div>
    </>
  );
}
