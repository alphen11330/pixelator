/// <reference lib="webworker" />

// メインスレッドをブロックしないよう、メディアンカット処理を Worker 内で実行する

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface ColorBox {
  pixels: RGB[];
  minR: number; maxR: number;
  minG: number; maxG: number;
  minB: number; maxB: number;
}

const createColorBox = (pixels: RGB[]): ColorBox => {
  let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
  for (const { r, g, b } of pixels) {
    if (r < minR) minR = r; if (r > maxR) maxR = r;
    if (g < minG) minG = g; if (g > maxG) maxG = g;
    if (b < minB) minB = b; if (b > maxB) maxB = b;
  }
  return { pixels, minR, maxR, minG, maxG, minB, maxB };
};

const splitBox = (box: ColorBox): { boxA: ColorBox; boxB: ColorBox } => {
  const rRange = box.maxR - box.minR;
  const gRange = box.maxG - box.minG;
  const bRange = box.maxB - box.minB;
  const sortKey: keyof RGB =
    rRange >= gRange && rRange >= bRange ? "r" :
    gRange >= bRange ? "g" : "b";
  const sorted = [...box.pixels].sort((a, b) => a[sortKey] - b[sortKey]);
  const mid = Math.floor(sorted.length / 2);
  return {
    boxA: createColorBox(sorted.slice(0, mid)),
    boxB: createColorBox(sorted.slice(mid)),
  };
};

const medianCut = (pixels: RGB[], colorCount: number): RGB[] => {
  if (pixels.length === 0) return [];
  const boxes: ColorBox[] = [createColorBox(pixels)];
  while (boxes.length < colorCount) {
    let maxIdx = 0, maxRange = 0;
    for (let i = 0; i < boxes.length; i++) {
      const { maxR, minR, maxG, minG, maxB, minB } = boxes[i];
      const range = Math.max(maxR - minR, maxG - minG, maxB - minB);
      if (range > maxRange) { maxRange = range; maxIdx = i; }
    }
    if (maxRange === 0 || boxes[maxIdx].pixels.length <= 1) break;
    const { boxA, boxB } = splitBox(boxes[maxIdx]);
    boxes.splice(maxIdx, 1, boxA, boxB);
  }
  return boxes.map(({ pixels }) => {
    let r = 0, g = 0, b = 0;
    for (const p of pixels) { r += p.r; g += p.g; b += p.b; }
    const n = pixels.length;
    return { r: r / n, g: g / n, b: b / n };
  });
};

self.onmessage = (e: MessageEvent<{ pixels: RGB[]; colorCount: number }>) => {
  const { pixels, colorCount } = e.data;
  const palette = medianCut(pixels, colorCount);
  palette.sort((a, b) => {
    const lumA = 0.2126 * a.r + 0.7152 * a.g + 0.0722 * a.b;
    const lumB = 0.2126 * b.r + 0.7152 * b.g + 0.0722 * b.b;
    return lumB - lumA;
  });
  const result = palette.map(({ r, g, b }) =>
    `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`
  );
  self.postMessage({ result });
};
