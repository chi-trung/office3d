// Root layout: the 3D viewport plus the overlay UI (Task 10).

import { useEffect, type ReactElement } from 'react';
import BottomBar from '@/components/BottomBar';
import HeaderBar from '@/components/HeaderBar';
import HireDialog from '@/components/HireDialog';
import StaffCard from '@/components/StaffCard';
import TeamSidebar from '@/components/TeamSidebar';
import Viewport from '@/components/Viewport';
import { DEFAULT_STAFF } from '@/data/staff';
import { loadStaff, saveStaff } from '@/lib/storage';
import { useOfficeStore } from '@/store/officeStore';

export default function App(): ReactElement {
  const theme = useOfficeStore((state) => state.theme);
  const hireOpen = useOfficeStore((state) => state.hireOpen);

  // Load first, then subscribe: the initial load mirrors what is already in
  // storage, so it needs no save; every later staff change is persisted.
  useEffect(() => {
    useOfficeStore.getState().setStaff(loadStaff(DEFAULT_STAFF));
    return useOfficeStore.subscribe((state, prev) => {
      if (state.staff !== prev.staff) saveStaff(state.staff);
    });
  }, []);

  return (
    <div className="app" data-theme={theme}>
      <Viewport />
      <HeaderBar />
      <TeamSidebar />
      <StaffCard />
      <BottomBar />
      {hireOpen ? <HireDialog /> : null}
    </div>
  );
}
