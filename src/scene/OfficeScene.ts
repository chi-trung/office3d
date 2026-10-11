// Owns the WebGL renderer, scene graph, lights, camera rig and render loop.
// Viewport creates exactly one instance and disposes it on unmount.

import * as THREE from 'three';
import type { Staff, TeamId, ThemeMode, ViewMode } from '@/types';
import { TEAMS } from '@/data/staff';
import { workstationPosition } from '@/lib/grid';
import { zoneColorFor } from '@/lib/zone';
import type { AnimState } from './animation';
import { createAnimState, updateCharacter } from './animation';
import { createRig, ORTHO_HALF_H } from './cameraRig';
import type { CharacterRefs } from './character';
import { buildDecor } from './decor';
import { buildDots } from './dots';
import { createMaterials } from './materials';
import type { MaterialPalette } from './materials';
import { makeNameLabel, updateNameLabel } from './nameLabel';
import { pickStaff } from './raycaster';
import { buildRoom } from './room';
import { applyTheme } from './theme';
import { buildWorkstation } from './workstation';
import { buildWorld, MAX_STAFF } from './world';

export interface OfficeSceneOptions {
  onPick(id: string | null): void;
  onZoom(p: number): void;
}

const CLICK_SLOP_PX = 5; // pointer travel below this counts as a click, not an orbit drag
const OFFLINE_OPACITY = 0.4;
const FILTER_DIM_OPACITY = 0.25;
const SCREEN_ON_EMISSIVE = 0.6; // day base; applyTheme rescales for night
const SCREEN_OFF_EMISSIVE = 0.05;
const SEED_STEP = 0.618; // R11: seed = (i * 0.618) % 1 stays in [0, 1)
const MAX_PIXEL_RATIO = 2;

// Full teardown / dots rebuild: dispose nothing selectively.
const NO_SKIP: ReadonlySet<THREE.Material> = new Set();

function disposeMaterial(material: THREE.Material): void {
  for (const value of Object.values(material)) {
    if (value instanceof THREE.Texture) value.dispose();
  }
  material.dispose();
}

// Frees GPU resources under `root`; palette materials in `skipMats` are kept
// because they are shared by every workstation still in the scene.
function releaseResources(root: THREE.Object3D, skipMats: ReadonlySet<THREE.Material>): void {
  root.traverse((obj) => {
    if (obj instanceof THREE.Sprite) {
      // Sprite geometry is a module-level singleton — free only the material.
      if (!skipMats.has(obj.material)) disposeMaterial(obj.material);
      return;
    }
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      const list = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const material of list) {
        if (!skipMats.has(material)) disposeMaterial(material);
      }
    }
  });
}

export class OfficeScene {
  private readonly container: HTMLElement;
  private readonly opts: OfficeSceneOptions;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly hemi: THREE.HemisphereLight;
  private readonly dir: THREE.DirectionalLight;
  private readonly mats: MaterialPalette;
  private readonly sharedMats: ReadonlySet<THREE.Material>;
  private readonly worldGroup: THREE.Group;
  private readonly emptySlot: THREE.Object3D;
  private readonly rig: ReturnType<typeof createRig>;
  private readonly ro: ResizeObserver;

  private readonly characters = new Map<string, CharacterRefs>();
  private readonly anims = new Map<string, AnimState>();
  private readonly screens = new Map<string, THREE.MeshStandardMaterial>();
  private readonly labels = new Map<string, THREE.Sprite>();
  private staff: Staff[] = [];
  private dots: THREE.Group;

  private mode: ViewMode = '3d';
  private theme: ThemeMode = 'day';
  private filter: TeamId | null = null;
  private lastZoom = -1; // first frame reports the initial percent
  private prevMs = 0;
  private down: { x: number; y: number } | null = null;
  private disposed = false;

