import type { ResourceDef } from './types.ts';

// § Wirtschafts-/Lieferketten-Overhaul §3 — ZWEI VEREDELTE WAREN.
//
// Die Reihenfolge hier ist die Reihenfolge im HUD und in jeder Aufzählung:
// Geld · Holz · **Bretter** · Stein · **Werkstein** · Nahrung · Trinkwasser.
// Das Produkt steht direkt hinter seinem Rohstoff — die Kette ist damit schon
// an der Leiste ablesbar, ohne dass irgendwo ein Pfeil gezeichnet werden muss.
export const resourcesConfig: ResourceDef[] = [
  { id: 'money', nameKey: 'resource.money', baseStorage: Number.POSITIVE_INFINITY },
  { id: 'wood', nameKey: 'resource.wood', baseStorage: 300 },
  // Bretter/Werkstein haben `baseStorage: 0` — genau wie Trinkwasser. Sie
  // entstehen erst, wenn die Kette existiert, und die Kette bringt ihr Lager
  // mit (Werkstatt, Rathaus ab Stufe 2, Lagerhaus, Depot). Ein Grundlager wäre
  // ein Versprechen auf Vorrat, den es vor Level 5 nicht geben kann.
  { id: 'planks', nameKey: 'resource.planks', baseStorage: 0, unlockLevel: 5, refined: true },
  { id: 'stone', nameKey: 'resource.stone', baseStorage: 300 },
  { id: 'cut_stone', nameKey: 'resource.cut_stone', baseStorage: 0, unlockLevel: 5, refined: true },
  { id: 'food', nameKey: 'resource.food', baseStorage: 300 },
  // Drinking water is a *product* (MVP 2 supply chain), distinct from the water
  // infrastructure need. It has no base storage — it only accumulates once the
  // chain exists (waterworks/warehouse/supermarket provide the storage), so it
  // can't pile up before there's anywhere to keep it.
  { id: 'freshwater', nameKey: 'resource.freshwater', baseStorage: 0 },
];
