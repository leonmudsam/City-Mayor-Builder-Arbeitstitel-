import { CheckCircle2, LocateFixed, MessageCircleWarning } from 'lucide-react';
import { uiImage } from '../../assets/registry.ts';
import type { InfrastructureWarning } from '../../game/activities/logistics.ts';

const COPY: Record<InfrastructureWarning['code'], { title: string; text: string }> = {
  oversized_target: {
    title: 'Fahrzeugkapazität reicht nicht',
    text: 'Mindestens ein einzelnes Ziel benötigt mehr Ladung als dieses Fahrzeug aufnehmen kann.',
  },
  many_reloads: {
    title: 'Viele Nachfüllfahrten',
    text: 'Ein größeres Fahrzeug oder eine besser angebundene Quelle würde mehrere Leerfahrten vermeiden.',
  },
  high_empty_travel: {
    title: 'Hoher Leerfahrtanteil',
    text: 'Deine Tour verbringt einen großen Teil der Strecke ohne Ladung. Prüfe die Quellrückkehr.',
  },
  low_vehicle_suitability: {
    title: 'Fahrzeug passt nur bedingt',
    text: 'Kapazität, Handling und Straßenbelastung ergeben für diese Route eine schwache Kombination.',
  },
  oversized_vehicle: {
    title: 'Fahrzeug überdimensioniert',
    text: 'Ein kompakteres Fahrzeug würde diesen Auftrag günstiger und wendiger erledigen.',
  },
  perishable_no_cooling: {
    title: 'Verderbliche Ladung',
    text: 'Ohne Kühlung steigt auf dieser Fahrzeit das Qualitätsrisiko. Ein Kühlfahrzeug wäre sicherer.',
  },
  incomplete_road: {
    title: 'Straßenanschluss unvollständig',
    text: 'Nicht alle Abschnitte liegen auf dem verbundenen Straßennetz. Prüfe die markierte Tour.',
  },
  narrow_streets: {
    title: 'Enges, belastetes Netz',
    text: 'Das gewählte Fahrzeug verliert auf den engen und vollen Abschnitten spürbar Zeit.',
  },
};

export function InfrastructureAdvisor({
  warnings,
  routeComplete,
  onShowRoute,
}: {
  warnings: InfrastructureWarning[];
  routeComplete: boolean;
  onShowRoute(): void;
}) {
  const warning = warnings.find((candidate) => candidate.severity === 'critical') ?? warnings.find((candidate) => candidate.severity === 'warn') ?? warnings[0];
  const copy = warning ? COPY[warning.code] : routeComplete
    ? { title: 'Route ist einsatzbereit', text: 'Alle Pflichtziele, Ladungen und Straßenabschnitte sind konsistent geplant.' }
    : { title: 'Ich analysiere deine Tour', text: 'Zeichne weiter. Sobald alle Ziele verbunden sind, prüfe ich Leerfahrt, Kapazität und Netzlast.' };
  const logistics = warning?.code === 'many_reloads' || warning?.code === 'high_empty_travel' || warning?.code === 'oversized_target';
  const portrait = uiImage(logistics ? 'advisor_logistics' : 'advisor_traffic');

  return (
    <aside className={`citywork-v4-advisor${warning ? ` ${warning.severity}` : routeComplete ? ' success' : ''}`}>
      <div className="citywork-v4-advisor-portrait">
        {portrait ? <img src={portrait} alt="" /> : <MessageCircleWarning size={34} />}
      </div>
      <div>
        <small>{logistics ? 'Logistikberaterin' : 'Verkehrsberater'}</small>
        <strong>{copy.title}</strong>
        <p>{copy.text}</p>
      </div>
      <button onClick={onShowRoute}>
        {routeComplete && !warning ? <CheckCircle2 size={15} /> : <LocateFixed size={15} />}
        Route zeigen
      </button>
    </aside>
  );
}
