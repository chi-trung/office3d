// Root layout: the 3D viewport plus the overlay slots Tasks 10-11 fill in.

import { useEffect, type ReactElement } from 'react';
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
      {/* Overlay UI (Header / Sidebar / BottomBar / dialogs) — Tasks 10-11 */}
    </div>
  );
}
