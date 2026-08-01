import {
  BarChart3,
  Briefcase,
  ChevronRight,
  Droplets,
  Home,
  Leaf,
  Smile,
  Wheat,
  type LucideIcon,
} from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import { t } from '../../i18n/index.ts';
import { brandImage } from '../../assets/registry.ts';

interface StatusMetric {
  id: 'housing' | 'water' | 'food' | 'work' | 'environment';
  icon: LucideIcon;
  label: string;
  pct: number;
  status: string;
}

type StatusTone = 'bad' | 'warn' | 'good';

const clampPct = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const formatInt = (n: number) => Math.max(0, Math.round(n)).toLocaleString('de-DE');
const toneFor = (pct: number): StatusTone => (pct < 60 ? 'bad' : pct < 85 ? 'warn' : 'good');

/**
 * Permanente Stadtlage nach dem Active-Simplicity-Prinzip:
 * Gesamtzustand, die drei schwächsten freigeschalteten Werte und genau eine
 * nächste Aktion. Die vollständige Diagnose bleibt im bestehenden Status-Sheet.
 */
export function CityStatusPanel() {
  const game = useGame();
  const setPanel = useUiStore((state) => state.setPanel);
  const { state, derived, config } = game;
  const level = state.level.current;
  const population = state.citizens.population;
  const needs = state.citizens.needs;
  const growth = game.getGrowthStatus();
  const crest = brandImage('mayor_crest');
  const unlockLevel = (id: string) => config.needs.find((need) => need.id === id)?.unlockLevel ?? 0;
  const unlocked = (id: string) => unlockLevel(id) <= level;

  const residential = Object.values(state.buildings).filter(
    (building) =>
      building.status === 'active' && config.buildings.get(building.defId)?.category === 'residential',
  ).length;
  const labor = population * config.balancing.laborParticipation;
  const unserved = (fulfilment: number) =>
    population <= 0 ? 0 : Math.max(0, Math.round((1 - fulfilment) * residential));

  const metrics: StatusMetric[] = [
    {
      id: 'housing',
      icon: Home,
      label: t('need.housing'),
      pct: clampPct(needs.housing.fulfillment * 100),
      status:
        growth.capacity <= 0
          ? t('ui.growth.no_housing')
          : growth.freeHousing <= 0
            ? t('ui.growth.full')
            : `${formatInt(growth.freeHousing)} freie Wohnplätze`,
    },
  ];

  if (unlocked('water')) {
    const missing = unserved(needs.water.fulfillment);
    metrics.push({
      id: 'water',
      icon: Droplets,
      label: t('ui.status.water'),
      pct: clampPct(needs.water.fulfillment * 100),
      status:
        missing > 0 ? t('ui.status.without_water', { count: missing }) : t('ui.status.fully_supplied'),
    });
  }

  if (unlocked('food')) {
    const missing = unserved(needs.food.fulfillment);
    metrics.push({
      id: 'food',
      icon: Wheat,
      label: t('ui.status.food'),
      pct: clampPct(needs.food.fulfillment * 100),
      status:
        missing > 0 ? t('ui.status.without_food', { count: missing }) : t('ui.status.fully_supplied'),
    });
  }

  if (unlocked('work')) {
    const unemployed = Math.max(0, Math.round(labor * (1 - needs.work.fulfillment)));
    metrics.push({
      id: 'work',
      icon: Briefcase,
      label: t('ui.status.jobs'),
      pct: clampPct(needs.work.fulfillment * 100),
      status:
        unemployed > 0
          ? t('ui.status.unemployed', { count: unemployed })
          : t('ui.status.full_employment'),
    });
  }

  metrics.push({
    id: 'environment',
    icon: Leaf,
    label: t('ui.status.environment'),
    pct: clampPct(60 + derived.avgAmbience * 6),
    status: t(derived.avgAmbience >= 0 ? 'ui.status.air_clean' : 'ui.status.air_polluted'),
  });

  const rankedMetrics = [...metrics].sort((a, b) => a.pct - b.pct);
  const visibleMetrics = rankedMetrics.slice(0, 3);
  const priority = rankedMetrics.find((metric) => metric.pct < 85);
  const happiness = clampPct(state.citizens.happiness);
  const happinessTone = toneFor(happiness);
  const PriorityIcon = priority?.icon ?? Smile;
  const actionPanel = priority ? 'build' : 'status';

  return (
    <aside className="hud-panel city-status city-status-compact">
      <header className="status-compact-head">
        <div className="status-compact-title">
          <span className="status-head-art">
            {crest ? <img src={crest} alt="" aria-hidden="true" /> : <BarChart3 size={16} />}
          </span>
          <span>
            <small>{t('ui.nav.city')}</small>
            <strong>{t('ui.status.title')}</strong>
          </span>
        </div>
        <button
          className="status-details-button"
          onClick={() => setPanel('status')}
          title={t('ui.status.details')}
          aria-label={t('ui.status.details')}
        >
          <ChevronRight size={17} />
        </button>
      </header>

      <div className={`status-overview text-${happinessTone}`}>
        <Smile size={25} />
        <strong>{happiness}%</strong>
        <span>{t(happinessKey(happiness))}</span>
      </div>

      <div className="status-compact-metrics">
        {visibleMetrics.map((metric) => {
          const Icon = metric.icon;
          const tone = toneFor(metric.pct);
          return (
            <div className="status-compact-metric" key={metric.id} title={metric.status}>
              <Icon size={14} />
              <span>{metric.label}</span>
              <div className="status-line-bar">
                <div className={`status-line-fill ${tone}`} style={{ width: `${metric.pct}%` }} />
              </div>
              <strong className={`text-${tone}`}>{metric.pct}%</strong>
            </div>
          );
        })}
      </div>

      <button className={`status-next-action ${priority ? toneFor(priority.pct) : 'good'}`} onClick={() => setPanel(actionPanel)}>
        <span className="status-next-icon">
          <PriorityIcon size={17} />
        </span>
        <span className="status-next-copy">
          <small>{priority ? t('ui.build.recommended') : t('ui.status.all_good')}</small>
          <strong>{priority ? `${priority.label} verbessern` : t('ui.status.details')}</strong>
          {priority && <span>{priority.status}</span>}
        </span>
        <ChevronRight size={17} />
      </button>
    </aside>
  );
}

function happinessKey(happiness: number): string {
  return happiness >= 80
    ? 'ui.happy.great'
    : happiness >= 55
      ? 'ui.happy.ok'
      : happiness >= 35
        ? 'ui.happy.meh'
        : 'ui.happy.bad';
}
