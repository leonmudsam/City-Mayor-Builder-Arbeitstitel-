// § Wirtschafts-/Lieferketten-Overhaul §8 — DAS WERKSTATT-FENSTER.
//
// Vier Fragen, in dieser Reihenfolge, weil der Spieler sie in dieser
// Reihenfolge stellt:
//   1. Läuft es?           → Durchsatz und, wenn nicht, der GRUND
//   2. Was ist drin?       → Eingang und Ausgang als Füllstände
//   3. Was mache ich mit dem Rohstoff?  → verarbeiten oder lagern
//   4. Woher kommt er?     → Quelle, Priorität, was unterwegs ist
//
// Kein einziger Wert wird hier gerechnet. Alles kommt aus `getWorkshopView`,
// und das liest `workshopThroughput` — dieselbe Funktion, nach der der Tick
// verarbeitet (D-048). Die Anzeige kann deshalb nicht „läuft" behaupten,
// während die Werkstatt steht.

import { AlertTriangle, ArrowRight, Pause, Play, Truck } from 'lucide-react';
import { useMemo } from 'react';
import type { WorkshopIdleReason } from '../../game/operations/workshops.ts';
import type { ResourceId } from '../../game/types.ts';
import { t } from '../../i18n/index.ts';
import { useGame } from '../../state/store.ts';
import { ResourceArt } from '../art/index.ts';

const int = (n: number) => Math.round(n).toLocaleString('de-DE');

/**
 * Ein Satz je Stillstandsgrund. Bewusst hier und vollständig getippt über
 * `WorkshopIdleReason`: Kommt ein Grund dazu, verlangt der Compiler den Text —
 * `t()` würde einen fehlenden Schlüssel stumm roh ausgeben (D-046).
 */
const IDLE_TEXT: Record<WorkshopIdleReason, string> = {
  paused: 'Verarbeitung ist ausgeschaltet — sie lagert nur noch ein.',
  no_road: 'Kein Straßenanschluss: Es kommt nichts an und nichts geht hinaus.',
  no_input: 'Kein Rohstoff im Eingangslager. Nachschub ist unterwegs oder es gibt keinen.',
  reserve_hold: 'Der ganze Bestand liegt in der Reserve. Verarbeitungsanteil erhöhen, um ihn freizugeben.',
  output_full: 'Ausgangslager voll — es wird nichts abgeholt.',
  constructing: 'Wird gebaut.',
};

