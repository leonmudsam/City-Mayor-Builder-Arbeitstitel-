import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fakes = vi.hoisted(() => {
  class FakePass {
    enabled = true;
    disposeCalls = 0;
    readonly setSizeCalls: Array<[number, number]> = [];

    constructor(readonly kind: string) {}

    setSize(width: number, height: number): void {
      this.setSizeCalls.push([width, height]);
    }

    dispose(): void {
      this.disposeCalls += 1;
    }
  }

  class FakeRenderPass extends FakePass {
    constructor(
      readonly scene: unknown,
      readonly camera: unknown,
    ) {
      super('render');
    }
  }

  class FakeSsaoPass extends FakePass {
    kernelRadius = 0;
    minDistance = 0;
    maxDistance = 0;
    readonly ssaoMaterial = { dispose: vi.fn() };
    readonly noiseTexture = { dispose: vi.fn() };

    constructor(
      readonly scene: unknown,
      readonly camera: unknown,
      readonly initialWidth: number,
      readonly initialHeight: number,
      readonly kernelSize: number,
    ) {
      super('ssao');
    }
  }

  class FakeBloomPass extends FakePass {
    constructor(
      readonly resolution: unknown,
      readonly strength: number,
      readonly radius: number,
      readonly threshold: number,
    ) {
      super('bloom');
    }
  }

  class FakeBokehPass extends FakePass {
    readonly materialBokeh: { uniforms: { focus: { value: number } } };

    constructor(
      readonly scene: unknown,
      readonly camera: unknown,
      readonly params: { focus: number; aperture: number; maxblur: number },
    ) {
      super('depthOfField');
      this.materialBokeh = { uniforms: { focus: { value: params.focus } } };
    }
  }

  class FakeSmaaPass extends FakePass {
    constructor(
      readonly initialWidth: number,
      readonly initialHeight: number,
    ) {
      super('smaa');
    }
  }

  class FakeOutputPass extends FakePass {
    constructor() {
      super('output');
    }
  }

  const composers: FakeEffectComposer[] = [];

  class FakeEffectComposer {
    readonly passes: FakePass[] = [];
    readonly setPixelRatioCalls: number[] = [];
    readonly setSizeCalls: Array<[number, number]> = [];
    readonly renderCalls: number[] = [];
    pixelRatio = 1;
    width = 1;
    height = 1;
    disposeCalls = 0;

    constructor(readonly renderer: unknown) {
      composers.push(this);
    }

    addPass(pass: FakePass): void {
      this.passes.push(pass);
      pass.setSize(this.width * this.pixelRatio, this.height * this.pixelRatio);
    }

    setPixelRatio(pixelRatio: number): void {
      this.pixelRatio = pixelRatio;
      this.setPixelRatioCalls.push(pixelRatio);
      this.resizePasses();
    }

    setSize(width: number, height: number): void {
      this.width = width;
      this.height = height;
      this.setSizeCalls.push([width, height]);
      this.resizePasses();
    }

    render(deltaTime: number): void {
      this.renderCalls.push(deltaTime);
    }

    dispose(): void {
      this.disposeCalls += 1;
    }

    private resizePasses(): void {
      const effectiveWidth = this.width * this.pixelRatio;
      const effectiveHeight = this.height * this.pixelRatio;
      for (const pass of this.passes) pass.setSize(effectiveWidth, effectiveHeight);
    }
  }

  return {
    FakeBokehPass,
    FakeBloomPass,
    FakeEffectComposer,
    FakeOutputPass,
    FakeRenderPass,
    FakeSmaaPass,
    FakeSsaoPass,
    composers,
    reset: () => {
      composers.length = 0;
    },
  };
});

vi.mock('three/examples/jsm/postprocessing/BokehPass.js', () => ({
  BokehPass: fakes.FakeBokehPass,
}));
vi.mock('three/examples/jsm/postprocessing/EffectComposer.js', () => ({
  EffectComposer: fakes.FakeEffectComposer,
}));
vi.mock('three/examples/jsm/postprocessing/OutputPass.js', () => ({
  OutputPass: fakes.FakeOutputPass,
}));
vi.mock('three/examples/jsm/postprocessing/RenderPass.js', () => ({
  RenderPass: fakes.FakeRenderPass,
}));
vi.mock('three/examples/jsm/postprocessing/SMAAPass.js', () => ({
  SMAAPass: fakes.FakeSmaaPass,
}));
vi.mock('three/examples/jsm/postprocessing/SSAOPass.js', () => ({
  SSAOPass: fakes.FakeSsaoPass,
}));
vi.mock('three/examples/jsm/postprocessing/UnrealBloomPass.js', () => ({
  UnrealBloomPass: fakes.FakeBloomPass,
}));

import { WorldPostProcessing } from '../src/renderer/three/WorldPostProcessing.ts';
import { postProcessingProfile } from '../src/renderer/three/postProcessingQuality.ts';

function createSubject(): {
  postProcessing: WorldPostProcessing;
  renderer: WebGLRenderer & { render: ReturnType<typeof vi.fn> };
} {
  const renderer = { render: vi.fn() } as unknown as WebGLRenderer & {
    render: ReturnType<typeof vi.fn>;
  };
  const scene = {} as Scene;
  const camera = {} as PerspectiveCamera;
  return {
    postProcessing: new WorldPostProcessing(renderer, scene, camera),
    renderer,
  };
}

