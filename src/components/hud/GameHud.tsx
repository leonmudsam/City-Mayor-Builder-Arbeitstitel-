import { Menu, Users } from 'lucide-react';
import { useGame, useUiStore } from '../../state/store.ts';
import { xpForNextLevel } from '../../game/progression/levels.ts';
import { formatMoney, t } from '../../i18n/index.ts';
import { GoldIcon, NeedIcon, ResourceIcon } from '../common/icons.tsx';
import { ResourceCard } from './ResourceCard.tsx';
import { ResourceDetailPopover } from './ResourceDetailPopover.tsx';

const int = (n: number) => Math.floor(n).toLocaleString('de-DE');
const perMin = (n: number) => (n === 0 ? undefined : `${n > 0 ? '+' : '−'}${int(Math.abs(n))}/min`);

/**
 * The top resource HUD (mockup §2): a circular level badge with XP bar, then one
 * card per resource (icon chip · big value · trend), and a menu button. Purely a
 * composition over ResourceCard — every figure is read live off the controller.
 */
export function GameHud() {
  const game = useGame();
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
  const hasFreshwater = caps.freshwater > 0;
  const waterFulfil = Math.round(state.citizens.needs.water.fulfillment * 100);

  return (
    <header className="game-hud">
      <div className="hud-level" title={`${int(state.level.xp)} XP`}>
        <div className="hud-level-badge">{level}</div>
        <div className="hud-level-text">
          <span className="hud-level-label">{t('ui.level')} {level}</span>
          <div className="hud-xpbar">
            <div className="hud-xpbar-fill" style={{ width: `${xpProgress * 100}%` }} />
          </div>
          <span className="hud-xp-nums">
            {int(state.level.xp)} / {nextXp === undefined ? '—' : int(nextXp)} XP
          </span>
        </div>
      </div>

      <div className="hud-resources">
        <ResourceCard
          icon={<ResourceIcon id="money" size={18} />}
          value={formatMoney(res.money)}
          sub={perMin(income)}
          subTone={income < 0 ? 'bad' : 'good'}
          warn={income < 0}
          accent="var(--res-money)"
          title={t('resource.money')}
          detail={<ResourceDetailPopover id="money" />}
        />
        {game.config.features.goldSystem && (
          <ResourceCard
            icon={<GoldIcon size={18} />}
            value={int(state.gold.balance)}
            accent="var(--res-gold)"
            title={t('ui.gold')}
          />
        )}
        <ResourceCard
          icon={<ResourceIcon id="wood" size={18} />}
          value={int(res.wood)}
          sub={perMin(prod.wood)}
          warn={caps.wood > 0 && res.wood >= caps.wood}
          accent="var(--res-wood)"
          title={t('resource.wood')}
          detail={<ResourceDetailPopover id="wood" />}
        />
        <ResourceCard
          icon={<ResourceIcon id="stone" size={18} />}
          value={int(res.stone)}
          sub={perMin(prod.stone)}
          warn={caps.stone > 0 && res.stone >= caps.stone}
          accent="var(--res-stone)"
          title={t('resource.stone')}
          detail={<ResourceDetailPopover id="stone" />}
        />
        <ResourceCard
          icon={<ResourceIcon id="food" size={18} />}
          value={int(res.food)}
          sub={perMin(prod.food)}
          warn={caps.food > 0 && res.food >= caps.food}
          accent="var(--res-food)"
          title={t('resource.food')}
          detail={<ResourceDetailPopover id="food" />}
        />
        {hasFreshwater ? (
          <ResourceCard
            icon={<ResourceIcon id="freshwater" size={18} />}
            value={int(res.freshwater)}
            sub={perMin(prod.freshwater)}
            warn={res.freshwater >= caps.freshwater}
            accent="var(--res-water)"
            title={t('resource.freshwater')}
          />
        ) : (
          level >= 3 && (
            <ResourceCard
              icon={<NeedIcon id="water" size={18} />}
              value={`${waterFulfil}%`}
              sub={t('ui.water.coverage')}
              subTone="muted"
              warn={waterFulfil < 100}
              accent="var(--res-water)"
              title={t('need.water')}
            />
          )
        )}
        <ResourceCard
          icon={<Users size={18} />}
          value={int(state.citizens.population)}
          sub={growth.growing ? perMin(growth.ratePerMin) : undefined}
          subTone="good"
          accent="var(--res-population)"
          title={t('ui.population')}
        />
        <ResourceCard
          icon={<HappyGlyph happiness={happiness} />}
          value={`${happiness}%`}
          sub={happinessLabel(happiness)}
          subTone={happiness >= 65 ? 'good' : happiness >= 40 ? 'muted' : 'bad'}
          warn={happiness < 40}
          accent="var(--res-happy)"
          title={t('ui.happiness')}
        />
      </div>

      <button className="hud-menu-btn" onClick={() => useUiStore.getState().setPanel('menu')} title={t('ui.menu')}>
        <Menu size={20} />
      </button>
    </header>
  );
}

function happinessLabel(h: number): string {
  return t(h >= 80 ? 'ui.happy.great' : h >= 55 ? 'ui.happy.ok' : h >= 35 ? 'ui.happy.meh' : 'ui.happy.bad');
}

function HappyGlyph({ happiness }: { happiness: number }) {
  // Reuse the need icon vocabulary is wrong here (leisure), so draw a simple
  // dot-face whose colour tracks mood — cheap, on-brand, no emoji.
  const tone = happiness >= 65 ? 'var(--good)' : happiness >= 40 ? 'var(--warn)' : 'var(--bad)';
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="none" stroke={tone} strokeWidth="2" />
      <circle cx="8.5" cy="10" r="1.3" fill={tone} />
      <circle cx="15.5" cy="10" r="1.3" fill={tone} />
      {happiness >= 55 ? (
        <path d="M8 14.5 Q12 17.5 16 14.5" fill="none" stroke={tone} strokeWidth="1.8" strokeLinecap="round" />
      ) : happiness >= 35 ? (
        <path d="M8.5 15 H15.5" fill="none" stroke={tone} strokeWidth="1.8" strokeLinecap="round" />
      ) : (
        <path d="M8 16 Q12 13 16 16" fill="none" stroke={tone} strokeWidth="1.8" strokeLinecap="round" />
      )}
    </svg>
  );
}
