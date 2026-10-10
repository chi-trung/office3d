// Workstation grid math: 4 columns, first seat at (-5.4, -2.4).

export const GRID_COLS = 4;
export const GRID_X0 = -5.4;
export const GRID_DX = 3.6;
export const GRID_Z0 = -2.4;
export const GRID_DZ = 4.8;

export interface GridPosition {
  x: number;
  z: number;
  row: number;
  col: number;
}

export function workstationPosition(index: number): GridPosition {
  const row = Math.floor(index / GRID_COLS);
  const col = index % GRID_COLS;
  return {
    x: GRID_X0 + col * GRID_DX,
    z: GRID_Z0 + row * GRID_DZ,
    row,
    col,
  };
}
