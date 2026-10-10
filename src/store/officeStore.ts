// Shared app state via zustand. Persistence is handled by a component effect,
// not here — the store never touches localStorage.

import { create } from 'zustand';
import type { Staff, TeamId, ThemeMode, ViewMode } from '@/types';
import { DEFAULT_STAFF } from '@/data/staff';

export interface OfficeState {
  staff: Staff[];
  selectedId: string | null;
  filterTeamId: TeamId | null;
  viewMode: ViewMode;
  theme: ThemeMode;
  hireOpen: boolean;
  zoomPercent: number;

  setStaff: (staff: Staff[]) => void;
  addStaff: (staff: Staff) => void;
  updateStaff: (id: string, patch: Partial<Staff>) => void;
  removeStaff: (id: string) => void;
  resetStaff: () => void;
  select: (id: string | null) => void;
  setFilter: (teamId: TeamId | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setTheme: (theme: ThemeMode) => void;
  setHireOpen: (open: boolean) => void;
  setZoomPercent: (percent: number) => void;
}

export const useOfficeStore = create<OfficeState>()((set) => ({
  staff: [],
  selectedId: null,
  filterTeamId: null,
  viewMode: '3d',
  theme: 'day',
  hireOpen: false,
  zoomPercent: 51,

  setStaff: (staff) => set({ staff }),
  addStaff: (staff) => set((s) => ({ staff: [...s.staff, staff] })),
  updateStaff: (id, patch) =>
    set((s) => ({
      staff: s.staff.map((member) => (member.id === id ? { ...member, ...patch } : member)),
    })),
  removeStaff: (id) =>
    set((s) => ({
      staff: s.staff.filter((member) => member.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),
  resetStaff: () => set({ staff: [...DEFAULT_STAFF] }),
  select: (id) => set({ selectedId: id }),
  setFilter: (teamId) => set({ filterTeamId: teamId }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setTheme: (theme) => set({ theme }),
  setHireOpen: (open) => set({ hireOpen: open }),
  setZoomPercent: (percent) => set({ zoomPercent: percent }),
}));
