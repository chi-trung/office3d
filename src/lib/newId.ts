// Staff id factory: crypto.randomUUID() where available, with a fallback for
// non-secure contexts (plain http on LAN) where crypto.randomUUID is missing.

export function newStaffId(): string {
  const random = globalThis.crypto?.randomUUID?.bind(globalThis.crypto);
  if (typeof random === 'function') return random();
  // Fallback: timestamp + random, unique enough for a local staff list.
  return `staff-${Date.now().toString(36)}-${Math.floor(Math.random() * 0xffffffff).toString(36)}`;
}
