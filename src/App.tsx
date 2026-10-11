// Root layout: the 3D viewport plus the overlay UI (Task 10).

import { useEffect, useState, type ReactElement } from 'react';
import BottomBar from '@/components/BottomBar';
import HeaderBar from '@/components/HeaderBar';
import HireDialog from '@/components/HireDialog';
import StaffCard from '@/components/StaffCard';
import TeamSidebar from '@/components/TeamSidebar';
import Viewport from '@/components/Viewport';
import { DEFAULT_STAFF } from '@/data/staff';
import { loadStaffDetailed, saveStaff } from '@/lib/storage';
import { useOfficeStore } from '@/store/officeStore';

export default function App(): ReactElement {
  const theme = useOfficeStore((state) => state.theme);
  const hireOpen = useOfficeStore((state) => state.hireOpen);
  const [storageNotice, setStorageNotice] = useState<string | null>(null);

  // Load first, then subscribe: the initial load mirrors what is already in
  // storage, so it needs no save; every later staff change is persisted.
  useEffect(() => {
    const { staff, storageBlocked } = loadStaffDetailed(DEFAULT_STAFF);
    useOfficeStore.getState().setStaff(staff);
    // Spec Mục 8 "báo nhẹ": only when storage actually failed, not on an
    // empty store or a merely wrong-shaped value.
    if (storageBlocked) {
      setStorageNotice('Không đọc được dữ liệu đã lưu — dùng danh sách mặc định');
    }
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
      {storageNotice !== null ? (
        <div className="app-toast" role="status">
          {storageNotice}
        </div>
      ) : null}
    </div>
  );
}
