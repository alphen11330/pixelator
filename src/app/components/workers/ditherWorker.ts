/// <reference lib="webworker" />

// メインスレッドをブロックしないよう、ディザリング処理を Worker 内で実行する

type RGB3 = [number, number, number];

// 二乗距離（平方根不要）
const colorDistance = (
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number
): number => (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;

const findNearestColor = (r: number, g: number, b: number, palette: RGB3[]): RGB3 => {
  let minDist = Infinity;
  let nearest = palette[0];
  for (const color of palette) {
    const dist = colorDistance(r, g, b, color[0], color[1], color[2]);
    if (dist < minDist) { minDist = dist; nearest = color; }
  }
  return nearest;
};

// Floyd-Steinberg ディザリング
const applyFloydSteinberg = (
  data: Uint8ClampedArray, width: number, height: number,
  palette: RGB3[], strength: number
): void => {
  const buffer = new Float32Array(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    buffer[i * 3]     = data[i * 4];
    buffer[i * 3 + 1] = data[i * 4 + 1];
    buffer[i * 3 + 2] = data[i * 4 + 2];
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const j = (y * width + x) * 3;
      const i = (y * width + x) * 4;
      if (data[i + 3] < 10) continue;
      const oldR = Math.max(0, Math.min(255, buffer[j]));
      const oldG = Math.max(0, Math.min(255, buffer[j + 1]));
      const oldB = Math.max(0, Math.min(255, buffer[j + 2]));
      const [newR, newG, newB] = findNearestColor(oldR, oldG, oldB, palette);
      data[i] = newR; data[i + 1] = newG; data[i + 2] = newB;
      const errR = (oldR - newR) * strength;
      const errG = (oldG - newG) * strength;
      const errB = (oldB - newB) * strength;
      if (x + 1 < width) {
        buffer[j + 3] += errR * 7 / 16;
        buffer[j + 4] += errG * 7 / 16;
        buffer[j + 5] += errB * 7 / 16;
      }
      if (y + 1 < height) {
        if (x > 0) {
          buffer[j + width * 3 - 3] += errR * 3 / 16;
          buffer[j + width * 3 - 2] += errG * 3 / 16;
          buffer[j + width * 3 - 1] += errB * 3 / 16;
        }
        buffer[j + width * 3]     += errR * 5 / 16;
        buffer[j + width * 3 + 1] += errG * 5 / 16;
        buffer[j + width * 3 + 2] += errB * 5 / 16;
        if (x + 1 < width) {
          buffer[j + width * 3 + 3] += errR / 16;
          buffer[j + width * 3 + 4] += errG / 16;
          buffer[j + width * 3 + 5] += errB / 16;
        }
      }
    }
  }
};

// Atkinson ディザリング
const applyAtkinson = (
  data: Uint8ClampedArray, width: number, height: number,
  palette: RGB3[], strength: number
): void => {
  const buffer = new Float32Array(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    buffer[i * 3]     = data[i * 4];
    buffer[i * 3 + 1] = data[i * 4 + 1];
    buffer[i * 3 + 2] = data[i * 4 + 2];
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const j = (y * width + x) * 3;
      const i = (y * width + x) * 4;
      if (data[i + 3] < 10) continue;
      const oldR = Math.max(0, Math.min(255, buffer[j]));
      const oldG = Math.max(0, Math.min(255, buffer[j + 1]));
      const oldB = Math.max(0, Math.min(255, buffer[j + 2]));
      const [newR, newG, newB] = findNearestColor(oldR, oldG, oldB, palette);
      data[i] = newR; data[i + 1] = newG; data[i + 2] = newB;
      const errR = ((oldR - newR) / 8) * strength;
      const errG = ((oldG - newG) / 8) * strength;
      const errB = ((oldB - newB) / 8) * strength;
      const spread = (dx: number, dy: number) => {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const idx = (ny * width + nx) * 3;
          buffer[idx] += errR; buffer[idx + 1] += errG; buffer[idx + 2] += errB;
        }
      };
      spread(1, 0); spread(2, 0);
      spread(-1, 1); spread(0, 1); spread(1, 1);
      spread(0, 2);
    }
  }
};

// 組織的ディザリング（Bayer matrix）
const applyOrdered = (
  data: Uint8ClampedArray, width: number, height: number,
  palette: RGB3[], strength: number, bayerMatrix: number[][]
): void => {
  const scaled = bayerMatrix.map(row => row.map(v => (v - 32) * 2));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] < 10) continue;
      const threshold = scaled[y % 8][x % 8] * strength;
      const clamp = (v: number) => v < 0 ? 0 : v > 255 ? 255 : v;
      const [newR, newG, newB] = findNearestColor(
        clamp(data[i] + threshold),
        clamp(data[i + 1] + threshold),
        clamp(data[i + 2] + threshold),
        palette
      );
      data[i] = newR; data[i + 1] = newG; data[i + 2] = newB;
    }
  }
};

// シンプルな色変換（ディザリングなし）
const applySimple = (
  data: Uint8ClampedArray, width: number, height: number, palette: RGB3[]
): void => {
  for (let i = 0; i < width * height * 4; i += 4) {
    if (data[i + 3] < 10) continue;
    const [newR, newG, newB] = findNearestColor(data[i], data[i + 1], data[i + 2], palette);
    data[i] = newR; data[i + 1] = newG; data[i + 2] = newB;
  }
};

interface DitherMessage {
  buffer: ArrayBuffer;
  width: number;
  height: number;
  paletteRGB: RGB3[];
  ditherType: string;
  ditherStrength: number;
  bayerMatrix: number[][] | null;
  toneCurveLUT?: { r: number[]; g: number[]; b: number[] } | null;
}

self.onmessage = (e: MessageEvent<DitherMessage>) => {
  const { buffer, width, height, paletteRGB, ditherType, ditherStrength, bayerMatrix, toneCurveLUT } = e.data;
  const data = new Uint8ClampedArray(buffer);

  if (toneCurveLUT) {
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] >= 10) {
        data[i]     = toneCurveLUT.r[data[i]];
        data[i + 1] = toneCurveLUT.g[data[i + 1]];
        data[i + 2] = toneCurveLUT.b[data[i + 2]];
      }
    }
  }

  if (ditherType === "floydSteinberg") {
    applyFloydSteinberg(data, width, height, paletteRGB, ditherStrength);
  } else if (ditherType === "atkinson") {
    applyAtkinson(data, width, height, paletteRGB, ditherStrength);
  } else if (bayerMatrix) {
    applyOrdered(data, width, height, paletteRGB, ditherStrength, bayerMatrix);
  } else {
    applySimple(data, width, height, paletteRGB);
  }

  // バッファをゼロコピーで転送して返す
  self.postMessage({ buffer: data.buffer }, [data.buffer]);
};
