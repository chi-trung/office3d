// Mounts the OfficeScene once and wires it to the zustand store.

import { useEffect, useRef, type ReactElement } from 'react';
import { EMPTY_SLOT_ID } from '@/scene/raycaster';
import { OfficeScene } from '@/scene/OfficeScene';
import { useOfficeStore } from '@/store/officeStore';

export default function Viewport(): ReactElement {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let scene: OfficeScene | null = null;
    try {
      scene = new OfficeScene(host, {
        onPick: (id) => {
          const state = useOfficeStore.getState();
          if (id === EMPTY_SLOT_ID) state.setHireOpen(true);
          else state.select(id);
        },
        onZoom: (p) => {
          useOfficeStore.getState().setZoomPercent(p);
        },
      });
    } catch {
      // Constructor threw (WebGL unavailable): show the verbatim message.
      host.textContent = 'Trình duyệt không hỗ trợ WebGL';
      return;
    }

    // The scene starts empty — apply whatever the store already holds
    // (matters on the StrictMode remount, when staff is already loaded).
    const initial = useOfficeStore.getState();
    scene.setStaff(initial.staff);
    scene.setFilter(initial.filterTeamId);
    scene.setViewMode(initial.viewMode);
    scene.setTheme(initial.theme);

    const unsubscribe = useOfficeStore.subscribe((state, prev) => {
      if (state.staff !== prev.staff) scene?.setStaff(state.staff);
      if (state.filterTeamId !== prev.filterTeamId) scene?.setFilter(state.filterTeamId);
      if (state.viewMode !== prev.viewMode) scene?.setViewMode(state.viewMode);
      if (state.theme !== prev.theme) scene?.setTheme(state.theme);
    });

    return () => {
      unsubscribe();
      scene?.dispose();
      scene = null;
    };
  }, []);

  return <div className="viewport" ref={hostRef} />;
}
