import { Droplets, Heart, Home, TrendingUp, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { t } from '../../i18n/index.ts';
import { useGame, useUiStore } from '../../state/store.ts';

type HudMetric = 'population' | 'happiness' | 'water';

const format = (value: number): string => Math.round(value).toLocaleString('de-DE');
const percent = (value: number): string => `${Math.round(value * 100)} %`;

/**
 * Detailansicht für die HUD-Kennzahlen, die keine gelagerte Ressource sind.
 * Alle Werte stammen aus demselben Controller-Snapshot wie Status- und
 * Wachstumspanel; das Popover führt nur zusammen, es berechnet keine Simulation.
 */
export function HudMetricDetailPopover({
  metric,
  onNavigate,
}: {
  metric: HudMetric;
  onNavigate?: () => void;
}) {
  const game = useGame();
  const openPanel = useUiStore((state) => state.openPanel);
  const setPanel = useUiStore((state) => state.setPanel);
  const openStatus = () => {
    onNavigate?.();
    if (openPanel !== 'status') setPanel('status');
  };

  if (metric === 'population') {
    const growth = game.getGrowthStatus();
    const reason =
      growth.reason === 'no_housing'
        ? t('ui.growth.no_housing')
        : growth.reason === 'housing_full'
          ? t('ui.growth.full')
          : growth.reason === 'unhappy'
            ? t('ui.growth.unhappy')
            : t('ui.growth.moving_in', { rate: format(growth.ratePerMin) });
    return (
      <MetricShell
        icon={<Users size={17} />}
        title={t('ui.population')}
        value={format(growth.population)}
        onOpen={openStatus}
      >
        <MetricRow label="Wohnkapazität" value={format(growth.capacity)} />
        <MetricRow label="Freier Wohnraum" value={format(growth.freeHousing)} />
        <MetricRow
          label={growth.growing ? 'Zuzug pro Minute' : 'Wachstumsstatus'}
          value={growth.growing ? `+${format(growth.ratePerMin)}` : reason}
          tone={growth.growing ? 'good' : 'warn'}
        />
        <p className="res-detail-note">{reason}</p>
      </MetricShell>
    );
  }

  if (metric === 'water') {
    const coverage = game.state.citizens.needs.water.fulfillment;
    const residential = Object.values(game.state.buildings).filter(
      (building) =>
        building.status === 'active' &&
        game.config.buildings.get(building.defId)?.category === 'residential',
    ).length;
    const unserved = Math.round((1 - coverage) * residential);
    return (
      <MetricShell
        icon={<Droplets size={17} />}
        title={t('ui.status.water')}
        value={percent(coverage)}
        onOpen={openStatus}
      >
        <div className="res-detail-bar">
          <div className="res-detail-bar-fill" style={{ width: `${Math.round(coverage * 100)}%` }} />
        </div>
        <MetricRow label="Versorgte Wohngebäude" value={format(Math.max(0, residential - unserved))} />
        <MetricRow label="Ohne Anschluss" value={format(unserved)} tone={unserved > 0 ? 'bad' : 'good'} />
        <p className="res-detail-note">
          {unserved > 0 ? t('ui.status.without_water', { count: unserved }) : t('ui.status.fully_supplied')}
        </p>
      </MetricShell>
    );
  }

  const unlockedNeeds = game.config.needs
    .filter((definition) => definition.unlockLevel <= game.state.level.current)
    .map((definition) => ({
      id: definition.id,
      label: t(definition.nameKey),
      fulfillment: game.state.citizens.needs[definition.id].fulfillment,
    }))
    .sort((a, b) => a.fulfillment - b.fulfillment)
    .slice(0, 5);
  return (
    <MetricShell
      icon={<Heart size={17} />}
      title={t('ui.happiness')}
      value={`${Math.round(game.state.citizens.happiness)} %`}
      onOpen={openStatus}
    >
      <div className="hud-metric-needs">
        {unlockedNeeds.map((need) => (
          <div className="hud-metric-need" key={need.id}>
            <span>{need.id === 'housing' ? <Home size={13} /> : <TrendingUp size={13} />}{need.label}</span>
            <strong className={need.fulfillment < 0.6 ? 'text-bad' : need.fulfillment < 0.85 ? 'text-warn' : 'text-good'}>
              {percent(need.fulfillment)}
            </strong>
          </div>
        ))}
      </div>
      <p className="res-detail-note">
        Die schwächste Versorgung wirkt zuerst auf Zufriedenheit und Wachstum.
      </p>
    </MetricShell>
  );
}

function MetricShell({
  icon,
  title,
  value,
  onOpen,
  children,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  onOpen: () => void;
  children: ReactNode;
}) {
  return (
    <div className="res-detail hud-metric-detail">
      <div className="res-detail-head">
        {icon}
        <span>{title}</span>
        <span className="res-detail-stock">{value}</span>
      </div>
      <div className="res-detail-rows">{children}</div>
      <button className="btn-link res-detail-link" onClick={onOpen}>
        Stadt-Status öffnen
      </button>
    </div>
  );
}

function MetricRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'good' | 'warn' | 'bad';
}) {
  return (
    <div className="res-detail-row">
      <span>{label}</span>
      <strong className={tone ? `text-${tone}` : undefined}>{value}</strong>
    </div>
  );
}