  constructor(container: HTMLElement, opts: OfficeSceneOptions) {
    this.container = container;
    this.opts = opts;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer = renderer;
    container.appendChild(renderer.domElement);

    this.scene = new THREE.Scene();

    this.hemi = new THREE.HemisphereLight(0xffffff, 0x8a8578, 0.9);
    this.dir = new THREE.DirectionalLight(0xffe9cc, 1.6);
    this.dir.position.set(9, 16, 7);
    // Only the directional light casts shadows (brief requirement).
    this.dir.castShadow = true;
    this.dir.shadow.mapSize.set(2048, 2048);
    this.dir.shadow.bias = -0.0005;
    this.dir.shadow.normalBias = 0.02;
    const shadowCam = this.dir.shadow.camera;
    shadowCam.left = -12;
    shadowCam.right = 12;
    shadowCam.top = 12;
    shadowCam.bottom = -12;
    shadowCam.near = 0.5;
    shadowCam.far = 60;
    shadowCam.updateProjectionMatrix();
    this.scene.add(this.hemi, this.dir);

    this.mats = createMaterials();
    this.sharedMats = new Set(Object.values(this.mats));

    this.scene.add(buildRoom(this.mats), buildDecor(this.mats));

    // Staff arrives via setStaff right after construction; the hire desk is
    // the only seat buildWorld lays out for an empty list.
    const world = buildWorld([], TEAMS, this.mats);
    this.worldGroup = world.group;
    const empty = this.worldGroup.children.find((child) => child.userData.emptySlot === true);
    this.emptySlot = empty ?? this.worldGroup; // never missing with an empty list
    this.scene.add(this.worldGroup);

    this.dots = buildDots([], workstationPosition);
    this.scene.add(this.dots);

    this.rig = createRig(renderer, this.scene);
    applyTheme(this.scene, this.hemi, this.dir, this.screens, this.theme);

    renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
    renderer.domElement.addEventListener('pointerup', this.onPointerUp);

    this.ro = new ResizeObserver(this.onResize);
    this.ro.observe(container);
    this.applySize();

    renderer.setAnimationLoop(this.tick);
  }

  setStaff(raw: Staff[]): void {
    if (this.disposed) return;
    // R14: the grid has MAX_STAFF seats; workstationPosition(8) is off-room.
    const staff = raw.slice(0, MAX_STAFF);
    const prevById = new Map(this.staff.map((member) => [member.id, member] as const));
    this.staff = staff;

    const keep = new Set(staff.map((member) => member.id));
    for (const id of Array.from(this.characters.keys())) {
      if (!keep.has(id)) this.removeMember(id);
    }

    let screensChanged = false;
    staff.forEach((member, index) => {
      const prev = prevById.get(member.id);
      const refs = this.characters.get(member.id);
      if (prev && refs) {
        const lookChanged = JSON.stringify(prev.look) !== JSON.stringify(member.look);
        if (lookChanged || prev.teamId !== member.teamId) {
          // Body or zone colors are baked into the workstation — rebuild it.
          this.removeMember(member.id);
          screensChanged = true;
        } else {
          this.repositionMember(refs, index);
          if (prev.name !== member.name || prev.status !== member.status) {
            const label = this.labels.get(member.id);
            if (label) updateNameLabel(label, member.name, member.status);
          }
          if (prev.status !== member.status) {
            const screen = this.screens.get(member.id);
            if (screen) {
              screen.emissiveIntensity =
                member.status === 'working' ? SCREEN_ON_EMISSIVE : SCREEN_OFF_EMISSIVE;
              screensChanged = true;
            }
          }
        }
      }
      if (!this.characters.has(member.id)) {
        this.addMember(member, index);
        screensChanged = true;
      }
    });

    this.syncEmptySlot(staff.length);
    this.rebuildDots();
    this.applyLooks();
    if (screensChanged) {
      applyTheme(this.scene, this.hemi, this.dir, this.screens, this.theme);
    }
  }

  setFilter(teamId: TeamId | null): void {
    if (this.disposed) return;
    this.filter = teamId;
    this.applyLooks();
  }

  setViewMode(mode: ViewMode): void {
    if (this.disposed || mode === this.mode) return;
    this.mode = mode;
    this.rig.setViewMode(mode);
    this.dots.visible = mode === '2d';
    for (const label of this.labels.values()) label.visible = mode === '3d';
  }

  setTheme(theme: ThemeMode): void {
    if (this.disposed) return;
    this.theme = theme;
    applyTheme(this.scene, this.hemi, this.dir, this.screens, theme);
  }

  setZoomPercent(p: number): void {
    if (this.disposed) return;
    this.rig.setPercent(p);
    this.lastZoom = this.rig.getPercent(); // applied locally — no echo to the store
  }

  center(): void {
    if (this.disposed) return;
    this.rig.center();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointerdown', this.onPointerDown);
    canvas.removeEventListener('pointerup', this.onPointerUp);
    this.ro.disconnect();
    this.rig.controls.dispose();
    releaseResources(this.scene, NO_SKIP); // palette dies with the scene
    this.renderer.dispose();
    canvas.remove(); // clears the container of everything this scene mounted
  }

  // One seat built; maps and label updated to match buildWorld's conventions.
  private addMember(member: Staff, index: number): void {
    const { x, z } = workstationPosition(index);
    const ws = buildWorkstation(member, zoneColorFor(member.teamId, TEAMS), this.mats, index);
    ws.group.position.set(x, 0, z);
    this.worldGroup.add(ws.group);

    this.characters.set(member.id, ws.character);
    this.screens.set(member.id, ws.screenMat);
    // R11: fractional seed — glance gap 4+seed*3 and direction seed>=0.5 need it.
    this.anims.set(member.id, createAnimState((index * SEED_STEP) % 1));

    const label = makeNameLabel(member.name, member.status);
    label.visible = this.mode === '3d';
    ws.character.labelAnchor.add(label);
    this.labels.set(member.id, label);
  }

