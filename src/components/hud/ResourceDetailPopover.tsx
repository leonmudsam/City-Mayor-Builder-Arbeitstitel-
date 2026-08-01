import { useGame, useUiStore } from '../../state/store.ts';
import type { ResourceId } from '../../game/types.ts';
import { ResourceIcon } from '../common/icons.tsx';
import { buildResourceNetworkView } from '../operations/adapters.ts';
import { formatMoney, t } from '../../i18n/index.ts';

// The detail card behind a resource badge (§2, §12): where a resource stands
// (stock vs. capacity), how fast it changes, and a one-line explanation of what
// feeds it — so the HUD teaches, not just displays. Money links to the economy
// breakdown; materials show production/min and fill state.

function fmt(n: number): string {
  return Math.floor(n).toLocaleString('de-DE');
}

export function ResourceDetailPopover({
  id,
  onNavigate,
}: {
  id: ResourceId;
  onNavigate?: () => void;
}) {
  const game = useGame();
  const openPanel = useUiStore((s) => s.openPanel);
  const setPanel = useUiStore((s) => s.setPanel);
  const openResourceNetwork = useUiStore((s) => s.openResourceNetwork);
  const stock = game.state.resources[id];
  const cap = game.derived.storageCaps[id];
  const perMin = game.derived.productionPerMin[id];

  if (id === 'money') {
    const income = game.getIncome();
    return (
      <div className="res-detail">
        <div className="res-detail-head">
          <ResourceIcon id="money" size={16} />
          <span>{t('resource.money')}</span>
          <span className="res-detail-stock">{formatMoney(stock)}</span>
        </div>
        <div className="res-detail-rows">
          <DetailRow label={t('ui.finance.residential')} value={`+${formatMoney(income.residential)}`} />
          <DetailRow label={t('ui.finance.commercial')} value={`+${formatMoney(income.commercial)}`} />
          <DetailRow label={t('ui.finance.industrial')} value={`+${formatMoney(income.industrial)}`} />
          <DetailRow label={t('ui.finance.upkeep')} value={`−${formatMoney(income.upkeep)}`} negative />
          <DetailRow label={t('ui.finance.net')} value={`${income.net >= 0 ? '+' : '−'}${formatMoney(Math.abs(income.net))}`} strong />
        </div>
        <p className="res-detail-note">{t('ui.resource.note.money')}</p>
        <button
          className="btn-link res-detail-link"
          onClick={() => {
            onNavigate?.();
            if (openPanel !== 'economy') setPanel('economy');
          }}
        >
          {t('ui.economy.open')}
        </button>
      </div>
    );
  }

  const full = cap > 0 && stock >= cap;
  const fillPct = cap > 0 ? Math.min(100, Math.round((stock / cap) * 100)) : 0;
  // § P-C: Bestand nach STANDORT sichtbar machen. Der Zentralbestand (Rathaus +
  // Lagerhäuser) ist EIN gemeinsamer Pool — seine Kapazität steckt in der cap-Zeile,
  // die Aufteilung je Gebäude zeigt das volle Ressourcennetz. Hier kompakt die
  // ehrlichen Größen: zentral verfügbar, lokal in Betrieben, unterwegs, reserviert.
  // Nur belegte Zeilen werden gezeigt; nichts wird erfunden (§ nicht vortäuschen).
  const net = buildResourceNetworkView(game, id);
  const locationRows: { label: string; value: number }[] = [
    { label: 'In Betrieben (lokal)', value: net.inProductionBuildings },
    { label: 'Unterwegs', value: net.inTransit },
    { label: 'Reserviert', value: net.reserved },
  ].filter((row) => row.value > 0);
  return (
    <div className="res-detail">
      <div className="res-detail-head">
        <ResourceIcon id={id} size={16} />
        <span>{t(`resource.${id}`)}</span>
        <span className="res-detail-stock">
          {fmt(stock)}
          {cap > 0 && <span className="muted"> / {fmt(cap)}</span>}
        </span>
      </div>
      {cap > 0 && (
        <div className="res-detail-bar">
          <div className={`res-detail-bar-fill${full ? ' full' : ''}`} style={{ width: `${fillPct}%` }} />
        </div>
      )}
      <div className="res-detail-rows">
        <DetailRow label={t('ui.production')} value={perMin > 0 ? `+${perMin % 1 === 0 ? perMin : perMin.toFixed(1)} /min` : '—'} />
        <DetailRow label="Für Bau verfügbar" value={fmt(net.accessibleForConstruction)} />
        {cap > 0 && <DetailRow label={t('ui.storage')} value={fmt(cap)} />}
      </div>
      {locationRows.length > 0 && (
        <div className="res-detail-rows res-detail-locations">
          {locationRows.map((row) => (
            <DetailRow key={row.label} label={row.label} value={fmt(row.value)} />
          ))}
        </div>
      )}
      <p className="res-detail-note">{full ? t('ui.storage.full') : t(`ui.resource.note.${id}`)}</p>
      <button
        className="btn-link res-detail-link"
        onClick={() => {
          onNavigate?.();
          openResourceNetwork(id);
        }}
      >
        Gesamtes Ressourcennetz öffnen
      </button>
    </div>
  );
}

function DetailRow({ label, value, strong, negative }: { label: string; value: string; strong?: boolean; negative?: boolean }) {
  return (
    <div className={`res-detail-row${strong ? ' strong' : ''}`}>
      <span>{label}</span>
      <span className={`res-detail-value${negative ? ' text-bad' : ''}`}>{value}</span>
    </div>
  );
}
