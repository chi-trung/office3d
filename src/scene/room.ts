// Static room shell: light-wood floor, two warm-white walls with windows,
// logo panel, low front railing and two columns.

import * as THREE from 'three';
import type { MaterialPalette } from './materials';

const ROOM_W = 16;
const ROOM_D = 14;
const WALL_H = 3;
const WALL_T = 0.15;
const BACK_Z = -ROOM_D / 2; // -7
const FRONT_Z = ROOM_D / 2; // +7
const SIDE_X = -ROOM_W / 2; // -8

const WINDOW_W = 1.6;
const WINDOW_H = 1.2;
const WINDOW_Y = 1.35;
const WINDOW_XS = [-4, 0, 4];

function makeBox(w: number, h: number, d: number, material: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function standard(color: string, roughness = 0.9, metalness = 0): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

// Canvas texture for the logo wall; system font only.
function makeLogoTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('room: 2D canvas context unavailable');
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#2f3542';
  ctx.font = 'bold 68px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('My Company', canvas.width / 2, canvas.height / 2 + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// One window on the back wall: frame border + pale glass with mild emissive.
function makeWindow(mats: MaterialPalette, x: number): THREE.Group {
  const win = new THREE.Group();
  const z = BACK_Z + WALL_T / 2 + 0.01; // proud of the inner wall face

  const top = makeBox(WINDOW_W + 0.1, 0.08, 0.06, mats.deskDark);
  top.position.set(x, WINDOW_Y + WINDOW_H / 2 + 0.04, z);
  const bottom = makeBox(WINDOW_W + 0.1, 0.08, 0.06, mats.deskDark);
  bottom.position.set(x, WINDOW_Y - WINDOW_H / 2 - 0.04, z);
  const left = makeBox(0.08, WINDOW_H, 0.06, mats.deskDark);
  left.position.set(x - WINDOW_W / 2 - 0.04, WINDOW_Y, z);
  const right = makeBox(0.08, WINDOW_H, 0.06, mats.deskDark);
  right.position.set(x + WINDOW_W / 2 + 0.04, WINDOW_Y, z);

  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(WINDOW_W, WINDOW_H),
    new THREE.MeshStandardMaterial({
      color: '#d7eefb',
      emissive: '#cfe8f8',
      emissiveIntensity: 0.35,
      roughness: 0.15,
      transparent: true,
      opacity: 0.6,
    }),
  );
  glass.position.set(x, WINDOW_Y, z);

  win.add(top, bottom, left, right, glass);
  return win;
}

export function buildRoom(mats: MaterialPalette): THREE.Group {
  const room = new THREE.Group();

  // Floor: lighten the shared wood template.
  const floorMat = (mats.deskWood as THREE.MeshStandardMaterial).clone();
  floorMat.color.set('#e6cfa8');
  floorMat.roughness = 0.85;
  const floor = makeBox(ROOM_W, 0.2, ROOM_D, floorMat);
  floor.position.set(0, -0.1, 0); // top face at y 0
  room.add(floor);

  const wallMat = standard('#f4efe6', 0.95);

  // Back wall (spans x) and left wall (spans z), meeting at (-8, -7).
  const backWall = makeBox(ROOM_W, WALL_H, WALL_T, wallMat);
  backWall.position.set(0, WALL_H / 2, BACK_Z);
  const sideWall = makeBox(WALL_T, WALL_H, ROOM_D, wallMat);
  sideWall.position.set(SIDE_X, WALL_H / 2, 0);
  room.add(backWall, sideWall);

  for (const x of WINDOW_XS) {
    room.add(makeWindow(mats, x));
  }

  // Logo panel above the middle window.
  const logo = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 0.8),
    new THREE.MeshStandardMaterial({
      map: makeLogoTexture(),
      transparent: true,
      roughness: 0.9,
    }),
  );
  logo.position.set(0, 2.5, BACK_Z + WALL_T / 2 + 0.02);
  room.add(logo);

  // Low railing along the open front edge.
  const railZ = FRONT_Z - 0.1;
  const railMat = mats.chairBlack;
  const topRail = makeBox(ROOM_W, 0.07, 0.07, railMat);
  topRail.position.set(0, 1.0, railZ);
  const midRail = makeBox(ROOM_W, 0.05, 0.05, railMat);
  midRail.position.set(0, 0.55, railZ);
  room.add(topRail, midRail);
  for (let x = -7.5; x <= 7.5; x += 2.5) {
    const post = makeBox(0.1, 1.0, 0.1, railMat);
    post.position.set(x, 0.5, railZ);
    room.add(post);
  }

  // Two structural columns near the front corners.
  const columnMat = standard('#e9e3d8', 0.9);
  for (const sx of [-1, 1]) {
    const column = makeBox(0.35, WALL_H, 0.35, columnMat);
    column.position.set(sx * 6.8, WALL_H / 2, 6.4);
    room.add(column);
  }

  return room;
}
