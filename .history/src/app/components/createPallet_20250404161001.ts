const createPallet = (imageSrc: string): string[] => {
  const img = new Image();
  img.src = imageSrc;

  // 画像が完全に読み込まれる前に処理が進まないように
  // Imageのonloadイベントを使って読み込み完了後に処理を実行
  img.onload = () => {
    // Canvasを作成して画像を描画
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // 画像のピクセルデータを取得
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // 色を抽出してリストに格納
    const colors: string[] = [];
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      colors.push(`rgb(${r}, ${g}, ${b})`);
    }

    // 色の頻度を計算
    const colorCount: { [key: string]: number } = {};
    colors.forEach(color => {
      colorCount[color] = (colorCount[color] || 0) + 1;
    });

    // 頻度順にソートして上位8色を取得
    const sortedColors = Object.keys(colorCount)
      .sort((a, b) => colorCount[b] - colorCount[a])
      .slice(0, 8);

    return sortedColors;
  };
};

export default createPallet