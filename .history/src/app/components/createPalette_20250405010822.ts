const createPalette = (imageSrc: string, numColors: number = 256): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // クロスドメイン対応
    img.src = imageSrc;

    img.onload = () => {
      const MAX_SIZE = 200; // 最大の幅・高さを200pxに制限
      let { width, height } = img;

      const aspectRatio = width / height;

      // サイズ縮小（縦長・横長いずれも考慮）
      if (width > height && width > MAX_SIZE) {
        width = MAX_SIZE;
        height = Math.round(MAX_SIZE / aspectRatio);
      } else if (height > width && height > MAX_SIZE) {
        height = MAX_SIZE;
        width = Math.round(MAX_SIZE * aspectRatio);
      } else if (width > MAX_SIZE) {
        width = height = MAX_SIZE; // 正方形画像も縮小
      }

      // Canvasへ描画
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Failed to get canvas context');

      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const pixels: RGB[] = [];

      // RGBデータ抽出（透明度チェックあり）
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        const a = imageData.data[i + 3];
        if (a >= 125) {
          pixels.push([r, g, b]);
        }
      }

      if (pixels.length === 0) {
        return reject('No valid pixels found');
      }

      const palette = wuQuantization(pixels, numColors);

      resolve(palette.map(([r, g, b]) => `rgb(${r}, ${g}, ${b})`));
    };

    img.onerror = (e) => reject(`Failed to load image: ${e}`);
  });
};

export default createPalette;
