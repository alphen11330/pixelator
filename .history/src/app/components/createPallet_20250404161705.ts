// createPallet.ts
const createPallet = (imageSrc: string): string[] => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const image = new Image();
  
  return new Promise((resolve) => {
    image.onload = () => {
      canvas.width = image.width;
      canvas.height = image.height;
      ctx?.drawImage(image, 0, 0);
      
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      if (!imageData) return;

      const colors: { [key: string]: number } = {};

      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        
        const rgb = `rgb(${r},${g},${b})`;

        colors[rgb] = (colors[rgb] || 0) + 1;
      }

      const sortedColors = Object.entries(colors)
        .sort((a, b) => b[1] - a[1]) // Sort by frequency
        .slice(0, 8) // Get top 8 most frequent colors
        .map(([color]) => color); // Get only the RGB string

      resolve(sortedColors);
    };

    image.src = imageSrc;
  });
};

export default createPallet;
