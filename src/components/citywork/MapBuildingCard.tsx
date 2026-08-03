// § Stadtarbeit-Overhaul P5 (§6 des Auftrags) — DAS GEBÄUDE ANTWORTET.
//
// „Jedes relevante Gebäude auf der Karte soll interaktiv sein: Lager (Bestand
// ansehen, laden), Farm, Markt, Rathaus, Hafen, Wohnhaus (Bedarf, Lieferung)."
//
// Diese Karte zeigt AUSSCHLIESSLICH, was die Simulation weiß, und bietet
// ausschließlich an, was sie auch ausführt. Der Auftrag nennt zusätzlich
// „als Zwischenstopp hinzufügen" und „Priorität" — beides gibt es im Spiel
// nicht: Seit D-054 entsteht die Reihenfolge beim Fahren, es gibt keine
// Stoppliste, die man ergänzen könnte, und `priority` ist ein deklarierter
// Vertrag ohne Wirkung (D-050). Ein Knopf dafür wäre eine Attrappe; er fehlt
// deshalb, statt zu enttäuschen.
//
// Warum die Bestände hier ortsgenau stehen (D-052): `state.resources` ist die
// BILANZ der Stadt, das Register sagt, WO die Ware liegt. Genau das macht die
// Wahl des Lagers zu einer Entscheidung — und sie wäre wertlos, wenn die Karte
// am Lager die Stadtsumme zeigte.

import { AlertTriangle, Boxes, Factory, PackagePlus, Ship, Truck, X } from 'lucide-react';
import type { CityworkBuildingInfo, CityworkReloadBlocker } from '../../game/commands/controller.ts';
import { ROAD_TILE_METERS } from '../../game/roads/roadProfile.ts';
import { t } from '../../i18n/index.ts';

/** § D-046: aufzählbar, damit kein Zustand ohne Text bleibt. */
const RELOAD_BLOCKER_TEXT: Record<CityworkReloadBlocker, string> = {
  no_mission: 'Erst einen Auftrag annehmen.',
  no_cargo_mission: 'Dieser Auftrag transportiert keine Ware.',
  not_a_store: 'Hier lagert die Stadt nichts — Ware gibt es nur an einem Lager.',
  cargo_full: 'Der Wagen hat genug für alle offenen Ziele geladen.',
  insufficient: 'Dieses Lager führt zu wenig für eine ganze Lieferung.',
};

const IDLE_REASON_TEXT: Record<string, string> = {
  paused: 'Der Betrieb ist angehalten.',
  waiting_for_regrowth: 'Wartet auf Nachwuchs im Arbeitsgebiet.',
  deposit_exhausted: 'Das Vorkommen im Arbeitsgebiet ist erschöpft.',
  storage_full: 'Das Betriebslager ist voll.',
  no_targets: 'Kein Vorkommen im Arbeitsgebiet.',
};

export function MapBuildingCard({
  info,
  distanceTiles,
  atHand,
  onReload,
  onClose,
}: {
  info: CityworkBuildingInfo;
  /** Luftlinie des Fahrzeugs zum Gebäude; `undefined`, solange niemand fährt. */
  distanceTiles: number | undefined;
  /**
   * Steht der Wagen hier? Kommt aus DERSELBEN Ankunftsregel wie das Ausliefern
   * (`reachedTarget` in der Fahrschleife, D-057). Die Simulation prüft keine
   * Entfernung — täte die Karte es mit einer eigenen Rechnung, gäbe es zwei
   * Reichweitenbegriffe.
   */
  atHand: boolean;
  onReload(): void;
  onClose(): void;
}) {
  const role = info.isHarbour
    ? { icon: <Ship size={15} />, label: 'Hafen' }
    : info.operation
      ? { icon: <Factory size={15} />, label: 'Betrieb' }
      : info.isStore
        ? { icon: <Boxes size={15} />, label: 'Lager' }
        : { icon: <Truck size={15} />, label: 'Gebäude' };

  return (
    <aside className="citywork-building-card">
      <header>
        <span className="citywork-building-role">{role.icon} {role.label}</span>
        <strong>{t(`building.${info.defId}`)}</strong>
        <button type="button" onClick={onClose} title="Schließen"><X size={16} /></button>
      </header>

      <div className="citywork-building-meta">
        <span>Stufe {info.upgradeLevel + 1}</span>
        {distanceTiles !== undefined && (
          <span>{Math.round(distanceTiles * ROAD_TILE_METERS)} m entfernt</span>
        )}
      </div>

      {/* Lager: der ORT, nicht die Stadtbilanz (D-052). */}
      {info.isStore && (
        <section className="citywork-building-stock">
          <h4>Bestand hier</h4>
          {info.stock.length === 0 ? (
            <p>Dieses Lager hat noch keine Kapazität.</p>
          ) : (
            <ul>
              {info.stock.map((entry) => (
                <li key={entry.resource}>
                  <span>{t(`resource.${entry.resource}`)}</span>
                  <b>{Math.floor(entry.amount)}</b>
                  <small>von {Math.floor(entry.cap)}</small>
                  <i style={{ width: `${Math.min(100, entry.cap > 0 ? (entry.amount / entry.cap) * 100 : 0)}%` }} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Betrieb: was hier entsteht — und warum gerade nicht. */}
      {info.operation && (
        <section className="citywork-building-operation">
          <h4>{t(`resource.${info.operation.resource}`)}</h4>
          <b>{info.operation.perMinute.toFixed(1)} / Min.</b>
          {info.operation.idleReason && (
            <p className="warn">
              <AlertTriangle size={13} /> {IDLE_REASON_TEXT[info.operation.idleReason] ?? info.operation.idleReason}
            </p>
          )}
        </section>
      )}

      {/* Lieferziel: Bedarf, Lieferung, Restmenge (§6). */}
      {info.delivery && (
        <section className="citywork-building-delivery">
          <h4>{info.delivery.done ? 'Beliefert' : 'Braucht noch'}</h4>
          <b>{info.delivery.amount} {t(`resource.${info.delivery.resource}`)}</b>
          {/* Kein Ausliefer-Knopf: Geliefert wird durch ANKOMMEN (D-054). Ein
              Knopf aus der Ferne wäre eine zweite, bequemere Art zu liefern —
              und damit das Ende des Fahrens. */}
          {!info.delivery.done && <small>Wird geliefert, sobald du hier ankommst.</small>}
        </section>
      )}

      {/* Laden: genau dann aktiv, wenn der Command es annimmt (D-048). */}
      {(info.isStore || info.reloadBlocker === 'insufficient' || info.reloadBlocker === 'cargo_full') && (
        <div className="citywork-building-actions">
          <button
            type="button"
            className="btn-primary"
            disabled={info.reloadBlocker !== undefined || !atHand}
            onClick={onReload}
          >
            <PackagePlus size={15} /> Hier laden
          </button>
          {info.reloadBlocker
            ? <small>{RELOAD_BLOCKER_TEXT[info.reloadBlocker]}</small>
            : !atHand && <small>Fahr hin — geladen wird dort, wo die Ware liegt.</small>}
        </div>
      )}
    </aside>
  );
}
