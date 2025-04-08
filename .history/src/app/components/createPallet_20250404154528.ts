import RgbQuant from 'rgbquant';

export function createPallet(imageSrc: string): string[] {
  const img = new Image();
  img.crossOrigin = 'anonymous'; // CORS対応
  img.src = imageSrc;

  // 画像の読み込みが完了したら処理を開始
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const quantizer = new RgbQuant({ colors: 8 }); // 8色に制限
    const reducedPalette = quantizer.reduce(imageData.data); // 色量子化処理

    // カラーパレットをRGB形式の文字列に変換
    const palette = reducedPalette.map(([r, g, b]) => `rgb(${r},${g},${b})`);
    
    console.log(palette); // 8色のカラーパレットが出力される
    return palette;
  };
}
