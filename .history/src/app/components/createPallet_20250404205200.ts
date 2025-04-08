import { Dela_Gothic_One } from "next/font/google";

type Color = { r: number; g: number; b: number };
type ColorBox = {
  r0: number; r1: number;
  g0: number; g1: number;
  b0: number; b1: number;
  vol: number;
  count: number;
  sum: Color;
};

const MAX_COLOR = 32;

const getColorIndex = (r: number, g: number, b: number) =>
  (r << 10) + (r << 6) + r + (g << 5) + g + b;

const createHistogram = (pixels: Color[]): Uint32Array => {
  const hist = new Uint32Array(MAX_COLOR * MAX_COLOR * MAX_COLOR);
  for (const p of pixels) {
    const r = (p.r >> 3);
    const g = (p.g >> 3);
    const b = (p.b >> 3);
    const idx = getColorIndex(r, g, b);
    hist[idx]++;
  }
  return hist;
};

const averageColor = (hist: Uint32Array, box: ColorBox): Color => {
  let r = 0, g = 0, b = 0, count = 0;

  for (let ri = box.r0; ri <= box.r1; ri++) {
    for (let gi = box.g0; gi <= box.g1; gi++) {
      for (let bi = box.b0; bi <= box.b1; bi++) {
        const idx = getColorIndex(ri, gi, bi);
        const h = hist[idx];
        count += h;
        r += ri * h;
        g += gi * h;
        b += bi * h;
      }
    }
  }

  if (count === 0) return { r: 0, g: 0, b: 0 };
  return {
    r: Math.round((r / count) << 3),
    g: Math.round((g / count) << 3),
    b: Math.round((b / count) << 3),
  };
};

const splitBox = (hist: Uint32Array, box: ColorBox): [ColorBox, ColorBox] => {
  const { r0, r1, g0, g1, b0, b1 } = box;
  const dr = r1 - r0;
  const dg = g1 - g0;
  const db = b1 - b0;

  let cutChannel = 'r';
  if (dg >= dr && dg >= db) cutChannel = 'g';
  else if (db >= dr && db >= dg) cutChannel = 'b';

  let cutPoint = Math.floor(((box as any)[cutChannel + '0'] + (box as any)[cutChannel + '1']) / 2);

  const box1 = { ...box };
  const box2 = { ...box };
  (box1 as any)[cutChannel + '1'] = cutPoint;
  (box2 as any)[cutChannel + '0'] = cutPoint + 1;

  return [box1, box2];
};

const createPallet = (imageData: ImageData, colorCount = 8): string[] => {
  const pixels: Color[] = [];

  // ピクセル抽出
  for (let i = 0; i < imageData.data.length; i += 4) {
    pixels.push({
      r: imageData.data[i],
      g: imageData.data[i + 1],
      b: imageData.data[i + 2],
    });
  }

  const hist = createHistogram(pixels);
  let boxes: ColorBox[] = [{
    r0: 0, r1: MAX_COLOR - 1,
    g0: 0, g1: MAX_COLOR - 1,
    b0: 0, b1: MAX_COLOR - 1,
    vol: 0,
    count: pixels.length,
    sum: { r: 0, g: 0, b: 0 },
  }];

  // 色空間を colorCount 個に分割
  for (let i = 1; i < colorCount; i++) {
    // 最も大きいボックスを探す
    const boxToSplit = boxes.reduce((a, b) =>
      (a.r1 - a.r0) * (a.g1 - a.g0) * (a.b1 - a.b0) >
      (b.r1 - b.r0) * (b.g1 - b.g0) * (b.b1 - b.b0) ? a : b
    );

    const idx = boxes.indexOf(boxToSplit);
    const [box1, box2] = splitBox(hist, boxToSplit);
    boxes.splice(idx, 1, box1, box2);
  }

  // 平均色をパレットとして返す
  const palette = boxes.map(b => {
    const color = averageColor(hist, b);
    return `rgb(${color.r}, ${color.g}, ${color.b})`;
  });

  return palette;
};
export default createPallet