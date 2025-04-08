export function colorReductionProcessor(
  dotsImageSrc: string,
  colorPalette: string[],
  pixelLength: number = 128 // デフォルトのピクセルサイズ
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = dotsImageSrc;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = pixelLength;
      canvas.height = pixelLength;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("Canvas context not available");

      // ドット画像をリサイズして描画
      ctx.drawImage(img, 0, 0, pixelLength, pixelLength);

      const imageData = ctx.getImageData(0, 0, pixelLength, pixelLength);
      const data = imageData.data;

      const paletteRGB = parseColorPalette(colorPalette);

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const [nr, ng, nb] = getClosestColor([r, g, b], paletteRGB);

        data[i] = nr;
        data[i + 1] = ng;
        data[i + 2] = nb;
      }

      ctx.putImageData(imageData, 0, 0);

      // 拡大したドット画像を別Canvasに描画
      const outputCanvas = document.createElement("canvas");
      outputCanvas.width = 512;
      outputCanvas.height = 512;
      const octx = outputCanvas.getContext("2d");
      if (!octx) return reject("Output context not available");
      octx.imageSmoothingEnabled = false;
      octx.drawImage(canvas, 0, 0, outputCanvas.width, outputCanvas.height);

      const result = outputCanvas.toDataURL();
      resolve(result);
    };

    img.onerror = () => reject("Failed to load image");
  });
}

// パレットの "rgb(R,G,B)" → [R, G, B] に変換
function parseColorPalette(palette: string[]): [number, number, number][] {
  return palette.map((str) => {
    const match = str.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    return match
      ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])]
      : [0, 0, 0]; // 不正な形式なら黒
  });
}

// 一番近い色をRGB配列で取得
function getClosestColor(
  color: [number, number, number],
  palette: [number, number, number][]
): [number, number, number] {
  let minDistance = Infinity;
  let closestColor = palette[0];

  for (const pColor of palette) {
    const dist =
      Math.pow(color[0] - pColor[0], 2) +
      Math.pow(color[1] - pColor[1], 2) +
      Math.pow(color[2] - pColor[2], 2);

    if (dist < minDistance) {
      minDistance = dist;
      closestColor = pColor;
    }
  }

  return closestColor;
}
