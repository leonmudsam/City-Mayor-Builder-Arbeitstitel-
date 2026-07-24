// cameraInputMapping (v0.95, G2.2) — the ONE place that maps a mouse button to a
// camera intent, both while free-roaming and while placing a building/road. Kept
// free of three/react imports so the whole mapping is deterministically unit-testable
// (see tests/camera.test.ts). Belegung gemaess §10.3:
//
//   Middle button ........ pan (schwenkt, statt zu orbitieren)
//   Right button drag .... orbit (yaw + tilt)      Right button click ... cancel/deselect
//   Ctrl + left drag ..... orbit — auch waehrend des Platzierens
//   Left button .......... build/paint while placing, else pan (drag) / select (click)
//
// Kernregel: Der Bauentwurf ueberlebt jede Kamerabewegung — keine Kamera-Geste ruft
// host.cancel(); allein der bewusste Rechts-*Klick* verwirft ihn.

export type PointerDragMode = 'pan' | 'orbit' | 'build' | 'none';
export type PointerClickAction = 'place' | 'select' | 'cancel' | 'none';

export interface PointerButtons {
  /** 0 = links, 1 = mitte, 2 = rechts (PointerEvent.button). */
  button: number;
  ctrlKey: boolean;
  /** True, solange ein Gebaeude/eine Strasse platziert wird. */
  isPlacing: boolean;
}

/** Was ein Zug mit dieser Taste bewirkt — unabhaengig von der Zugweite. */
export function deriveDragMode({ button, ctrlKey, isPlacing }: PointerButtons): PointerDragMode {
  if (button === 0 && ctrlKey) return 'orbit'; // Strg+Links dreht — auch beim Bauen.
  if (button === 1) return 'pan'; // Mitteltaste schwenkt immer (§10.3).
  if (button === 2) return 'orbit'; // Rechts-Zug dreht.
  if (button === 0) return isPlacing ? 'build' : 'pan';
  return 'none';
}

/** Was ein Klick (kein Zug) mit dieser Taste bewirkt. */
export function deriveClickAction({ button, ctrlKey, isPlacing }: PointerButtons): PointerClickAction {
  if (button === 2) return 'cancel'; // Rechts-Klick bricht ab / hebt Auswahl auf.
  if (button === 0 && ctrlKey) return 'none'; // Strg+Links ist reine Drehgeste.
  if (button === 1) return 'none'; // Mittelklick tut nichts.
  if (button === 0) return isPlacing ? 'place' : 'select';
  return 'none';
}
