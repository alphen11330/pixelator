import { RgbQuant } from 'rgbquant';

export const createPalette = (imageSrc: string, numColors: number = 8): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageSrc;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Failed to get canvas context');

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, img.width, img.height);

      // rgbquant ライブラリを使用してカラーパレットを生成
      const quantizer = new RgbQuant({
        colors: numColors,
        method: 2,
        initColors: 4096,
        boxSize: [64, 64],
        boxPxls: 2
      });

      quantizer.sample(imageData);
      const palette = quantizer.palette();

      // palette を RGB 文字列に変換
      const colorPalette = palette.map(([r, g, b]) => `rgb(${r}, ${g}, ${b})`);

      resolve(colorPalette);
    };

    img.onerror = (e) => reject(`Failed to load image: ${e}`);
  });
};