describe('WorldPostProcessing-Lebenszyklus', () => {
  beforeEach(() => {
    fakes.reset();
  });

  it('rendert Low direkt und allokiert keinen Composer', () => {
    const { postProcessing, renderer } = createSubject();
    postProcessing.setSize(1280, 720, 1);
    postProcessing.setQuality('low');
    postProcessing.render(1 / 60, 42, true);

    expect(fakes.composers).toHaveLength(0);
    expect(renderer.render).toHaveBeenCalledOnce();
  });

  it('baut Medium guenstig auf und skaliert alle Paesse mit Resize und DPR', () => {
    const { postProcessing } = createSubject();
    postProcessing.setSize(640, 360, 1.25);
    postProcessing.setQuality('medium');

    const composer = fakes.composers[0];
    expect(composer?.passes.map((pass) => pass.kind)).toEqual([
      'render',
      'ssao',
      'smaa',
      'output',
    ]);
    const ao = composer?.passes.find((pass) => pass.kind === 'ssao');
    expect(ao).toBeInstanceOf(fakes.FakeSsaoPass);
    expect((ao as InstanceType<typeof fakes.FakeSsaoPass>).kernelSize).toBe(8);
    expect(ao?.setSizeCalls.at(-1)).toEqual([800, 450]);

    postProcessing.setSize(1280, 720, 1.5);
    expect(composer?.pixelRatio).toBe(1.5);
    expect(composer?.setSizeCalls.at(-1)).toEqual([1280, 720]);
    for (const pass of composer?.passes ?? []) {
      expect(pass.setSizeCalls.at(-1)).toEqual([1920, 1080]);
    }
  });

  it('konfiguriert High-Bloom ausschliesslich oberhalb des HDR-Bereichs', () => {
    const { postProcessing } = createSubject();
    postProcessing.setQuality('high');

    const bloom = fakes.composers[0]?.passes.find((pass) => pass.kind === 'bloom');
    expect(bloom).toBeInstanceOf(fakes.FakeBloomPass);
    const typedBloom = bloom as InstanceType<typeof fakes.FakeBloomPass>;
    expect(typedBloom.threshold).toBeGreaterThan(1);
    expect(typedBloom.threshold).toBe(postProcessingProfile('high').bloomThreshold);
    expect(typedBloom.strength).toBeLessThanOrEqual(0.1);
  });

  it('aktiviert Ultra-DOF nur pro ausdruecklich freigegebenem Frame', () => {
    const { postProcessing } = createSubject();
    postProcessing.setQuality('ultra');

    const composer = fakes.composers[0];
    const bokeh = composer?.passes.find((pass) => pass.kind === 'depthOfField');
    expect(bokeh).toBeInstanceOf(fakes.FakeBokehPass);

    postProcessing.render(0.01, 4);
    expect(bokeh?.enabled).toBe(false);
    expect(
      (bokeh as InstanceType<typeof fakes.FakeBokehPass>).materialBokeh.uniforms.focus.value,
    ).toBe(8);

    postProcessing.render(0.02, 57, true);
    expect(bokeh?.enabled).toBe(true);
    expect(
      (bokeh as InstanceType<typeof fakes.FakeBokehPass>).materialBokeh.uniforms.focus.value,
    ).toBe(57);

    postProcessing.render(0.03, 57, false);
    expect(bokeh?.enabled).toBe(false);
    expect(composer?.renderCalls).toEqual([0.01, 0.02, 0.03]);
  });

  it('entsorgt beim Profilwechsel und finalen Dispose jeden Pass genau einmal', () => {
    const { postProcessing } = createSubject();
    postProcessing.setQuality('medium');
    const mediumComposer = fakes.composers[0];

    postProcessing.setQuality('medium');
    expect(fakes.composers).toHaveLength(1);

    postProcessing.setQuality('high');
    expect(mediumComposer?.disposeCalls).toBe(1);
    for (const pass of mediumComposer?.passes ?? []) expect(pass.disposeCalls).toBe(1);
    const mediumSsao = mediumComposer?.passes.find((pass) => pass.kind === 'ssao') as
      | InstanceType<typeof fakes.FakeSsaoPass>
      | undefined;
    expect(mediumSsao?.ssaoMaterial.dispose).toHaveBeenCalledOnce();
    expect(mediumSsao?.noiseTexture.dispose).toHaveBeenCalledOnce();

    const highComposer = fakes.composers[1];
    postProcessing.dispose();
    postProcessing.dispose();
    expect(highComposer?.disposeCalls).toBe(1);
    for (const pass of highComposer?.passes ?? []) expect(pass.disposeCalls).toBe(1);

    // Dispose setzt auch die Profilidentitaet zurueck; Wiederverwendung ist
    // dadurch moeglich, ohne dass ein bereits entsorgter Pfad haengen bleibt.
    postProcessing.setQuality('high');
    expect(fakes.composers).toHaveLength(3);
  });
});
