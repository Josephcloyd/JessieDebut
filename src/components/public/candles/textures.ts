import { CanvasTexture, SRGBColorSpace } from "three";

function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function toTexture(canvas: HTMLCanvasElement): CanvasTexture {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A teardrop: pale core, amber body and a faint blue base, anchored at its foot. */
export function createFlameTexture(): CanvasTexture {
  const canvas = makeCanvas(64, 128);
  const ctx = canvas.getContext("2d");
  if (!ctx) return toTexture(canvas);
  const body = new Path2D();
  body.moveTo(32, 4);
  body.bezierCurveTo(46, 38, 56, 66, 50, 96);
  body.bezierCurveTo(46, 118, 18, 118, 14, 96);
  body.bezierCurveTo(8, 66, 20, 38, 32, 4);
  const fill = ctx.createLinearGradient(0, 4, 0, 118);
  fill.addColorStop(0, "rgba(236, 200, 140, 0)");
  fill.addColorStop(0.25, "rgba(230, 190, 120, 0.85)");
  fill.addColorStop(0.62, "rgba(246, 222, 170, 1)");
  fill.addColorStop(0.92, "rgba(255, 210, 215, 0.7)");
  fill.addColorStop(1, "rgba(255, 200, 205, 0)");
  ctx.filter = "blur(2px)";
  ctx.fillStyle = fill;
  ctx.fill(body);
  const core = ctx.createRadialGradient(32, 88, 1, 32, 88, 22);
  core.addColorStop(0, "rgba(255, 252, 236, 1)");
  core.addColorStop(1, "rgba(255, 240, 200, 0)");
  ctx.fillStyle = core;
  ctx.fillRect(0, 50, 64, 78);
  return toTexture(canvas);
}

/** Soft round halo used for the light each flame throws into the air. */
export function createGlowTexture(): CanvasTexture {
  const canvas = makeCanvas(128, 128);
  const ctx = canvas.getContext("2d");
  if (!ctx) return toTexture(canvas);
  const glow = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  glow.addColorStop(0, "rgba(243, 221, 180, 1)");
  glow.addColorStop(0.18, "rgba(230, 190, 120, 0.55)");
  glow.addColorStop(0.5, "rgba(210, 160, 100, 0.14)");
  glow.addColorStop(1, "rgba(200, 150, 90, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 128, 128);
  return toTexture(canvas);
}

/** Wax glows from within near the wick: black at the foot, bright toward the top. */
export function createWaxGlowTexture(): CanvasTexture {
  const canvas = makeCanvas(4, 128);
  const ctx = canvas.getContext("2d");
  if (!ctx) return toTexture(canvas);
  const gradient = ctx.createLinearGradient(0, 128, 0, 0);
  gradient.addColorStop(0, "#000000");
  gradient.addColorStop(0.55, "#120508");
  gradient.addColorStop(0.88, "#8a6a3a");
  gradient.addColorStop(1, "#E6C594");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 4, 128);
  return toTexture(canvas);
}
