// Floating name label: canvas pill texture on a THREE.Sprite above the head.

import * as THREE from 'three';
import type { StaffStatus } from '@/types';
import { statusColor } from '@/lib/status';

const CANVAS_W = 512;
const CANVAS_H = 128;
const PILL_PAD = 8;
const BORDER_W = 6;
const DOT_RADIUS = 16;
const DOT_INSET = 40; // dot center from the right canvas edge
const TEXT_X = 40;
const TEXT_GAP = 16; // clear space between text limit and dot
const SPRITE_SCALE: [number, number] = [2.2, 0.55]; // matches 512/128 aspect

interface LabelCanvas {
  ctx: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
}

// Updates must redraw the original canvas, so remember it per sprite.
const labelCanvases = new WeakMap<THREE.Sprite, LabelCanvas>();

// White pill (92% opaque), status border + status dot, Vietnamese name.
function drawLabel(
  ctx: CanvasRenderingContext2D,
  name: string,
  status: StaffStatus,
): void {
  const color = statusColor(status);
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // Rounded pill: radius = half of the inner height.
  const innerH = CANVAS_H - PILL_PAD * 2;
  ctx.beginPath();
  ctx.roundRect(PILL_PAD, PILL_PAD, CANVAS_W - PILL_PAD * 2, innerH, innerH / 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.fill();
  ctx.lineWidth = BORDER_W;
  ctx.strokeStyle = color;
  ctx.stroke();

  // Status dot on the right.
  const dotX = CANVAS_W - DOT_INSET;
  ctx.beginPath();
  ctx.arc(dotX, CANVAS_H / 2, DOT_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // Name text; maxWidth shrinks long names instead of overflowing the pill.
  ctx.fillStyle = '#111827';
  ctx.font = '44px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const maxTextW = dotX - DOT_RADIUS - TEXT_GAP - TEXT_X;
  ctx.fillText(name, TEXT_X, CANVAS_H / 2, maxTextW);
}

export function makeNameLabel(name: string, status: StaffStatus): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('nameLabel: 2D canvas context unavailable');
  }
  drawLabel(ctx, name, status);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(SPRITE_SCALE[0], SPRITE_SCALE[1], 1);
  labelCanvases.set(sprite, { ctx, texture });
  return sprite;
}

// Redraw the existing canvas/texture in place (never creates a new texture).
export function updateNameLabel(
  sprite: THREE.Sprite,
  name: string,
  status: StaffStatus,
): void {
  const data = labelCanvases.get(sprite);
  if (!data) return; // sprite was not created by makeNameLabel
  drawLabel(data.ctx, name, status);
  data.texture.needsUpdate = true;
}