  // Seat removed: workstation subtree (character, label, screen) leaves too.
  private removeMember(id: string): void {
    const refs = this.characters.get(id);
    if (refs) {
      const workstation = refs.group.parent;
      if (workstation) {
        this.worldGroup.remove(workstation);
        releaseResources(workstation, this.sharedMats);
      }
      this.characters.delete(id);
    }
    this.screens.delete(id);
    this.anims.delete(id);
    this.labels.delete(id); // sprite/texture freed with the workstation subtree
  }

  // Staff order can shift after a removal, so seats are re-derived per setStaff.
  private repositionMember(refs: CharacterRefs, index: number): void {
    const workstation = refs.group.parent;
    if (!workstation) return;
    const { x, z } = workstationPosition(index);
    workstation.position.set(x, 0, z);
  }

  // The hire desk follows the next free seat; hidden while the grid is full.
  private syncEmptySlot(count: number): void {
    if (count < MAX_STAFF) {
      if (this.emptySlot.parent !== this.worldGroup) this.worldGroup.add(this.emptySlot);
      const { x, z } = workstationPosition(count);
      this.emptySlot.position.set(x, 0, z);
    } else if (this.emptySlot.parent === this.worldGroup) {
      this.worldGroup.remove(this.emptySlot);
    }
  }

  private rebuildDots(): void {
    this.scene.remove(this.dots);
    releaseResources(this.dots, NO_SKIP);
    this.dots = buildDots(this.staff, workstationPosition);
    this.dots.visible = this.mode === '2d';
    this.scene.add(this.dots);
  }

  // Opacity look per person: offline base, optionally dimmed by the filter.
  // Mirrors applyStatusLook's material walk without touching member.status.
  private applyLooks(): void {
    for (const member of this.staff) {
      const refs = this.characters.get(member.id);
      if (!refs) continue;
      const dimmed = this.filter !== null && member.teamId !== this.filter;
      const opacity = dimmed
        ? FILTER_DIM_OPACITY
        : member.status === 'offline'
          ? OFFLINE_OPACITY
          : 1;
      const transparent = opacity < 1;
      refs.group.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        const list = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const material of list) {
          material.opacity = opacity;
          material.transparent = transparent;
          material.needsUpdate = true;
        }
      });
    }
  }

  private applySize(): void {
    if (this.disposed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width <= 0 || height <= 0) return;
    this.renderer.setSize(width, height);
    const aspect = width / height;
    this.rig.persp.aspect = aspect;
    this.rig.persp.updateProjectionMatrix();
    this.rig.ortho.left = -ORTHO_HALF_H * aspect;
    this.rig.ortho.right = ORTHO_HALF_H * aspect;
    this.rig.ortho.updateProjectionMatrix();
  }

  private readonly onResize = (): void => {
    this.applySize();
  };

  // Click detection: a pick only fires when the pointer barely moved, so
  // orbit drags never turn into accidental selections.
  private readonly onPointerDown = (e: PointerEvent): void => {
    this.down = { x: e.clientX, y: e.clientY };
  };

  private readonly onPointerUp = (e: PointerEvent): void => {
    const down = this.down;
    this.down = null;
    if (!down) return;
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) >= CLICK_SLOP_PX) return;
    const camera = this.mode === '3d' ? this.rig.persp : this.rig.ortho;
    this.opts.onPick(pickStaff(e, this.renderer.domElement, camera, [this.worldGroup, this.dots]));
  };

  // R16: rig.update() carries the center() lerp plus idle controls.update();
  // calling controls.update() again here as well is never needed.
  private readonly tick = (time: number): void => {
    const delta = this.prevMs === 0 ? 0 : (time - this.prevMs) / 1000;
    this.prevMs = time;
    const seconds = time / 1000;

    for (const member of this.staff) {
      const refs = this.characters.get(member.id);
      const state = this.anims.get(member.id);
      if (refs && state) updateCharacter(refs, member.status, state, seconds, delta);
    }

    this.rig.update();
    this.renderer.render(this.scene, this.mode === '3d' ? this.rig.persp : this.rig.ortho);

    // Keep the store/BottomBar zoom readout in sync (initial load reports 51).
    const percent = this.rig.getPercent();
    if (percent !== this.lastZoom) {
      this.lastZoom = percent;
      this.opts.onZoom(percent);
    }
  };
}
