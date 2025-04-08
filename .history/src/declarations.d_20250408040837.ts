// declarations.d.ts

declare module 'rgbquant' {
    export class RgbQuant {
      constructor(options?: { colors?: number; method?: number; });
      quantize(pixels: number[][]): number[][];
    }
  }
  