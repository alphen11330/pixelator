import * as RgbQuant from "rgbquant";

type RGB = [number, number, number];

const createPalette = (imageSrc: string, numColors: number = 4): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // CORS回避のため
    img.src = imageSrc;

    img.onload = () => {
      const maxDimension = 200;
      let { width, height } = img;

      if (width > height && width > maxDimension) {
        height = Math.floor(height * (maxDimension / width));
        width = maxDimension;
      } else if (height > maxDimension) {
        width = Math.floor(width * (maxDimension / height));
        height = maxDimension;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Failed to get canvas context');

      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const pixels: RGB[] = [];

      // 画像からRGBデータを取得
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        const a = imageData.data[i + 3];
        if (a >= 125) { // アルファ値が透明でないピクセルを選択
          pixels.push([r, g, b]);
        }
      }

      if (pixels.length === 0) {
        return reject('No valid pixels found');
      }

      // RgbQuantで色を圧縮
      const quantizer = new RgbQuant();
      quantizer.init(pixels);  // 色をサンプルとして初期化

      // 最も代表的な numColors 色を選択
      const palette = quantizer.getPalette(numColors); 

      // パレットをrgb()形式で返す
      resolve(palette.map(([r, g, b]: RGB) => `rgb(${r}, ${g}, ${b})`));
    };

    img.onerror = (e) => reject(`Failed to load image: ${e}`);
  });
};

export default createPalette;
