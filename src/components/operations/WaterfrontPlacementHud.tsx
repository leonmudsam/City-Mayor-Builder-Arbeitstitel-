import { AlertTriangle, Anchor, CheckCircle2, Layers3, Move3d, RotateCw, Waves } from 'lucide-react';
import type { HoverInfo } from '../../renderer/IMapRenderer.ts';
import { t } from '../../i18n/index.ts';
import { useGame, useUiStore } from '../../state/store.ts';
import { DataMetric, StatusChip } from '../common/GamePanel.tsx';

export function WaterfrontPlacementHud({ info }: { info: HoverInfo }) {
  const game = useGame();
  const rotate = useUiStore((state) => state.rotatePlacing);
  const def = game.config.buildings.get(info.defId);
  const diagnostics = def
    ? game.placementDiagnostics(def.id, info.x, info.y, undefined, info.rotation ?? 0)
    : undefined;
  if (!def?.waterfront || !info.waterfront) return null;
  const preview = info.waterfront;
  const state = !preview.valid ? 'invalid' : preview.roadAccess ? 'valid' : 'restricted';
  const foundationHeight = diagnostics
    ? Math.max(0, diagnostics.surface.maxHeight - diagnostics.surface.minHeight)
    : undefined;

  return (
    <section className={`waterfront-placement-hud state-${state}`}>
      <header>
        <span><Anchor size={21} /></span>
        <div><small>Wassergebäude platzieren</small><h3>{t(def.nameKey)}</h3></div>
        <StatusChip tone={state === 'valid' ? 'good' : state === 'restricted' ? 'warning' : 'danger'}>
          {state === 'valid' ? 'Gültig' : state === 'restricted' ? 'Straße fehlt' : 'Nicht baubar'}
        </StatusChip>
      </header>
      <div className="waterfront-footprint-mini" aria-hidden="true">
        <span className="land-grid">
          {Array.from({ length: def.waterfront.landWidth * def.waterfront.landDepth }, (_, index) => <i key={`l${index}`} />)}
        </span>
        <span className="water-grid">
          {Array.from({ length: def.waterfront.waterWidth * def.waterfront.waterDepth }, (_, index) => <i key={`w${index}`} />)}
        </span>
      </div>
      <div className="waterfront-metrics">
        <DataMetric label="Wassertiefe" value={preview.valid ? preview.minimumDepth.toFixed(1) : '–'} icon={<Waves size={15} />} tone={preview.valid ? 'good' : 'danger'} />
        <DataMetric label="Fundamentausgleich" value={foundationHeight !== undefined ? foundationHeight.toFixed(2) : '–'} icon={<Move3d size={15} />} />
        <DataMetric label="Landfläche" value={`${def.waterfront.landWidth}×${def.waterfront.landDepth}`} icon={<Layers3 size={15} />} />
        <DataMetric label="Wasseranker" value={preview.waterCells.length} icon={<Anchor size={15} />} tone="info" />
      </div>
      <p className={preview.roadAccess ? 'waterfront-ok' : 'inline-warning tone-warning'}>
        {preview.roadAccess ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
        {preview.roadAccess ? 'Straßensnap vorhanden.' : 'Der Standort ist wasserbaulich gültig, benötigt aber noch Straßenanschluss.'}
      </p>
      {preview.reason && <p className="inline-warning tone-danger"><AlertTriangle size={14} /> Platzierungsregel: {preview.reason}</p>}
      <button type="button" className="secondary-action" onClick={rotate}>
        <RotateCw size={15} /> Ausrichtung {info.rotation ?? 0}°
      </button>
      <small className="waterfront-cancel-hint">Linksklick platziert · Rechtsklick bricht ab</small>
    </section>
  );
}
