export function createPallet(imageSrc: string): string[] {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = document.createElement('img');
  img.crossOrigin = 'anonymous';
  img.src = imageSrc;

  const result: string[] = [];

  // 同期的に動作させるには、画像がすでに読み込まれている必要があります
  if (!ctx || !img.complete) return [];

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imageData.data;

  const colorCount: Record<string, number> = {};

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const color = `rgb(${r},${g},${b})`;
    colorCount[color] = (colorCount[color] || 0) + 1;
  }

  const sortedColors = Object.entries(colorCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([color]) => color);

  return sortedColors;
}
