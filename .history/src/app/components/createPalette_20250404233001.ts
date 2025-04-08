// lib/createPalette.ts
export const createPalette = (imageSrc: string, numColors: number = 8): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    // colorthiefの型定義をその場で宣言
    declare module 'colorthief' {
      class ColorThief {
        getColor(image: HTMLImageElement): [number, number, number];
        getPalette(image: HTMLImageElement, colorCount: number): [number, number, number][];
      }
      export default ColorThief;
    }

    // colorthiefをインポート
    const ColorThief = require('colorthief');

    const img = new Image();
    img.src = imageSrc;

    img.onload = () => {
      const colorThief = new ColorThief();

      try {
        // 画像からカラーパレットを取得
        const palette = colorThief.getPalette(img, numColors);
        
        // RGB配列を文字列形式に変換して返す
        const colorStrings = palette.map(
          (color) => `rgb(${color[0]}, ${color[1]}, ${color[2]})`
        );
        
        resolve(colorStrings);
      } catch (error) {
        reject('Failed to extract colors from image.');
      }
    };

    img.onerror = (error) => {
      reject(`Failed to load image: ${error}`);
    };
  });
};
