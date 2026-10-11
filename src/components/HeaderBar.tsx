// Top bar: company stats, 2D/3D toggle, hire and share actions.

import { useEffect, useRef, useState, type ReactElement } from 'react';
import { computeStatusCounts } from '@/lib/status';
import { useOfficeStore } from '@/store/officeStore';
import type { ViewMode } from '@/types';

export default function HeaderBar(): ReactElement {
  const staff = useOfficeStore((s) => s.staff);
  const viewMode = useOfficeStore((s) => s.viewMode);
  const setViewMode = useOfficeStore((s) => s.setViewMode);
  const setHireOpen = useOfficeStore((s) => s.setHireOpen);
  const select = useOfficeStore((s) => s.select);
  const [toast, setToast] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const counts = computeStatusCounts(staff);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const onShare = (): void => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setToast('Đã copy link');
        if (timerRef.current !== null) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setToast(null), 2000);
      })
      .catch(() => {
        // Clipboard unavailable (insecure context) — no toast, no console noise.
      });
  };

  const modeButton = (mode: ViewMode, label: string): ReactElement => (
    <button
      type="button"
      className={`seg-btn${viewMode === mode ? ' is-active' : ''}`}
      aria-pressed={viewMode === mode}
      onClick={() => setViewMode(mode)}
    >
      {label}
    </button>
  );

  return (
    <header className="header-bar">
      <span className="header-logo">My Company</span>
      <span className="header-stats">
        {counts.total} staff · {counts.working} working
      </span>
      <div className="header-spacer" />
      <div className="seg-group" role="group" aria-label="Chế độ xem">
        {modeButton('2d', '2D')}
        {modeButton('3d', '3D')}
      </div>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => {
          select(null);
          setHireOpen(true);
        }}
      >
        + Hire staff
      </button>
      <button type="button" className="btn" onClick={onShare}>
        Share company
      </button>
      {toast !== null && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </header>
  );
}
