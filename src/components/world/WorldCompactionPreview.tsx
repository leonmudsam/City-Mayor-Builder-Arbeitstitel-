import { ArrowRight, Building2, Map, Route, Trees } from 'lucide-react';

/**
 * Dev-/Dokumentationsvergleich aus den auditierten Bake-Ergebnissen v0.76/v0.80.
 * Kein produktiver Progressionszustand und keine aus der Simulation geschätzten
 * Transportzeiten.
 */
export function WorldCompactionPreview() {
  return (
    <section className="world-compaction-preview">
      <header><Map size={16} /><div><small>Nur Entwicklung</small><strong>Weltverdichtung</strong></div></header>
      <div className="world-compaction-compare">
        <article>
          <small>Vor Verdichtung</small>
          <strong>40 Regionen</strong>
          <i style={{ width: '100%' }} />
          <span>Startkern 820 Bauflächen</span>
        </article>
        <ArrowRight size={19} />
        <article className="current">
          <small>Aktueller Bake</small>
          <strong>13 Regionen</strong>
          <i style={{ width: '79.3%' }} />
          <span>Zentralland 1.400 Bauflächen</span>
        </article>
      </div>
      <div className="world-compaction-facts">
        <span><Map size={13} /><b>−20,7 %</b><small>Inselfläche</small></span>
        <span><Route size={13} /><b>Kompakter</b><small>Transportwege</small></span>
        <span><Building2 size={13} /><b>Dichter</b><small>Stadtentwicklung</small></span>
        <span><Trees size={13} /><b>409</b><small>Waldkacheln im Start</small></span>
      </div>
      <p>Historische Bake-Kennzahlen; rein dokumentarisch, nicht Teil von Save oder Balancing.</p>
    </section>
  );
}
