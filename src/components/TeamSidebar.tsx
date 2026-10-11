// Left sidebar: Activity / Team tabs, team filter chips, stats, icon row.

import { useState, type ReactElement } from 'react';
import { TEAMS } from '@/data/staff';
import { computeStatusCounts } from '@/lib/status';
import { useOfficeStore } from '@/store/officeStore';
import StaffRow from '@/components/StaffRow';
import type { TeamId } from '@/types';

const ACTIVITY_LINES: readonly string[] = [
  'An vừa hoàn thành task thiết kế trang chủ',
  'Bình đang review pull request #42',
  'Chi đã cập nhật tiến độ sprint',
  'Dũng vừa gửi báo cáo tuần',
  'Hà chuẩn bị demo sản phẩm hôm nay',
];

const INDUSTRY_ICONS: readonly { icon: string; label: string }[] = [
  { icon: '💻', label: 'Công nghệ' },
  { icon: '🎨', label: 'Sáng tạo' },
  { icon: '📈', label: 'Tăng trưởng' },
  { icon: '📋', label: 'Sản phẩm' },
  { icon: '☕', label: 'Cà phê' },
  { icon: '🏢', label: 'Văn phòng' },
];

export default function TeamSidebar(): ReactElement {
  const staff = useOfficeStore((s) => s.staff);
  const filterTeamId = useOfficeStore((s) => s.filterTeamId);
  const setFilter = useOfficeStore((s) => s.setFilter);
  const [tab, setTab] = useState<'activity' | 'team'>('team');

  const counts = computeStatusCounts(staff);

  const toggleFilter = (teamId: TeamId): void => {
    setFilter(filterTeamId === teamId ? null : teamId);
  };

  const visibleTeams = TEAMS.filter((t) => filterTeamId === null || filterTeamId === t.id);

  return (
    <aside className="team-sidebar">
      <div className="sidebar-tabs" role="tablist" aria-label="Danh sách">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'activity'}
          className={`tab-btn${tab === 'activity' ? ' is-active' : ''}`}
          onClick={() => setTab('activity')}
        >
          Activity
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'team'}
          className={`tab-btn${tab === 'team' ? ' is-active' : ''}`}
          onClick={() => setTab('team')}
        >
          Team
        </button>
      </div>

      <div className="filter-chips">
        <button
          type="button"
          className={`chip${filterTeamId === null ? ' is-active' : ''}`}
          onClick={() => setFilter(null)}
        >
          Tất cả
        </button>
        {TEAMS.map((team) => (
          <button
            key={team.id}
            type="button"
            className={`chip${filterTeamId === team.id ? ' is-active' : ''}`}
            style={filterTeamId === team.id ? { background: team.color, color: '#1c1a17' } : undefined}
            onClick={() => toggleFilter(team.id)}
          >
            {team.icon} {team.name}
          </button>
        ))}
      </div>

      <div className="sidebar-body">
        {tab === 'activity' ? (
          <ul className="activity-list">
            {ACTIVITY_LINES.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : (
          visibleTeams.map((team) => {
            const members = staff.filter((m) => m.teamId === team.id);
            if (members.length === 0) return null;
            return (
              <section key={team.id} className="team-group">
                <h3 className="team-group-title" style={{ color: team.color }}>
                  {team.icon} {team.name}
                </h3>
                {members.map((member) => (
                  <StaffRow key={member.id} member={member} />
                ))}
              </section>
            );
          })
        )}
      </div>

      <div className="sidebar-stats">
        Working {counts.working} • Idle {counts.idle} • Offline {counts.offline}
      </div>

      <div className="sidebar-icons" aria-hidden="true">
        {INDUSTRY_ICONS.map((item) => (
          <span key={item.label} title={item.label}>
            {item.icon}
          </span>
        ))}
      </div>
    </aside>
  );
}
