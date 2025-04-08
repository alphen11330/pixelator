import RgbQuant from 'rgbquant';

export function createPallet(imageSrc: string): string[] {
  const img = new Image();
  img.crossOrigin = 'anonymous'; // CORS対応
  img.src = imageSrc;

  return new Promise((resolve, reject) => {
    // 画像の読み込みが完了したら処理を開始
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject('Canvas context is unavailable');
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const quantizer = new RgbQuant({ colors: 8 }); // 8色に制限

      try {
        const reducedPalette = quantizer.reduce(imageData.data); // 色量子化処理

        // reducedPaletteがnullやundefinedでないかをチェック
        if (!reducedPalette) {
          reject('Color quantization failed');
          return;
        }

        // カラーパレットをRGB形式の文字列に変換
        const palette = reducedPalette.map(([r, g, b]) => `rgb(${r},${g},${b})`);
        resolve(palette);  // 成功した場合にパレットを返す
      } catch (error) {
        reject(`Error during color quantization: ${error}`);
      }
    };

    img.onerror = () => {
      reject('Image loading failed');
    };
  });
}
