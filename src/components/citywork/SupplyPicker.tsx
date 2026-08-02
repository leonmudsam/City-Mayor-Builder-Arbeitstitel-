// § Stadtarbeit P4 / §8 „LAGER UND NACHLADEN" — die Wahl des Ladeorts.
//
// Der Auftrag verlangt ausdrücklich: „Keine globale magische Ressource. Jedes
// Lager hat eigene Bestände." Genau das zeigt diese Liste — Bestand, Kapazität
// und die einzige Frage, die zählt: reicht das hier für die geplanten Ziele?
//
// Die Zahlen kommen aus `GameController.getActivitySupplyOptions`, das sie aus
// dem Bestandsregister liest. Hier wird NICHTS nachgerechnet: eine zweite
// Rechnung wäre der erste Schritt zu zwei Beständen für dasselbe Lager.

import { AlertTriangle, Check, Warehouse } from 'lucide-react';
import type { ActivitySupplyOption } from '../../game/commands/controller.ts';
import type { ResourceId } from '../../game/types.ts';

const RESOURCE_LABEL: Record<ResourceId, string> = {
  money: 'Geld',
  wood: 'Holz',
  stone: 'Stein',
  food: 'Nahrung',
  freshwater: 'Frischwasser',
};

const amount = (value: number): string => Math.round(value).toLocaleString('de-DE');

export interface SupplyPickerProps {
  options: ActivitySupplyOption[];
  selectedId: string | undefined;
  /** Anzeigename je Gebäude (aus der Config, nicht hier erfunden). */
  nameOf: (option: ActivitySupplyOption) => string;
  /** Luftlinie zum ersten Ziel in Metern — macht den Umweg vergleichbar. */
  distanceOf?: (option: ActivitySupplyOption) => number | undefined;
  onSelect: (buildingId: string) => void;
  /** Nach dem Start ist der Ladeort festgeschrieben (wie die Ausführungsart). */
  locked?: boolean;
}

export function SupplyPicker({
  options,
  selectedId,
  nameOf,
  distanceOf,
  onSelect,
  locked = false,
}: SupplyPickerProps) {
  if (options.length === 0) return null;
  const resource = options[0]?.resource;
  const needed = options[0]?.needed ?? 0;

  return (
    <div className="citywork-supply">
      <header className="citywork-supply-head">
        <Warehouse size={15} />
        <span>Woher laden?</span>
        {resource && needed > 0 && (
          <small>
            {amount(needed)} {RESOURCE_LABEL[resource]} nötig
          </small>
        )}
      </header>
      <ul className="citywork-supply-list">
        {options.map((option) => {
          const selected = option.buildingId === selectedId;
          const distance = distanceOf?.(option);
          return (
            <li key={option.buildingId}>
              <button
                type="button"
                className={`citywork-supply-option${selected ? ' selected' : ''}${
                  option.sufficient ? '' : ' short'
                }`}
                aria-pressed={selected}
                disabled={locked && !selected}
                onClick={() => onSelect(option.buildingId)}
              >
                <span className="citywork-supply-name">
                  {selected ? <Check size={14} /> : option.sufficient ? null : <AlertTriangle size={14} />}
                  {nameOf(option)}
                </span>
                <span className="citywork-supply-stock">
                  {amount(option.stored)}
                  <small> / {amount(option.capacity)}</small>
                </span>
                {distance !== undefined && <span className="citywork-supply-distance">{Math.round(distance)} m</span>}
                {!option.sufficient && (
                  <span className="citywork-supply-warn">
                    reicht nicht — {amount(Math.max(0, option.needed - option.stored))} fehlen
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {locked && <small className="citywork-supply-locked">Geladen wird hier — beim Start festgelegt.</small>}
    </div>
  );
}
