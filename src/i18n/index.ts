import de from './de.json';

// All UI strings live in language files from day one (concept §A3).
// Adding English later = adding en.json + a language switch, no code changes.
const strings: Record<string, string> = de;

export function t(key: string, params?: Record<string, string | number>): string {
  let text = strings[key] ?? key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      // Param values that are themselves i18n keys (e.g. building names) resolve too.
      const resolved = typeof value === 'string' && strings[value] ? strings[value] : String(value);
      text = text.replaceAll(`{${name}}`, resolved);
    }
  }
  return text;
}

/**
 * Money formatting on the municipal scale (§4): grouped thousands up to a
 * million, then compact "1,2 Mio." / "1,2 Mrd." so big budgets stay readable.
 */
export function formatMoney(n: number): string {
  const v = Math.round(n);
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return `${(v / 1_000_000_000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} Mrd.`;
  if (abs >= 1_000_000) return `${(v / 1_000_000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} Mio.`;
  return v.toLocaleString('de-DE');
}

export function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min ${s}s`;
  return `${s}s`;
}
