import { formatMoney, t } from '../../i18n/index.ts';

const int = (value: number): string => Math.round(value).toLocaleString('de-DE');

/**
 * Materialkosten als „57.500 · 1.660 Holz" (Geld kompakt, Rest ganzzahlig).
 * Lag bis v1.27 als Kopie im Straßenplaner; das Verschiebe-Banner brauchte
 * dieselbe Darstellung, und eine zweite Kopie hätte sie auseinanderlaufen lassen.
 */
export function costLabel(cost: Partial<Record<string, number>>): string {
  const parts = Object.entries(cost)
    .filter(([, amount]) => (amount ?? 0) > 0)
    .map(([res, amount]) => (res === 'money' ? formatMoney(amount ?? 0) : `${int(amount ?? 0)} ${t(`resource.${res}`)}`));
  return parts.length > 0 ? parts.join(' · ') : formatMoney(0);
}
