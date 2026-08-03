// § Stadtarbeit-Overhaul P6 (§8 Phase 4+5) — DIE GEFAHRENE ROUTE, GEPRÜFT.
//
// „Phase 4: Route prüfen — Distanz, Stopps, Ladepunkte, Dauer, Kosten,
//  Qualität. Phase 5: Auftrag ausführen — Route wird in echter 3D-Welt
//  abgefahren."
//
// Alles hier ist gemessen, nichts geschätzt: Die Strecke ist die aufgezeichnete
// Kachelkette aus `plannedRoadPath` (D-054 — das Protokoll der Fahrt, kein
// Plan), die Stopps sind die erledigten Ziele in Besuchsreihenfolge, die
// Prämie kommt aus derselben `modeRewardFactor`, die auch auszahlt (D-048).
//
// Und die eine ehrliche Zeile, die dieser Ansicht ihren Sinn gibt: Übergeben
// heißt, den Aufschlag fürs Selbstfahren abzugeben. Das ist keine Strafe,
// sondern der Preis dafür, dass die Stadt den Rest fährt (D-061).

import { CheckCircle2, Flag, Gauge, Play, Route as RouteIcon, Truck } from 'lucide-react';
import { ROAD_TILE_METERS } from '../../game/roads/roadProfile.ts';
import { formatMoney } from '../../i18n/index.ts';

export function RouteReview({
  drivenTiles,
  stopsDone,
  stopsTotal,
  cargoOnboard,
  cargoCapacity,
  rewardMoney,
  rewardXp,
  bonusLostPercent,
  onResume,
  onHandOver,
}: {
  drivenTiles: number;
  stopsDone: number;
  stopsTotal: number;
  cargoOnboard: number | undefined;
  cargoCapacity: number | undefined;
  rewardMoney: number;
  rewardXp: number;
  /** Wie viel Prämie die Übergabe kostet — der Spieler soll es vorher wissen. */
  bonusLostPercent: number;
  onResume(): void;
  onHandOver(): void;
}) {
  const open = Math.max(0, stopsTotal - stopsDone);
  return (
    <div className="citywork-review">
      <header>
        <span><RouteIcon size={15} /> Deine Route</span>
        <strong>{open === 0 ? 'Tour gefahren' : `Noch ${open} von ${stopsTotal} Zielen offen`}</strong>
      </header>

      <dl className="citywork-review-figures">
        <div>
          <dt><Gauge size={13} /> Strecke</dt>
          <dd>{(drivenTiles * ROAD_TILE_METERS / 1000).toFixed(1)} km</dd>
        </div>
        <div>
          <dt><Flag size={13} /> Stopps</dt>
          <dd>{stopsDone} / {stopsTotal}</dd>
        </div>
        <div>
          <dt><Truck size={13} /> Ladung</dt>
          <dd>{cargoOnboard !== undefined ? `${Math.floor(cargoOnboard)}${cargoCapacity ? ` / ${Math.floor(cargoCapacity)}` : ''}` : '—'}</dd>
        </div>
        <div>
          <dt><CheckCircle2 size={13} /> Prämie</dt>
          <dd>{formatMoney(rewardMoney)} · {rewardXp} XP</dd>
        </div>
      </dl>

      <div className="citywork-review-actions">
        <button type="button" className="btn-primary" onClick={onResume}>
          <Play size={15} /> Weiterfahren
        </button>
        <button type="button" className="btn-secondary" onClick={onHandOver}>
          Tour in 3D fahren lassen
        </button>
      </div>
      <small>
        Die Stadt fährt die offenen Ziele in der echten Welt ab. Der Aufschlag fürs
        Selbstfahren entfällt dann für die ganze Tour ({bonusLostPercent} %).
      </small>
    </div>
  );
}
