export type CurvePoint = [number, number]; // [input, output] 0-255

export const DEFAULT_CURVE_POINTS: CurvePoint[] = [[0,0],[85,85],[170,170],[255,255]];

export const buildLUT = (points: CurvePoint[]): number[] => {
  const sorted = [...points].sort((a, b) => a[0] - b[0]);

  // Catmull-Rom用のファントム端点を追加
  const p0: CurvePoint = [sorted[0][0]*2-sorted[1][0], sorted[0][1]*2-sorted[1][1]];
  const pN: CurvePoint = [sorted.at(-1)![0]*2-sorted.at(-2)![0], sorted.at(-1)![1]*2-sorted.at(-2)![1]];
  const pts = [p0, ...sorted, pN];

  // 各セグメントをサンプリング
  const samples: [number, number][] = [];
  for (let seg = 1; seg < pts.length - 2; seg++) {
    const [a, b, c, d] = [pts[seg-1], pts[seg], pts[seg+1], pts[seg+2]];
    const steps = Math.max(200, Math.abs(c[0]-b[0]) * 4);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, t2 = t*t, t3 = t2*t;
      const x = 0.5*((2*b[0])+(-a[0]+c[0])*t+(2*a[0]-5*b[0]+4*c[0]-d[0])*t2+(-a[0]+3*b[0]-3*c[0]+d[0])*t3);
      const y = 0.5*((2*b[1])+(-a[1]+c[1])*t+(2*a[1]-5*b[1]+4*c[1]-d[1])*t2+(-a[1]+3*b[1]-3*c[1]+d[1])*t3);
      samples.push([x, y]);
    }
  }
  samples.sort((a, b) => a[0] - b[0]);

  // 二分探索で各x=0..255のy値を線形補間
  const lut: number[] = new Array(256);
  for (let i = 0; i < 256; i++) {
    let lo = 0, hi = samples.length - 1;
    while (lo < hi - 1) { const m = (lo+hi)>>1; if (samples[m][0] <= i) lo = m; else hi = m; }
    const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
    if (samples[lo][0] >= i) lut[i] = clamp(samples[lo][1]);
    else if (samples[hi][0] <= i) lut[i] = clamp(samples[hi][1]);
    else {
      const t = (i - samples[lo][0]) / (samples[hi][0] - samples[lo][0]);
      lut[i] = clamp(samples[lo][1] + t * (samples[hi][1] - samples[lo][1]));
    }
  }
  return lut;
};
