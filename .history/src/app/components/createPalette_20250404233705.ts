// lib/createPalette.ts
import chroma from 'chroma-js';

export const createPalette = (imageSrc: string, numColors: number = 8): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = imageSrc;

    img.onload = () => {
      // Canvasを使って画像からピクセルデータを取得
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject('Failed to get canvas context');
        return;
      }

      // 画像のサイズを設定
      canvas.width = img.width;
      canvas.height = img.height;

      // 画像をキャンバスに描画
      ctx.drawImage(img, 0, 0);

      // キャンバスからピクセルデータを取得
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // RGB値を収集
      const rgbValues: string[] = [];
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];     // Red
        const g = pixels[i + 1]; // Green
        const b = pixels[i + 2]; // Blue
        rgbValues.push(`rgb(${r}, ${g}, ${b})`);
      }

      // chroma.jsを使ってカラーパレットを生成
      const palette = chroma(rgbValues).scale().mode('rgb').colors(numColors);

      resolve(palette);
    };

    img.onerror = (error) => {
      reject(`Failed to load image: ${error}`);
    };
  });
};


export default createPalette