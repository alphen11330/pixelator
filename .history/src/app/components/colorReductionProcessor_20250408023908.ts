const colorReductionProcessor=(
  dotsImageSrc: string,
  colorPalette: string[]
): Promise<string> =>{
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = dotsImageSrc;

    img.onload = () => {
      const width = img.width;
      const height = img.height;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("Canvas context not available");

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, width, height);
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

      // 変換後の画像をDataURLとして返す
      const result = canvas.toDataURL();
      resolve(result);
    };

    img.onerror = () => reject("Failed to load image");
  });
}

// "rgb(255, 255, 255)" → [255, 255, 255]
function parseColorPalette(palette: string[]): [number, number, number][] {
  return palette.map((str) => {
    const match = str.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    return match
      ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])]
      : [0, 0, 0]; // マッチしない場合は黒
  });
}

// 最も近い色を探す
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
 export default colorReductionProcessor