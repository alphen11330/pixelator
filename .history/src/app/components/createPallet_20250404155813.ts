// utils/createPallet.ts
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

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const color = rgb(${r},${g},${b});

      colorCount[color] = (colorCount[color] || 0) + 1;
    }

    // 色の出現頻度でソート
    const sortedColors = Object.entries(colorCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([color]) => color);

    // 結果をセット（注意：非同期なのでPromise化するほうが良い）
    result.push(...sortedColors);
  };

  return result;
}

function rgb($: any, arg1: { r: number; }, $1: any, arg3: { g: number; }, $2: any, arg5: { b: number; }) {
  throw new Error("Function not implemented.");
}
