// Einziger Post-Processing-Pfad der 3D-Welt.
//
// DOM-HUD und Simulation bleiben vollständig außerhalb des Composers. Die
// Effektkette rendert ausschließlich die bestehende Three-Szene und wird aus
// der vorhandenen Grafikstufe abgeleitet. Damit gibt es weder eine zweite Welt
// noch einen zweiten Settings-Store.

import { Vector2, type PerspectiveCamera, type Scene, type WebGLRenderer } from 'three';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import type { GraphicsQualityLevel } from './graphicsQuality.ts';
import {
  postProcessingPassPlan,
  postProcessingProfile,
  type PostProcessingPassName,
} from './postProcessingQuality.ts';

type BokehUniforms = {
  focus?: { value: number };
  aperture?: { value: number };
  maxblur?: { value: number };
};

export class WorldPostProcessing {
  private composer: EffectComposer | undefined;
  private bokeh: BokehPass | undefined;
  private width = 1;
  private height = 1;
  private pixelRatio = 1;
  private level: GraphicsQualityLevel | undefined;

  constructor(
    private renderer: WebGLRenderer,
    private scene: Scene,
    private camera: PerspectiveCamera,
  ) {}

  setQuality(level: GraphicsQualityLevel): void {
    if (level === this.level) return;
    this.level = level;
    this.rebuild();
  }

  setSize(width: number, height: number, pixelRatio: number): void {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.pixelRatio = Math.max(0.5, pixelRatio);
    this.composer?.setPixelRatio(this.pixelRatio);
    this.composer?.setSize(this.width, this.height);
  }

  render(deltaTime: number, focusDistance: number, allowDepthOfField = false): void {
    if (!this.composer) {
      this.renderer.render(this.scene, this.camera);
      return;
    }
    if (this.bokeh) {
      this.bokeh.enabled = allowDepthOfField;
      const uniforms = (this.bokeh as unknown as { materialBokeh?: { uniforms?: BokehUniforms } })
        .materialBokeh?.uniforms;
      if (uniforms?.focus) uniforms.focus.value = Math.max(8, focusDistance);
    }
    this.composer.render(deltaTime);
  }

  dispose(): void {
    this.disposeComposer();
    this.level = undefined;
  }

  private rebuild(): void {
    this.disposeComposer();
    const level = this.level;
    if (!level) return;
    const profile = postProcessingProfile(level);
    if (!profile.enabled) return;

    const composer = new EffectComposer(this.renderer);
    composer.setPixelRatio(this.pixelRatio);
    composer.setSize(this.width, this.height);

    const plan = postProcessingPassPlan(level, true);
    for (const passName of plan.passes) this.addPass(composer, passName, profile);
    this.composer = composer;
  }

  private addPass(
    composer: EffectComposer,
    passName: PostProcessingPassName,
    profile: ReturnType<typeof postProcessingProfile>,
  ): void {
    switch (passName) {
      case 'render':
        composer.addPass(new RenderPass(this.scene, this.camera));
        return;
      case 'ssao': {
        const ao = new SSAOPass(this.scene, this.camera, 1, 1, profile.aoKernelSize);
        ao.kernelRadius = profile.aoRadius;
        ao.minDistance = 0.0015;
        ao.maxDistance = 0.075;
        composer.addPass(ao);
        return;
      }
      case 'bloom':
        composer.addPass(
          new UnrealBloomPass(
            new Vector2(1, 1),
            profile.bloomStrength,
            profile.bloomRadius,
            profile.bloomThreshold,
          ),
        );
        return;
      case 'depthOfField': {
        const bokeh = new BokehPass(this.scene, this.camera, {
          focus: 42,
          aperture: 0.000002,
          maxblur: profile.maxBlur,
        });
        // DOF ist opt-in pro Frame; so bleiben Bau-, Strassen- und Fahrmodus
        // auch auf Ultra garantiert scharf, bis der Aufrufer es freigibt.
        bokeh.enabled = false;
        this.bokeh = bokeh;
        composer.addPass(bokeh);
        return;
      }
      case 'smaa':
        // EffectComposer setzt beim Hinzufuegen und bei jedem Resize selbst
        // die effektive Groesse inklusive DPR.
        composer.addPass(new SMAAPass(1, 1));
        return;
      case 'output':
        composer.addPass(new OutputPass());
    }
  }

  private disposeComposer(): void {
    if (!this.composer) return;
    for (const pass of this.composer.passes) {
      if (pass instanceof SSAOPass) {
        // Three r171s SSAOPass.dispose() vergisst genau diese beiden Besitzer.
        // Qualitätswechsel dürfen deshalb weder Shaderprogramme noch die
        // Noise-Textur bis zum Renderer-Ende behalten.
        pass.ssaoMaterial.dispose();
        pass.noiseTexture.dispose();
      }
      pass.dispose?.();
    }
    this.composer.dispose();
    this.composer = undefined;
    this.bokeh = undefined;
  }
}
