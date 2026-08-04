import { Settings } from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import { xpForNextLevel } from '../../game/progression/levels.ts';
import { formatMoney, t } from '../../i18n/index.ts';
import { ResourceArt } from '../art/index.ts';
import { brandImage } from '../../assets/registry.ts';
import { ResourceCard } from './ResourceCard.tsx';
import { ResourceDetailPopover } from './ResourceDetailPopover.tsx';
import { HudMetricDetailPopover } from './HudMetricDetailPopover.tsx';
import { DayNightControl, FpsIndicator } from './CameraControls.tsx';

const int = (n: number) => Math.floor(n).toLocaleString('de-DE');
const perMin = (n: number) => (n === 0 ? undefined : `${n > 0 ? '+' : '−'}${int(Math.abs(n))}/min`);

/**
 * The top resource HUD (mockup §2): a circular level badge with XP bar, then one
 * card per resource (icon chip · big value · trend), and a menu button. Purely a
 * composition over ResourceCard — every figure is read live off the controller.
 */
export function GameHud() {
  const game = useGame();
  const openPanel = useUiStore((s) => s.openPanel);
  const setPanel = useUiStore((s) => s.setPanel);
  const { state, derived } = game;
  const res = state.resources;
  const caps = derived.storageCaps;
  const level = state.level.current;

  const nextXp = xpForNextLevel(game.config, level);
  const prevXp = game.config.levels.find((l) => l.level === level)?.xpRequired ?? 0;
  const xpProgress = nextXp === undefined ? 1 : Math.min(1, (state.level.xp - prevXp) / (nextXp - prevXp));

  const income = game.getIncome().net;
  const prod = derived.productionPerMin;
  const growth = game.getGrowthStatus();
  const happiness = Math.round(state.citizens.happiness);
  const crest = brandImage('mayor_crest');
  // Ab wann sind die veredelten Waren Thema? Aus der Config, nicht hier gesetzt
  // — sonst stünde die Zahl an zwei Stellen und liefe auseinander.
  const refinedLevel = game.config.resources.find((r) => r.id === 'planks')?.unlockLevel ?? 1;

  return (
    <header className="game-hud">
      <div className="hud-level" title={`${int(state.level.xp)} XP`}>
        <div className="hud-level-crest">
          {crest ? <img src={crest} alt="" aria-hidden="true" /> : <span className="hud-level-badge">{level}</span>}
          {crest && <span className="hud-level-number">{level}</span>}
        </div>
        <div className="hud-level-text">
          <span className="hud-brand-name">{state.meta.cityName}</span>
          <span className="hud-level-label">{t('ui.hud.city_rank')} · {t('ui.level')} {level}</span>
          <div className="hud-xpbar">
            <div className="hud-xpbar-fill" style={{ width: `${xpProgress * 100}%` }} />
          </div>
          <span className="hud-xp-nums">
            {int(state.level.xp)} / {nextXp === undefined ? '—' : int(nextXp)} XP
          </span>
          {game.config.features.goldSystem && (
            <span className="hud-level-gold">
              <ResourceArt id="gold" size={14} /> {int(state.gold.balance)}
            </span>
          )}
        </div>
      </div>

      <div className="hud-resources">
        <ResourceCard
          icon={<ResourceArt id="money" size={30} />}
          value={formatMoney(res.money)}
          sub={perMin(income)}
          subTone={income < 0 ? 'bad' : 'good'}
          warn={income < 0}
          accent="var(--res-money)"
          title={t('resource.money')}
          detail={(close) => <ResourceDetailPopover id="money" onNavigate={close} />}
        />
        <ResourceCard
          icon={<ResourceArt id="wood" size={30} />}
          value={int(res.wood)}
          sub={perMin(prod.wood)}
          warn={caps.wood > 0 && res.wood >= caps.wood}
          accent="var(--res-wood)"
          title={t('resource.wood')}
          detail={(close) => <ResourceDetailPopover id="wood" onNavigate={close} />}
        />
        {/* § Lieferketten-Overhaul §3: Das Produkt steht direkt hinter seinem
            Rohstoff — Holz · Bretter · Stein · Werkstein. Die Kette ist damit
            an der Leiste ablesbar, ohne dass irgendwo ein Pfeil gezeichnet
            werden muss. Vor Level 5 sind die beiden gedimmt statt versteckt:
            Der Spieler soll sehen, dass da noch etwas kommt. */}
        <ResourceCard
          icon={<ResourceArt id="planks" size={30} />}
          value={int(res.planks)}
          sub={perMin(prod.planks)}
          warn={caps.planks > 0 && res.planks >= caps.planks}
          dim={level < refinedLevel}
          accent="var(--res-planks)"
          title={level < refinedLevel ? `${t('resource.planks')} — ab Level ${refinedLevel}` : t('resource.planks')}
          detail={(close) => <ResourceDetailPopover id="planks" onNavigate={close} />}
        />
        <ResourceCard
          icon={<ResourceArt id="stone" size={30} />}
          value={int(res.stone)}
          sub={perMin(prod.stone)}
          warn={caps.stone > 0 && res.stone >= caps.stone}
          accent="var(--res-stone)"
          title={t('resource.stone')}
          detail={(close) => <ResourceDetailPopover id="stone" onNavigate={close} />}
        />
        <ResourceCard
          icon={<ResourceArt id="cut_stone" size={30} />}
          value={int(res.cut_stone)}
          sub={perMin(prod.cut_stone)}
          warn={caps.cut_stone > 0 && res.cut_stone >= caps.cut_stone}
          dim={level < refinedLevel}
          accent="var(--res-cut-stone)"
          title={level < refinedLevel ? `${t('resource.cut_stone')} — ab Level ${refinedLevel}` : t('resource.cut_stone')}
          detail={(close) => <ResourceDetailPopover id="cut_stone" onNavigate={close} />}
        />
        <ResourceCard
          icon={<ResourceArt id="food" size={30} />}
          value={int(res.food)}
          sub={perMin(prod.food)}
          warn={caps.food > 0 && res.food >= caps.food}
          accent="var(--res-food)"
          title={t('resource.food')}
          detail={(close) => <ResourceDetailPopover id="food" onNavigate={close} />}
        />
        <ResourceCard
          icon={<ResourceArt id="population" size={30} />}
          value={int(state.citizens.population)}
          sub={growth.growing ? perMin(growth.ratePerMin) : undefined}
          subTone="good"
          accent="var(--res-population)"
          title={t('ui.population')}
          detail={(close) => <HudMetricDetailPopover metric="population" onNavigate={close} />}
        />
        <ResourceCard
          icon={<ResourceArt id="happiness" size={30} />}
          value={`${happiness}%`}
          sub={happinessLabel(happiness)}
          subTone={happiness >= 65 ? 'good' : happiness >= 40 ? 'muted' : 'bad'}
          warn={happiness < 40}
          accent="var(--res-happy)"
          title={t('ui.happiness')}
          detail={(close) => <HudMetricDetailPopover metric="happiness" onNavigate={close} />}
        />
      </div>

      <DayNightControl />
      <FpsIndicator />
      <button
        className={`hud-menu-btn hud-settings-btn${openPanel === 'settings' ? ' active' : ''}`}
        onClick={() => setPanel('settings')}
        title={t('ui.settings')}
      >
        <Settings size={19} />
      </button>
    </header>
  );
}

function happinessLabel(h: number): string {
  return t(h >= 80 ? 'ui.happy.great' : h >= 55 ? 'ui.happy.ok' : h >= 35 ? 'ui.happy.meh' : 'ui.happy.bad');
}