export function WorkshopPanel({ buildingId }: { buildingId: string }) {
  const game = useGame();
  const view = useMemo(() => game.getWorkshopView(buildingId), [game, game.version, buildingId]);
  if (!view) return null;

  const { flow, rule } = view;
  const running = flow.effectivePerMinute > 0;
  const reservePct = Math.round((1 - rule.processRatio) * 100);
  const sources = view.sources.filter((option) => option.stored > 0 || option.buildingId === rule.sourceBuildingId);

  return (
    <section className="as3-detail-card workshop-panel">
      <h3>Verarbeitung</h3>

      <div className={`workshop-flow${running ? '' : ' idle'}`}>
        <Slot resource={flow.input} stored={flow.inputStock} capacity={flow.inputCapacity} label="Eingang" />
        <span className="workshop-arrow" aria-hidden="true">
          <ArrowRight size={18} />
          <small>{flow.inputPerOutput.toLocaleString('de-DE')} : 1</small>
        </span>
        <Slot resource={flow.output} stored={flow.outputStock} capacity={flow.outputCapacity} label="Ausgang" />
      </div>

      <div className="workshop-rate">
        <strong>
          {running ? `${int(flow.effectivePerMinute)} / min` : 'steht'}
        </strong>
        <small>von {int(flow.ratePerMinute)} / min möglich</small>
      </div>

      {flow.idleReason && (
        <p className="inline-warning tone-warning">
          <AlertTriangle size={14} /> {IDLE_TEXT[flow.idleReason]}
        </p>
      )}

      {/* §5 — die eine echte Entscheidung: verarbeiten oder behalten. Ein Regler
          in zwei Lesarten; die absolute Reserve steht daneben, damit „30 %"
          nicht abstrakt bleibt. */}
      <label className="workshop-ratio">
        <span>
          Verarbeiten <strong>{Math.round(rule.processRatio * 100)} %</strong>
          <small> · {reservePct} % lagern (mind. {int(flow.reserve)} {t(`resource.${flow.input}`)})</small>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(rule.processRatio * 100)}
          onChange={(event) => game.setWorkshopRule(buildingId, { processRatio: Number(event.target.value) / 100 })}
        />
      </label>

      <div className="workshop-actions">
        <button
          type="button"
          className={rule.enabled ? 'secondary-action' : 'primary-action'}
          onClick={() => game.setWorkshopRule(buildingId, { enabled: !rule.enabled })}
        >
          {rule.enabled ? <><Pause size={15} /> Verarbeitung anhalten</> : <><Play size={15} /> Verarbeitung starten</>}
        </button>
      </div>

      <h3 className="workshop-subhead">Lieferkette</h3>
      <p className="operation-hint">
        Fahrzeug, Route und Zeitpunkt wählt die Stadt. Du entscheidest, <em>woher</em> und <em>wer zuerst</em>.
      </p>

      <label className="workshop-source">
        <span>Quelle</span>
        <select
          value={rule.sourceBuildingId ?? ''}
          // Leerer Wert = „automatisch". `setSupplyRule` löscht den Eintrag
          // dann, statt ein Gebäude mit der Id '' zu suchen.
          onChange={(event) => game.setWorkshopRule(buildingId, { sourceBuildingId: event.target.value })}
        >
          <option value="">Nächstes Lager mit Bestand (automatisch)</option>
          {sources.map((option) => (
            <option key={option.buildingId} value={option.buildingId} disabled={!option.reachable}>
              {t(option.nameKey)} · {int(option.stored)} {t(`resource.${flow.input}`)}
              {option.reachable ? '' : ' · keine Straßenverbindung'}
            </option>
          ))}
        </select>
      </label>

      <label className="workshop-source">
        <span>Priorität</span>
        <select
          value={String(rule.priority ?? 1)}
          onChange={(event) => game.setWorkshopRule(buildingId, { priority: Number(event.target.value) })}
        >
          <option value="0">Niedrig — zuletzt beliefern</option>
          <option value="1">Normal</option>
          <option value="3">Hoch</option>
          <option value="5">Vorrang — bei knappem Rohstoff zuerst</option>
        </select>
      </label>

      <p className="workshop-incoming">
        <Truck size={14} />
        {view.incoming > 0
          ? `${int(view.incoming)} ${t(`resource.${flow.input}`)} unterwegs`
          : 'Zurzeit ist keine Lieferung unterwegs.'}
      </p>
      {sources.length === 0 && (
        <p className="inline-warning tone-warning">
          <AlertTriangle size={14} /> Kein Stadtlager führt {t(`resource.${flow.input}`)}. Erst ernten und einlagern.
        </p>
      )}
    </section>
  );
}

function Slot({
  resource,
  stored,
  capacity,
  label,
}: {
  resource: ResourceId;
  stored: number;
  capacity: number;
  label: string;
}) {
  const ratio = capacity > 0 ? Math.max(0, Math.min(1, stored / capacity)) : 0;
  return (
    <div className="workshop-slot">
      <span className="workshop-slot-head">
        <ResourceArt id={resource} size={22} />
        <small>{label}</small>
      </span>
      <strong>
        {int(stored)} <i>/ {int(capacity)}</i>
      </strong>
      <span className="workshop-bar">
        <span className="workshop-bar-fill" style={{ width: `${ratio * 100}%` }} />
      </span>
    </div>
  );
}
