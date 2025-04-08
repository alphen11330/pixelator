export function createPallet(imageSrc: string): string[] {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  const result: string[] = [];

  img.crossOrigin = 'Anonymous'; // クロスオリジン対応
  img.src = imageSrc;

  img.onload = () => {
    // canvasサイズ調整（必要に応じて） 
    canvas.width = img.width;
    canvas.height = img.height;

    if (!ctx) return;

    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const data = imageData.data;

    const colorCount: Record<string, number> = {};

    // 色をカウント
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const color = `rgb(${r},${g},${b})`;

      colorCount[color] = (colorCount[color] || 0) + 1;
    }

    // 輝度計算関数
    function calculateLuminance(r: number, g: number, b: number): number {
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    // 色の輝度でソート
    const sortedColors = Object.entries(colorCount)
      .map(([color, count]) => {
        const [r, g, b] = color
          .slice(4, -1)
          .split(',')
          .map(Number);
        const luminance = calculateLuminance(r, g, b);
        return { color, luminance, count };
      })
      .sort((a, b) => b.luminance - a.luminance) // 輝度順にソート
      .slice(0, 8)
      .map(({ color }) => color); // 上位8色を取得

    // 結果をセット（非同期にPromise化することをお勧めします）
    result.push(...sortedColors);
  };

  return result;
}
