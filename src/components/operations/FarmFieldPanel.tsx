// § D-058/D-059 — „FELDER VERWALTEN".
//
// Der Zugang zum Feldsystem. Ohne diese Oberfläche existierten Simulation und
// Commands zwar vollständig, waren im Spiel aber nicht erreichbar — und ein
// System ohne Zugang ist kein System.
//
// Bewusst KEIN eigener Rechner: Kosten, Ertrag, Effizienz und Unterhalt kommen
// aus `getFarmFieldPlan`/`getFarmFieldSummary`. Was hier steht, ist genau das,
// was der Command gleich tut (D-048) — die Vorschau kann nichts versprechen,
// was das Anlegen ablehnt.

import { Eraser, Sprout, Wallet, Wheat } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { t } from '../../i18n/index.ts';
import { useGame, useUiStore } from '../../state/store.ts';
import { GamePanel, GameSectionHeader, StatusChip } from '../common/GamePanel.tsx';

/**
 * Die kaufbaren Feldgrößen. Genau die vier aus dem Mockup — der Spieler wählt
 * eine Größe mit Preis, statt ein Rechteck zu ziehen und hinterher zu erfahren,
 * was es kostet.
 */
const FIELD_SIZES: { w: number; h: number }[] = [
  { w: 4, h: 4 },
  { w: 4, h: 6 },
  { w: 6, h: 6 },
  { w: 6, h: 8 },
];

export function FarmFieldPanel() {
  const game = useGame();
  const {
    fieldToolBuildingId,
    fieldBrush,
    fieldToolMode,
    closeFieldTool,
    setFieldBrush,
    setFieldToolMode,
  } = useUiStore();

  const summary = useMemo(
    () => (fieldToolBuildingId ? game.getFarmFieldSummary(fieldToolBuildingId) : undefined),
    [game, game.version, fieldToolBuildingId],
  );
  const fields = useMemo(
    () => (fieldToolBuildingId ? game.getFarmFields(fieldToolBuildingId) : []),
    [game, game.version, fieldToolBuildingId],
  );

  // Wird die Farm abgerissen, während das Werkzeug offen ist, schließt es sich.
  useEffect(() => {
    if (fieldToolBuildingId && !game.state.buildings[fieldToolBuildingId]) closeFieldTool();
  }, [closeFieldTool, fieldToolBuildingId, game, game.version]);

  if (!fieldToolBuildingId || !summary) return null;

  const building = game.state.buildings[fieldToolBuildingId];
  const def = building ? game.config.buildings.get(building.defId) : undefined;
  const name = def ? t(def.nameKey) : 'Farm';
  const ripe = fields.filter((field) => field.growth > 0.6).length;

  return (
    <div className="field-tool-layout" onClick={(event) => event.stopPropagation()}>
      <GamePanel
        title={`Felder verwalten · ${name}`}
        eyebrow="Nahrungsproduktion"
        icon={<Wheat size={23} />}
        className="field-tool-panel"
        actions={
          <button className="icon-button" type="button" onClick={closeFieldTool} aria-label="Felder schließen">
            ✕
          </button>
        }
      >
        <p className="operation-hint">
          Felder sind die Produktionsfläche der Farm. Wähle eine Größe und setze sie auf der Karte —
          je näher an der Farm, desto höher der Ertrag.
        </p>

        <div className="field-summary-grid">
          <Metric label="Felder" value={`${summary.tiles}`} hint="Kacheln bewirtschaftet" />
          <Metric label="Erntereif" value={`${ripe}`} hint="Kacheln über 60 %" />
          <Metric
            label="Mittlere Effizienz"
            value={`${summary.averageEfficiencyPct}%`}
            hint={`voll bis ${summary.efficientRadius} Felder Abstand`}
            {...(summary.averageEfficiencyPct < 80 ? { tone: 'warn' as const } : {})}
          />
          <Metric
            label="Unterhalt"
            value={`${summary.upkeepPerMinute} ⌾`}
            hint="je Minute, aus der Feldzahl"
          />
          <Metric
            label="Arbeiter"
            value={`${summary.workersNeeded} / ${summary.workerSlots}`}
            hint="benötigt / vorhanden"
            {...(summary.workersNeeded > summary.workerSlots ? { tone: 'warn' as const } : {})}
          />
        </div>

        {summary.workersNeeded > summary.workerSlots ? (
          <p className="inline-warning tone-warning">
            Mehr Feld als Hände: Die Farm bewirtschaftet nur so viel, wie ihre Arbeiter schaffen.
            Ausbauen oder Felder zurückbauen.
          </p>
        ) : null}

        <section className="field-size-section">
          <GameSectionHeader
            title="Neues Feld kaufen"
            detail={`${summary.costPerTile} ⌾ je Kachel`}
            action={
              <StatusChip tone={fieldToolMode === 'remove' ? 'warning' : 'good'}>
                {fieldToolMode === 'remove' ? 'Roden' : 'Anlegen'}
              </StatusChip>
            }
          />
          <div className="field-size-grid">
            {FIELD_SIZES.map((size) => {
              const active = fieldBrush.w === size.w && fieldBrush.h === size.h;
              return (
                <button
                  key={`${size.w}x${size.h}`}
                  type="button"
                  className={`field-size-option${active ? ' active' : ''}`}
                  onClick={() => {
                    setFieldBrush(size);
                    setFieldToolMode('add');
                  }}
                >
                  <strong>{size.w} × {size.h}</strong>
                  <span>{size.w * size.h} Kacheln</span>
                  <small>
                    <Wallet size={12} /> {(size.w * size.h * summary.costPerTile).toLocaleString('de-DE')} ⌾
                  </small>
                </button>
              );
            })}
          </div>
        </section>

        <div className="field-tool-actions">
          <button
            type="button"
            className={fieldToolMode === 'add' ? 'primary-action' : 'secondary-action'}
            onClick={() => setFieldToolMode('add')}
          >
            <Sprout size={16} /> Feld anlegen
          </button>
          <button
            type="button"
            className={fieldToolMode === 'remove' ? 'primary-action' : 'secondary-action'}
            onClick={() => setFieldToolMode('remove')}
          >
            <Eraser size={16} /> Feld roden
          </button>
        </div>

        <p className="operation-hint">
          Fruchtbares Land gibt einen Bonus, ist aber keine Bedingung — auf Wiese wächst es auch.
          ESC beendet das Werkzeug.
        </p>
      </GamePanel>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: 'warn';
}) {
  return (
    <div className={`field-metric${tone ? ` ${tone}` : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </div>
  );
}
