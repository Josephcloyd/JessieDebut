import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  CanvasTexture,
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
  TorusGeometry,
  Vector3,
  WebGLRenderer,
  type Texture,
} from "three";
import { CANDLE_COUNT, layoutCandles, TRAY_RADIUS, VIEW_ELEVATION, type CandleSpot } from "./candle-layout";
import { createFlameTexture, createGlowTexture, createWaxGlowTexture } from "./textures";

export interface CandleScene {
  setLit: (count: number) => void;
  setActive: (isActive: boolean) => void;
  resize: (width: number, height: number) => void;
  dispose: () => void;
}

const MAX_PIXEL_RATIO = 1.5;
const LOW_PIXEL_RATIO = 1;
const FRAME_INTERVAL = 1 / 40;
const SLOW_FRAME_SECONDS = 0.05;
const FRAMES_PER_CHECK = 40;
const RADIUS = 0.15;
const WAX = new Color("#FFF9F4");
const WAX_CAP = new Color("#f1e6dd");
const CAP_LIT = new Color("#F3DDB4");
const EMBER = new Color("#E6C594");
const FOV = 28;
const POOL_RADIUS = 1.35;
const FIT_X = 0.9;
const FIT_Y = 0.52;
const SCENE_LIFT = 0.07;
const EMBER_SECONDS = 0.45;
const EMBER_ARC = 0.7;

