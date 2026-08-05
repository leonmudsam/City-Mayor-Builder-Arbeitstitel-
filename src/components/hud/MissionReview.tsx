// § Stadtarbeit 3.0 / D-061 — DIE ZWISCHENBILANZ GEHÖRT ZUM AUSSTIEG.
//
// Bisher lag sie im Planer, weil dort gefahren wurde. Seit D-068 fährt der
// Spieler in der Welt und steigt dort aus (Q) — läge die Bilanz weiter im
// Planer, käme er kommentarlos in der Stadt heraus und müsste ein Panel
// öffnen, um zu erfahren, was seine Fahrt wert war.
//
// Der Inhalt ist unverändert `RouteReview`: dieselben vier Zahlen, dieselben
// zwei Auswege, dieselbe `modeRewardFactor`, die auch auszahlt (D-048). Diese
// Datei entscheidet nichts — sie beantwortet nur die Frage, WANN die Bilanz
// erscheint, und beschafft die Zahlen als reine Projektion.

import { useMemo } from 'react';
import { modeRewardFactor } from '../../game/activities/transportOrder.ts';
import { t } from '../../i18n/index.ts';
import { getMapApi, useGame, useUiStore } from '../../state/store.ts';
import { RouteReview } from '../citywork/RouteReview.tsx';

export function MissionReview() {
  const game = useGame();
  const open = useUiStore((s) => s.missionReviewOpen);
  const setOpen = useUiStore((s) => s.setMissionReviewOpen);
  const setMissionFollow = useUiStore((s) => s.setMissionFollow);
  const pushToast = useUiStore((s) => s.pushToast);
  const active = game.state.activities.active;

  const cargo = useMemo(
    () => (active ? game.getActivityCargoStatus() : undefined),
    [game, game.version, active],
  );
  const context = useMemo(
    () => (active ? game.getActivityPlanningContext(active.defId) : undefined),
    [game, game.version, active],
  );

  if (!open || !active || !context) return null;

  const factor = modeRewardFactor(
    game.getActiveTransportMode() ?? 'auto',
    game.config.activities.manualDriveBonusFactor,
  );
  const bonusPercent = Math.round(
    (modeRewardFactor('manual', game.config.activities.manualDriveBonusFactor) - 1) * 100,
  );
  // Die Kachelkette ist ein PFAD: n Kacheln sind n−1 gefahrene Abschnitte.
  const drivenTiles = Math.max(0, (active.plannedRoadPath?.length ?? 1) - 1);

  return (
    <div className="mission-review-shell">
      <RouteReview
        drivenTiles={drivenTiles}
        stopsDone={active.targets.filter((target) => target.done).length}
        stopsTotal={active.targets.length}
        cargoOnboard={cargo?.onboard}
        cargoCapacity={cargo?.capacity}
        rewardMoney={Math.round(context.reward.money * factor)}
        rewardXp={Math.round(context.reward.xp * factor)}
        bonusLostPercent={bonusPercent}
        onResume={() => {
          setOpen(false);
          // Zurück ans Steuer heißt: zurück in die Welt — derselbe Einstieg wie
          // beim Annehmen des Auftrags, kein zweiter Weg ins Fahrzeug.
          if (!getMapApi()?.enterDrive()) {
            pushToast('Kein befahrbarer Straßenanschluss für diesen Einsatz.', 'error');
          }
        }}
        onHandOver={() => {
          const result = game.handOverActivityDrive();
          if (!result.ok) {
            pushToast(t(`error.${result.error}`), 'error');
            return;
          }
          setOpen(false);
          pushToast('Übergeben. Die Stadt fährt die offenen Ziele in der Welt ab.', 'success');
          requestAnimationFrame(() => setMissionFollow(true));
        }}
      />
    </div>
  );
}
