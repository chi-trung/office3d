// Root layout: the 3D viewport plus the overlay UI (Task 10).

import { useEffect, type ReactElement } from 'react';
import BottomBar from '@/components/BottomBar';
import HeaderBar from '@/components/HeaderBar';
import StaffCard from '@/components/StaffCard';
import TeamSidebar from '@/components/TeamSidebar';
import Viewport from '@/components/Viewport';
import { DEFAULT_STAFF } from '@/data/staff';
import { loadStaff } from '@/lib/storage';
import { useOfficeStore } from '@/store/officeStore';

export default function App(): ReactElement {
  const theme = useOfficeStore((state) => state.theme);

  useEffect(() => {
    useOfficeStore.getState().setStaff(loadStaff(DEFAULT_STAFF));
  }, []);

  return (
    <div className="app" data-theme={theme}>
      <Viewport />
      <HeaderBar />
      <TeamSidebar />
      <StaffCard />
      <BottomBar />
      {/* HireDialog — Task 11 */}
    </div>
  );
}
