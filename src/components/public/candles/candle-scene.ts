import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Scene,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
  CanvasTexture,
  type Texture,
} from "three";
import { CANDLE_COUNT, candleRows, layoutCandles, type CandleSpot } from "./candle-layout";
import { createFlameTexture, createGlowTexture, createWaxGlowTexture } from "./textures";

export interface CandleScene {
  setLit: (count: number) => void;
  setActive: (isActive: boolean) => void;
  resize: (width: number, height: number) => void;
  dispose: () => void;
}

const MAX_PIXEL_RATIO = 1.5;
const FRAME_INTERVAL = 1 / 40;
const RADIUS = 0.17;
const WAX = new Color("#FFF9F4");
const WAX_CAP = new Color("#eadbd2");
const CAP_LIT = new Color("#F3DDB4");
const EMBER = new Color("#E6C594");
const FOV = 28;
const POOL_RADIUS = 1.5;

interface Candle {
  body: Mesh;
  cap: Mesh;
  flame: Sprite;
  glow: Sprite;
  material: MeshStandardMaterial;
  capMaterial: MeshBasicMaterial;
  spot: CandleSpot;
  amount: number;
  target: number;
  flare: number;
  seed: number;
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

function flicker(time: number, seed: number): number {
  return Math.sin(time * 7 + seed * 13) * 0.5 + Math.sin(time * 11.3 + seed * 5) * 0.3 + Math.sin(time * 3.1 + seed) * 0.2;
}

export function createCandleScene(canvas: HTMLCanvasElement): CandleScene {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 80);
  const hemi = new HemisphereLight(new Color("#C58B95"), new Color("#2a1519"), 0.55);
  const keyLight = new PointLight(EMBER, 0, 14, 1.6);
  const flareLight = new PointLight(new Color("#E6C594"), 0, 6, 1.8);
  scene.add(hemi, keyLight, flareLight);

  const flameTexture = createFlameTexture();
  const glowTexture = createGlowTexture();
  const waxGlow = createWaxGlowTexture();
  const bodyGeometry = new CylinderGeometry(RADIUS, RADIUS * 1.06, 1, 22, 1, true);
  const capGeometry = new CircleGeometry(RADIUS, 22);
  capGeometry.rotateX(-Math.PI / 2);
  const planeGeometry = new PlaneGeometry(1, 1);

  const candles: Candle[] = Array.from({ length: CANDLE_COUNT }, (_, index) => {
    const material = new MeshStandardMaterial({ color: WAX, roughness: 0.58, metalness: 0, emissive: EMBER, emissiveMap: waxGlow, emissiveIntensity: 0, side: DoubleSide });
    const capMaterial = new MeshBasicMaterial({ color: WAX_CAP.clone() });
    const body = new Mesh(bodyGeometry, material);
    const cap = new Mesh(capGeometry, capMaterial);
    const flame = new Sprite(new SpriteMaterial({ map: flameTexture, transparent: true, depthWrite: false, blending: AdditiveBlending, opacity: 0 }));
    flame.center.set(0.5, 0.12);
    const glow = new Sprite(new SpriteMaterial({ map: glowTexture, transparent: true, depthWrite: false, blending: AdditiveBlending, opacity: 0 }));
    scene.add(body, cap, flame, glow);
    return { body, cap, flame, glow, material, capMaterial, spot: { x: 0, z: 0, height: 1 }, amount: 0, target: 0, flare: 0, seed: index * 1.7 + 0.3 };
  });

