// createPalette.ts

interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * 画像から代表的な色を抽出してカラーパレットを作成する
 * @param img - 画像のDataURL形式または画像へのパス
 * @param colorLevels - 抽出する色の数
 * @returns RGB値の文字列配列 (例: ["rgb(255,0,0)", "rgb(0,255,0)"])
 */
export const createPalette = async (img: string, colorLevels: number): Promise<string[]> => {
  try {
    const pixelData = await getPixelDataFromImage(img);
    return new Promise((resolve) => {
      const worker = new Worker(new URL('./workers/paletteWorker.ts', import.meta.url));
      worker.onmessage = (e: MessageEvent<{ result: string[] }>) => {
        worker.terminate();
        resolve(e.data.result);
      };
      worker.onerror = () => {
        worker.terminate();
        resolve([]);
      };
      worker.postMessage({ pixels: pixelData, colorCount: colorLevels });
    });
  } catch (error) {
    console.error('カラーパレット生成エラー:', error);
    return [];
  }
};

/**
 * 画像からピクセルデータを抽出する
 */
const getPixelDataFromImage = (imgSrc: string): Promise<RGB[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas 2D contextを取得できませんでした'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels: RGB[] = [];

      // サンプリングを行う（すべてのピクセルを処理すると重くなるため）
      const samplingRate = Math.max(1, Math.floor(Math.sqrt(imageData.width * imageData.height) / 100));

      for (let i = 0; i < imageData.data.length; i += 4 * samplingRate) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        const a = imageData.data[i + 3];

        // 透明でないピクセルのみ処理
        if (a >= 128) {
          pixels.push({ r, g, b });
        }
      }

      resolve(pixels);
    };

    img.onerror = () => {
      reject(new Error('画像の読み込みに失敗しました'));
    };

    img.src = imgSrc;
  });
};