interface Candle {
  body: Mesh;
  cap: Mesh;
  wick: Mesh;
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
  let pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 80);
  const hemi = new HemisphereLight(new Color("#FFD2D7"), new Color("#4D2C32"), 1.25);
  const keyLight = new PointLight(EMBER, 0, 14, 1.6);
  const flareLight = new PointLight(EMBER, 0, 6, 1.8);
  scene.add(hemi, keyLight, flareLight);

  const flameTexture = createFlameTexture();
  const glowTexture = createGlowTexture();
  const waxGlow = createWaxGlowTexture();
  const bodyGeometry = new CylinderGeometry(RADIUS, RADIUS * 1.06, 1, 20, 1, true);
  const capGeometry = new CircleGeometry(RADIUS, 20);
  capGeometry.rotateX(-Math.PI / 2);
  const wickGeometry = new CylinderGeometry(0.012, 0.016, 0.13, 6);
  const wickMaterial = new MeshBasicMaterial({ color: new Color("#3b2226") });
  const planeGeometry = new PlaneGeometry(1, 1);

  const candles: Candle[] = Array.from({ length: CANDLE_COUNT }, (_, index) => {
    const material = new MeshStandardMaterial({ color: WAX, roughness: 0.55, metalness: 0, emissive: EMBER, emissiveMap: waxGlow, emissiveIntensity: 0, side: DoubleSide });
    const capMaterial = new MeshBasicMaterial({ color: WAX_CAP.clone() });
    const body = new Mesh(bodyGeometry, material);
    const cap = new Mesh(capGeometry, capMaterial);
    const wick = new Mesh(wickGeometry, wickMaterial);
    const flame = new Sprite(new SpriteMaterial({ map: flameTexture, transparent: true, depthWrite: false, blending: AdditiveBlending, opacity: 0 }));
    flame.center.set(0.5, 0.12);
    const glow = new Sprite(new SpriteMaterial({ map: glowTexture, transparent: true, depthWrite: false, blending: AdditiveBlending, opacity: 0 }));
    scene.add(body, cap, wick, flame, glow);
    return { body, cap, wick, flame, glow, material, capMaterial, spot: { x: 0, z: 0, height: 1 }, amount: 0, target: 0, flare: 0, seed: index * 1.7 + 0.3 };
  });

  const trayGeometry = new CylinderGeometry(TRAY_RADIUS, TRAY_RADIUS * 1.02, 0.08, 72);
  const rimGeometry = new TorusGeometry(TRAY_RADIUS, 0.045, 10, 96);
  rimGeometry.rotateX(Math.PI / 2);
  const trayMaterial = new MeshStandardMaterial({ color: new Color("#5a333a"), roughness: 0.42, metalness: 0.15 });
  const rimMaterial = new MeshStandardMaterial({ color: EMBER, roughness: 0.4, metalness: 0.35, emissive: EMBER, emissiveIntensity: 0.12 });
  const tray = new Mesh(trayGeometry, trayMaterial);
  tray.position.y = -0.04;
  const rim = new Mesh(rimGeometry, rimMaterial);
  rim.position.y = 0.01;
  scene.add(tray, rim);

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

  // The little light carried from one candle to the next.
  const emberSprite = new Sprite(new SpriteMaterial({ map: glowTexture, transparent: true, depthWrite: false, blending: AdditiveBlending, opacity: 0.95 }));
  emberSprite.scale.setScalar(0.34);
  emberSprite.visible = false;
  scene.add(emberSprite);

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
  let slowFrames = 0;
  let checkedFrames = 0;
  const emberFrom = new Vector3();
  const emberTo = new Vector3();
  let emberProgress = 1;

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
    lookAt = new Vector3(0, 0.75, 0);
    const direction = new Vector3(0, Math.sin(VIEW_ELEVATION), Math.cos(VIEW_ELEVATION));
    const points = candles.flatMap(({ spot }) => [new Vector3(spot.x, 0, spot.z), new Vector3(spot.x, spot.height + 0.5, spot.z)]);
    const edge = TRAY_RADIUS + 0.1;
    points.push(new Vector3(-edge, 0, 0), new Vector3(edge, 0, 0), new Vector3(0, 0, edge));
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
        return Math.abs(projected.x) < FIT_X && Math.abs(projected.y) < FIT_Y;
      });
      if (fits) far = mid;
      else near = mid;
    }
    fitDistance = far;
    planeWidth = TRAY_RADIUS * 2 + 3;
    planeDepth = TRAY_RADIUS * 2 + 3;
    for (const plane of [pool, shadows]) plane.scale.set(planeWidth, planeDepth, 1);
  }

  function applyLayout(): void {
    const spots = layoutCandles();
    candles.forEach((candle, index) => {
      const spot = spots[index];
      candle.spot = spot;
      candle.body.scale.set(1, spot.height, 1);
      candle.body.position.set(spot.x, spot.height / 2, spot.z);
      candle.cap.position.set(spot.x, spot.height, spot.z);
      candle.wick.position.set(spot.x, spot.height + 0.065, spot.z);
      candle.flame.position.set(spot.x, spot.height + 0.1, spot.z);
      candle.glow.position.set(spot.x, spot.height + 0.28, spot.z);
    });
    camera.aspect = width / height;
    camera.clearViewOffset();
    fitCamera();
    // Lifts the tray so the count below it never sits on the rim.
    camera.setViewOffset(width, height, 0, Math.round(height * SCENE_LIFT), width, height);
    const poolPixels = Math.max(128, Math.min(512, Math.round(width * 0.9)));
    for (const target of [poolCanvas, shadowCanvas]) {
      target.width = poolPixels;
      target.height = poolPixels;
    }
    drawShadows();
    needsPool = true;
  }

  function moveEmber(dt: number): boolean {
    if (emberProgress >= 1) {
      emberSprite.visible = false;
      return false;
    }
    emberProgress = Math.min(1, emberProgress + dt / EMBER_SECONDS);
    emberSprite.position.lerpVectors(emberFrom, emberTo, emberProgress);
    emberSprite.position.y += Math.sin(emberProgress * Math.PI) * EMBER_ARC;
    emberSprite.visible = true;
    return true;
  }

  function step(dt: number): boolean {
    let isMoving = moveEmber(dt);
    let lit = 0;
    let sumX = 0;
    let sumZ = 0;
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
      }
    }
    const peakStep = (peakTarget - peak) * Math.min(1, dt * 1.6);
    if (Math.abs(peakStep) > 0.0005) isMoving = true;
    peak += peakStep;
    const cx = lit > 0 ? sumX / lit : lookAt.x;
    const cz = lit > 0 ? sumZ / lit : lookAt.z;
    keyLight.position.set(cx, 2.6, cz + 1.4);
    keyLight.intensity = lit * (1.05 + peak * 0.8);
    rimMaterial.emissiveIntensity = 0.12 + (lit / CANDLE_COUNT) * 0.55 + peak * 0.25;
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
    const direction = new Vector3(sway, Math.sin(VIEW_ELEVATION), Math.cos(VIEW_ELEVATION)).normalize();
    camera.position.copy(lookAt).addScaledVector(direction, distance);
    camera.lookAt(lookAt);
    dress(clock);
    renderer.render(scene, camera);
  }

  /** Slow phones trade sharpness for a steady flicker. */
  function watchFrameRate(dt: number): void {
    if (pixelRatio <= LOW_PIXEL_RATIO) return;
    checkedFrames += 1;
    if (dt > SLOW_FRAME_SECONDS) slowFrames += 1;
    if (checkedFrames < FRAMES_PER_CHECK) return;
    if (slowFrames > FRAMES_PER_CHECK / 2) {
      pixelRatio = LOW_PIXEL_RATIO;
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);
    }
    checkedFrames = 0;
    slowFrames = 0;
  }

  function frame(now: number): void {
    frameId = window.requestAnimationFrame(frame);
    const seconds = now / 1000;
    if (seconds - lastFrame < FRAME_INTERVAL) return;
    const dt = Math.min(0.1, seconds - lastFrame);
    lastFrame = seconds;
    clock += dt;
    watchFrameRate(dt);
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

  function sendEmber(fromIndex: number, toIndex: number): void {
    const from = candles[Math.max(0, fromIndex)].spot;
    const to = candles[toIndex].spot;
    emberFrom.set(from.x, from.height + 0.3, from.z);
    emberTo.set(to.x, to.height + 0.3, to.z);
    emberProgress = fromIndex < 0 ? 1 : 0;
  }

  return {
    setLit(count) {
      const next = Math.max(0, Math.min(CANDLE_COUNT, Math.round(count)));
      const previous = litCount;
      candles.forEach((candle, index) => {
        const target = index < next ? 1 : 0;
        if (target === 1 && candle.target === 0) {
          candle.flare = 1;
          newest = index;
        }
        candle.target = target;
      });
      if (next === previous + 1) sendEmber(previous - 1, previous);
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
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);
      applyLayout();
      render();
    },
    dispose() {
      stop();
      isActive = false;
      for (const geometry of [bodyGeometry, capGeometry, wickGeometry, planeGeometry, trayGeometry, rimGeometry]) geometry.dispose();
      wickMaterial.dispose();
      trayMaterial.dispose();
      rimMaterial.dispose();
      for (const candle of candles) {
        candle.material.dispose();
        candle.capMaterial.dispose();
        (candle.flame.material as SpriteMaterial).dispose();
        (candle.glow.material as SpriteMaterial).dispose();
      }
      (emberSprite.material as SpriteMaterial).dispose();
      poolMaterial.dispose();
      shadowMaterial.dispose();
      for (const texture of disposables) texture.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
