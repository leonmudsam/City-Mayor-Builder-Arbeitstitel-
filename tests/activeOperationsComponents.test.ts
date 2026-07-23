import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CapacityBar,
  DataMetric,
  EmptyStateCard,
  GamePanel,
  StatusChip,
} from '../src/components/common/GamePanel.tsx';
import { useUiStore } from '../src/state/store.ts';

describe('Active Operations UI-Grundbausteine', () => {
  it('rendert minimale, leere und große Inhalte ohne optionale Daten', () => {
    const longTitle =
      'Sägewerk am außergewöhnlich langen nördlichen Stadttor von Zentralland';
    const markup = renderToStaticMarkup(
      createElement(
        GamePanel,
        { title: longTitle, eyebrow: 'Aktiver Betrieb' },
        createElement(DataMetric, {
          label: 'Gesamtbestand',
          value: 9_876_543,
          tone: 'info',
        }),
        createElement(CapacityBar, {
          label: 'Lokales Lager',
          used: 120,
          capacity: 120,
        }),
        createElement(StatusChip, { tone: 'warning', children: 'Lager fast voll' }),
        createElement(EmptyStateCard, {
          title: 'Keine Standorte',
          detail: 'Sobald ein lokales Lager existiert, erscheint es hier.',
        }),
      ),
    );

    expect(markup).toContain(longTitle);
    expect(markup).toContain('9876543');
    expect(markup).toContain('capacity-full');
    expect(markup).toContain('role="progressbar"');
    expect(markup).toContain('Keine Standorte');
  });

  it('hält zentrale Tokens, interne Scrollflächen und kompakte Breakpoints im Stylesheet', () => {
    const css = readFileSync(
      new URL('../src/styles/active-operations.css', import.meta.url),
      'utf8',
    );

    for (const token of [
      '--ui-bg-root',
      '--ui-bg-panel',
      '--ui-bg-panel-elevated',
      '--ui-bg-card',
      '--ui-border-default',
      '--ui-border-highlight',
      '--ui-overlay-valid',
      '--ui-overlay-warning',
      '--ui-overlay-invalid',
      '--ui-overlay-reserved',
    ]) {
      expect(css).toContain(token);
    }
    expect(css).toMatch(/@media \(max-width: 1180px\), \(max-height: 760px\)/);
    expect(css).toContain('overflow: auto');
  });

  it('öffnet große Arbeitsflächen gegenseitig exklusiv', () => {
    const ui = useUiStore.getState();
    ui.openResourceNetwork('wood');
    expect(useUiStore.getState().resourceNetworkResource).toBe('wood');

    ui.openWorkAreaPlanner('building-test', 12, ['node-a']);
    expect(useUiStore.getState()).toMatchObject({
      workAreaPlannerBuildingId: 'building-test',
      resourceNetworkResource: undefined,
      activityPlannerDefId: undefined,
    });

    ui.startPlacing('road');
    expect(useUiStore.getState()).toMatchObject({
      placingDefId: 'road',
      workAreaPlannerBuildingId: undefined,
      resourceNetworkResource: undefined,
      roadPlanPath: [],
    });

    useUiStore.getState().stopPlacing();
    useUiStore.getState().closeWorkAreaPlanner();
    useUiStore.getState().closeResourceNetwork();
  });
});
