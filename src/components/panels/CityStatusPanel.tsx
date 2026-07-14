import { BarChart3, Briefcase, ChevronRight, Droplets, Leaf, ShieldCheck, Smile, Wheat, type LucideIcon } from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import { t } from '../../i18n/index.ts';

// Persistent city-status widget (mockup §3, top-left): one legible row per key
// metric — icon · label · percent · bar · a concrete status line ("12 Gebäude
// ohne Wasser"). "Details ansehen" opens the full control room (CityStatusDetail).
// Every figure is read live off the derived simulation; nothing is stored here.

interface StatusRow {
  id: string;
  icon: LucideIcon;
  label: string;
  pct: number;
  status: string;
}

const clampPct = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function CityStatusPanel() {
  const game = useGame();
  const setPanel = useUiStore((s) => s.setPanel);
  const { state, derived, config } = game;
  const level = state.level.current;
  const pop = state.citizens.population;
  const needs = state.citizens.needs;
  const unlocked = (id: string) => (config.needs.find((n) => n.id === id)?.unlockLevel ?? 0) <= level;

  const residential = Object.values(state.buildings).filter(
    (b) => b.status === 'active' && config.buildings.get(b.defId)?.category === 'residential',
  ).length;
  const incidents = Object.values(state.buildings).filter((b) => b.status === 'paused').length;
  const labor = pop * config.balancing.laborParticipation;

  const unserved = (fulfil: number) => (pop <= 0 ? 0 : Math.round((1 - fulfil) * residential));

  const rows: StatusRow[] = [];
  rows.push({
    id: 'happy',
    icon: Smile,
    label: t('ui.happiness'),
    pct: clampPct(state.citizens.happiness),
    status: t(happinessKey(state.citizens.happiness)),
  });
  if (unlocked('water')) {
    const n = unserved(needs.water.fulfillment);
    rows.push({
      id: 'water',
      icon: Droplets,
      label: t('ui.status.water'),
      pct: clampPct(needs.water.fulfillment * 100),
      status: n > 0 ? t('ui.status.without_water', { count: n }) : t('ui.status.fully_supplied'),
    });
  }
  if (unlocked('food')) {
    const n = unserved(needs.food.fulfillment);
    rows.push({
      id: 'food',
      icon: Wheat,
      label: t('ui.status.food'),
      pct: clampPct(needs.food.fulfillment * 100),
      status: n > 0 ? t('ui.status.without_food', { count: n }) : t('ui.status.fully_supplied'),
    });
  }
  if (unlocked('work')) {
    const unemployed = Math.max(0, Math.round(labor * (1 - needs.work.fulfillment)));
    rows.push({
      id: 'work',
      icon: Briefcase,
      label: t('ui.status.jobs'),
      pct: clampPct(needs.work.fulfillment * 100),
      status: unemployed > 0 ? t('ui.status.unemployed', { count: unemployed }) : t('ui.status.full_employment'),
    });
  }
  // Environment maps the housing-weighted ambience score onto a 0..100 readout.
  const envPct = clampPct(60 + derived.avgAmbience * 6);
  rows.push({
    id: 'env',
    icon: Leaf,
    label: t('ui.status.environment'),
    pct: envPct,
    status: t(derived.avgAmbience >= 0 ? 'ui.status.air_clean' : 'ui.status.air_polluted'),
  });
  if (unlocked('safety')) {
    rows.push({
      id: 'safety',
      icon: ShieldCheck,
      label: t('ui.status.safety'),
      pct: clampPct(needs.safety.fulfillment * 100),
      status: incidents > 0 ? t('ui.status.incidents', { count: incidents }) : t('ui.status.no_incidents'),
    });
  }

  return (
    <aside className="hud-panel city-status">
      <div className="hud-panel-head">
        <h3>
          <BarChart3 size={16} /> {t('ui.status.title')}
        </h3>
      </div>
      <div className="status-rows">
        {rows.map((row) => {
          const Icon = row.icon;
          const tone = row.pct < 60 ? 'bad' : row.pct < 85 ? 'warn' : 'good';
          return (
            <div key={row.id} className="status-line">
              <span className="status-line-icon">
                <Icon size={15} />
              </span>
              <div className="status-line-body">
                <div className="status-line-top">
                  <span className="status-line-label">{row.label}</span>
                  <span className={`status-line-pct text-${tone}`}>{row.pct}%</span>
                </div>
                <div className="status-line-bar">
                  <div className={`status-line-fill ${tone}`} style={{ width: `${row.pct}%` }} />
                </div>
                <span className="status-line-note">{row.status}</span>
              </div>
            </div>
          );
        })}
      </div>
      <button className="hud-panel-more" onClick={() => setPanel('status')}>
        {t('ui.status.details')} <ChevronRight size={14} />
      </button>
    </aside>
  );
}

function happinessKey(h: number): string {
  return h >= 80 ? 'ui.happy.great' : h >= 55 ? 'ui.happy.ok' : h >= 35 ? 'ui.happy.meh' : 'ui.happy.bad';
}
