import chroma from 'chroma-js';

const createPalette = (imageSrc: string, numColors: number = 8): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = imageSrc;

    img.onload = () => {
      // 画像からピクセルデータを抽出する処理（簡単のため省略）
      // ここでは仮のRGB配列を使います。
      const rgbValues = [
        [255, 0, 0],
        [0, 255, 0],
        [0, 0, 255],
        [255, 255, 0],
        [0, 255, 255],
        [255, 0, 255],
        [128, 128, 128],
        [255, 165, 0],
      ];

      // chroma-jsを使ってカラーパレットを生成
      const palette = chroma.scale(rgbValues).mode('lab').colors(numColors);

      resolve(palette);
    };

    img.onerror = (error) => {
      reject(`Failed to load image: ${error}`);
    };
  });
};
