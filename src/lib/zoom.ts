// Linear mapping between camera distance and zoom percent.

const MIN_DISTANCE = 12;
const MAX_DISTANCE = 45;
const MIN_PERCENT = 51;
const MAX_PERCENT = 100;

export function mapZoomToPercent(distance: number): number {
  const raw = 100 - (distance - MIN_DISTANCE) * ((MAX_PERCENT - MIN_PERCENT) / (MAX_DISTANCE - MIN_DISTANCE));
  const clamped = Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, raw));
  return Math.round(clamped);
}

export function mapPercentToDistance(percent: number): number {
  const clamped = Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, percent));
  return MIN_DISTANCE + ((MAX_PERCENT - clamped) * (MAX_DISTANCE - MIN_DISTANCE)) / (MAX_PERCENT - MIN_PERCENT);
}
