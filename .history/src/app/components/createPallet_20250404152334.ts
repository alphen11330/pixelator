export function createPallet(imageSrc: string): string[] {
  const img = document.createElement('img');
  img.crossOrigin = 'anonymous';
  img.src = imageSrc;

  // 画像がまだ読み込まれていない場合は空配列を返す
  if (!img.complete) return [];

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const colorMap: Record<string, number> = {};

  // すべてのピクセルをチェック（間引きも可能）
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // 近似色でまとめたい場合は、値を丸める（例：5の倍数に）
    const key = `rgb(${r},${g},${b})`;
    colorMap[key] = (colorMap[key] || 0) + 1;
  }

  const topColors = Object.entries(colorMap)
    .sort((a, b) => b[1] - a[1]) // 出現回数でソート
    .slice(0, 12)                  // 上位8色を取得
    .map(([color]) => color);    // カラーフォーマットで返す

  return topColors;
}
