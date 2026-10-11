// Bottom bar: zoom controls (via scene singleton), center, theme, jira link.

import type { ReactElement } from 'react';
import { getScene } from '@/scene/instance';
import { useOfficeStore } from '@/store/officeStore';
import type { ThemeMode } from '@/types';

const ZOOM_MIN = 51;
const ZOOM_MAX = 100;
const TEAM_JIRA_URL = '#';

export default function BottomBar(): ReactElement {
  const zoomPercent = useOfficeStore((s) => s.zoomPercent);
  const theme = useOfficeStore((s) => s.theme);
  const setZoomPercent = useOfficeStore((s) => s.setZoomPercent);
  const setTheme = useOfficeStore((s) => s.setTheme);

  const changeZoom = (delta: number): void => {
    const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoomPercent + delta));
    if (next === zoomPercent) return;
    setZoomPercent(next);
    getScene()?.setZoomPercent(next);
  };

  const themeButton = (mode: ThemeMode, label: string): ReactElement => (
    <button
      type="button"
      className={`seg-btn${theme === mode ? ' is-active' : ''}`}
      aria-pressed={theme === mode}
      onClick={() => setTheme(mode)}
    >
      {label}
    </button>
  );

  return (
    <footer className="bottom-bar">
      <div className="zoom-group">
        <button type="button" className="icon-btn" aria-label="Thu nhỏ" onClick={() => changeZoom(-10)}>
          –
        </button>
        <span className="zoom-value">{zoomPercent}%</span>
        <button type="button" className="icon-btn" aria-label="Phóng to" onClick={() => changeZoom(+10)}>
          +
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label="Căn giữa camera"
          title="Căn giữa"
          onClick={() => getScene()?.center()}
        >
          ◎
        </button>
      </div>
      <div className="bottom-right">
        <div className="seg-group" role="group" aria-label="Giao diện">
          {themeButton('day', 'Day')}
          {themeButton('night', 'Night')}
        </div>
        <button
          type="button"
          className="btn"
          onClick={() => window.open(TEAM_JIRA_URL, '_blank', 'noopener,noreferrer')}
        >
          Assign work to the team
        </button>
      </div>
    </footer>
  );
}
