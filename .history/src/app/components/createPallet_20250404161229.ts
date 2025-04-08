// createPallet.ts
const createPallet = (imageSrc: string): string[] => {
  const img = new Image();
  img.src = imageSrc;

  // 画像が完全に読み込まれるまで待つために、Imageのonloadイベントを使用
  const colors: string[] = [];

  img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      colors.push(`rgb(${r}, ${g}, ${b})`);
    }

    const colorCount: { [key: string]: number } = {};
    colors.forEach(color => {
      colorCount[color] = (colorCount[color] || 0) + 1;
    });

    const sortedColors = Object.keys(colorCount)
      .sort((a, b) => colorCount[b] - colorCount[a])
      .slice(0, 8);

    return sortedColors;
  };

  return []; // 初期状態では空の配列を返す
};

// モジュールとしてエクスポート
export default createPallet;
