// declarations.d.ts

declare module 'rgbquant' {
    // 型定義が不完全でも、必要な部分だけ簡単に定義することができます。
    export class RgbQuant {
      constructor(options?: { colors?: number; method?: number; });
      quantize(pixels: number[][]): number[][];
    }
  }
  