  const poolCanvas = document.createElement("canvas");
  const shadowCanvas = document.createElement("canvas");
  const poolTexture = new CanvasTexture(poolCanvas);
  const shadowTexture = new CanvasTexture(shadowCanvas);
  poolTexture.colorSpace = SRGBColorSpace;
  shadowTexture.colorSpace = SRGBColorSpace;
  const poolMaterial = new MeshBasicMaterial({ map: poolTexture, transparent: true, depthWrite: false });
  const shadowMaterial = new MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false });
  const pool = new Mesh(planeGeometry, poolMaterial);
  const shadows = new Mesh(planeGeometry, shadowMaterial);
  for (const plane of [pool, shadows]) plane.rotation.x = -Math.PI / 2;
  shadows.position.y = 0.002;
  pool.position.y = 0.004;
  scene.add(shadows, pool);

  let width = 1;
  let height = 1;
  let planeWidth = 10;
  let planeDepth = 8;
  let fitDistance = 12;
  let lookAt = new Vector3();
  let litCount = 0;
  let newest = -1;
  let peak = 0;
  let peakTarget = 0;
  let isActive = false;
  let frameId = 0;
  let lastFrame = 0;
  let clock = 0;
  let needsPool = true;

  const disposables: Texture[] = [flameTexture, glowTexture, waxGlow, poolTexture, shadowTexture];

  function drawShadows(): void {
    const ctx = shadowCanvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, shadowCanvas.width, shadowCanvas.height);
    for (const { spot } of candles) {
      const px = (spot.x / planeWidth + 0.5) * shadowCanvas.width;
      const py = (spot.z / planeDepth + 0.5) * shadowCanvas.height;
      const radius = (RADIUS * 3.4 / planeWidth) * shadowCanvas.width;
      const gradient = ctx.createRadialGradient(px, py, radius * 0.2, px, py, radius);
      gradient.addColorStop(0, "rgba(22, 6, 10, 0.7)");
      gradient.addColorStop(1, "rgba(22, 6, 10, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(px - radius, py - radius, radius * 2, radius * 2);
    }
    shadowTexture.needsUpdate = true;
  }

  function drawPools(): void {
    const ctx = poolCanvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, poolCanvas.width, poolCanvas.height);
    ctx.globalCompositeOperation = "lighter";
    const boost = 1 + peak * 0.5;
    for (const candle of candles) {
      if (candle.amount < 0.01) continue;
      const px = (candle.spot.x / planeWidth + 0.5) * poolCanvas.width;
      const py = (candle.spot.z / planeDepth + 0.5) * poolCanvas.height;
      const radius = (POOL_RADIUS * (0.8 + candle.spot.height * 0.25) * boost / planeWidth) * poolCanvas.width;
      const alpha = candle.amount * (0.26 + candle.flare * 0.15);
      const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius);
      gradient.addColorStop(0, `rgba(230, 197, 148, ${alpha})`);
      gradient.addColorStop(0.45, `rgba(214, 170, 110, ${alpha * 0.35})`);
      gradient.addColorStop(1, "rgba(200, 150, 90, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(px - radius, py - radius, radius * 2, radius * 2);
    }
    ctx.globalCompositeOperation = "source-over";
    poolTexture.needsUpdate = true;
  }

  function fitCamera(): void {
    const elevation = 0.27;
    const spots = candles.map((candle) => candle.spot);
    const min = new Vector3(Infinity, 0, Infinity);
    const max = new Vector3(-Infinity, 0, -Infinity);
    for (const spot of spots) {
      min.x = Math.min(min.x, spot.x);
      max.x = Math.max(max.x, spot.x);
      min.z = Math.min(min.z, spot.z);
      max.z = Math.max(max.z, spot.z);
    }
    lookAt = new Vector3((min.x + max.x) / 2, 0.95, (min.z + max.z) / 2);
    const direction = new Vector3(0, Math.sin(elevation), Math.cos(elevation));
    const points: Vector3[] = [];
    for (const spot of spots) {
      points.push(new Vector3(spot.x - 0.5, 0, spot.z + 0.3), new Vector3(spot.x + 0.5, spot.height + 0.75, spot.z - 0.2));
    }
    let near = 4;
    let far = 60;
    for (let step = 0; step < 24; step += 1) {
      const mid = (near + far) / 2;
      camera.position.copy(lookAt).addScaledVector(direction, mid);
      camera.lookAt(lookAt);
      camera.updateMatrixWorld(true);
      camera.updateProjectionMatrix();
      const fits = points.every((point) => {
        const projected = point.clone().project(camera);
        return Math.abs(projected.x) < 0.74 && projected.y > -0.66 && projected.y < 0.66;
      });
      if (fits) far = mid;
      else near = mid;
    }
    fitDistance = far;
    planeWidth = Math.max(14, (max.x - min.x) + 13);
    planeDepth = Math.max(8, (max.z - min.z) + 11);
    for (const plane of [pool, shadows]) {
      plane.scale.set(planeWidth, planeDepth, 1);
      plane.position.x = 0;
      plane.position.z = 0;
    }
  }

  function applyLayout(): void {
    const rows = candleRows(width / height);
    const spots = layoutCandles(CANDLE_COUNT, rows);
    candles.forEach((candle, index) => {
      const spot = spots[index];
      candle.spot = spot;
      candle.body.scale.set(1, spot.height, 1);
      candle.body.position.set(spot.x, spot.height / 2, spot.z);
      candle.cap.position.set(spot.x, spot.height, spot.z);
      candle.flame.position.set(spot.x, spot.height + 0.03, spot.z);
      candle.glow.position.set(spot.x, spot.height + 0.22, spot.z);
    });
    camera.aspect = width / height;
    fitCamera();
    const poolPixels = Math.min(512, Math.round(width * 0.9));
    for (const target of [poolCanvas, shadowCanvas]) {
      target.width = Math.max(128, poolPixels);
      target.height = Math.max(96, Math.round((Math.max(128, poolPixels) * planeDepth) / planeWidth));
    }
    drawShadows();
    needsPool = true;
  }

  function step(dt: number): boolean {
    let isMoving = false;
    let lit = 0;
    let sumX = 0;
    let sumZ = 0;
    let topY = 1;
    for (const candle of candles) {
      const rate = candle.target > candle.amount ? 3.4 : 5;
      const next = candle.amount + Math.sign(candle.target - candle.amount) * rate * dt;
      const settled = Math.abs(candle.target - candle.amount) <= rate * dt;
      const amount = settled ? candle.target : clamp01(next);
      if (amount !== candle.amount) isMoving = true;
      candle.amount = amount;
      candle.flare = candle.flare > 0.002 ? candle.flare * Math.exp(-2.6 * dt) : 0;
      if (candle.flare > 0) isMoving = true;
      if (amount > 0.01) {
        lit += amount;
        sumX += candle.spot.x * amount;
        sumZ += candle.spot.z * amount;
        topY = Math.max(topY, candle.spot.height);
      }
    }
    const peakStep = (peakTarget - peak) * Math.min(1, dt * 1.6);
    if (Math.abs(peakStep) > 0.0005) isMoving = true;
    peak += peakStep;
    const cx = lit > 0 ? sumX / lit : lookAt.x;
    const cz = lit > 0 ? sumZ / lit : lookAt.z;
    keyLight.position.set(cx, topY + 1.3, cz + 1.4);
    keyLight.intensity = lit * (1.05 + peak * 0.8);
    const fresh = candles[Math.max(0, newest)];
    flareLight.position.set(fresh.spot.x, fresh.spot.height + 0.4, fresh.spot.z + 0.7);
    flareLight.intensity = newest >= 0 ? fresh.flare * 10 : 0;
    return isMoving;
  }

  function dress(time: number): void {
    const boost = 1 + peak * 0.3;
    for (const candle of candles) {
      const { amount, flare, spot, seed } = candle;
      const wobble = flicker(time, seed);
      const strength = amount * (1 + flare * 0.9) * boost;
      candle.flame.visible = amount > 0.01;
      candle.glow.visible = amount > 0.01;
      candle.flame.scale.set(0.17 * amount * (1 + wobble * 0.05) * (1 + flare * 0.3), 0.4 * amount * (1 + wobble * 0.14) * (1 + flare * 0.5), 1);
      (candle.flame.material as SpriteMaterial).rotation = wobble * 0.05;
      (candle.flame.material as SpriteMaterial).opacity = clamp01(amount * 1.1);
      candle.flame.position.x = spot.x + wobble * 0.008;
      const glowSize = 1.45 * (0.55 + amount * 0.45) * (1 + wobble * 0.04) * boost;
      candle.glow.scale.set(glowSize, glowSize, 1);
      (candle.glow.material as SpriteMaterial).opacity = clamp01(0.3 * strength + wobble * 0.025 * amount);
      candle.material.emissiveIntensity = amount * (0.4 + peak * 0.15 + flare * 0.4);
      candle.capMaterial.color.copy(WAX_CAP).lerp(CAP_LIT, amount);
    }
  }

  function render(): void {
    const distance = fitDistance * (1 - 0.05 * peak);
    const sway = Math.sin(clock * 0.25) * 0.08;
    const direction = new Vector3(sway, Math.sin(0.27), Math.cos(0.27)).normalize();
    camera.position.copy(lookAt).addScaledVector(direction, distance);
    camera.lookAt(lookAt);
    dress(clock);
    renderer.render(scene, camera);
  }

  function frame(now: number): void {
    frameId = window.requestAnimationFrame(frame);
    const seconds = now / 1000;
    if (seconds - lastFrame < FRAME_INTERVAL) return;
    const dt = Math.min(0.1, seconds - lastFrame);
    lastFrame = seconds;
    clock += dt;
    const isMoving = step(dt);
    if (isMoving || needsPool) {
      drawPools();
      needsPool = false;
    }
    render();
  }

  function start(): void {
    if (frameId || !isActive) return;
    lastFrame = performance.now() / 1000;
    frameId = window.requestAnimationFrame(frame);
  }

  function stop(): void {
    window.cancelAnimationFrame(frameId);
    frameId = 0;
  }


  return {
    setLit(count) {
      const next = Math.max(0, Math.min(CANDLE_COUNT, Math.round(count)));
      candles.forEach((candle, index) => {
        const target = index < next ? 1 : 0;
        if (target === 1 && candle.target === 0) {
          candle.flare = 1;
          newest = index;
        }
        candle.target = target;
      });
      litCount = next;
      peakTarget = litCount === CANDLE_COUNT ? 1 : 0;
      needsPool = true;
    },
    setActive(next) {
      isActive = next;
      if (next) start();
      else stop();
    },
    resize(nextWidth, nextHeight) {
      width = Math.max(1, nextWidth);
      height = Math.max(1, nextHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
      renderer.setSize(width, height, false);
      applyLayout();
      render();
    },
    dispose() {
      stop();
      isActive = false;
      bodyGeometry.dispose();
      capGeometry.dispose();
      planeGeometry.dispose();
      for (const candle of candles) {
        candle.material.dispose();
        candle.capMaterial.dispose();
        (candle.flame.material as SpriteMaterial).dispose();
        (candle.glow.material as SpriteMaterial).dispose();
      }
      poolMaterial.dispose();
      shadowMaterial.dispose();
      for (const texture of disposables) texture.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
