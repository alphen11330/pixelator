async function createPallet(imageSrc) {
    return new Promise((resolve, reject) => {
      let img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = imageSrc;
      img.onload = () => {
        let canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
  
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let src = cv.matFromImageData(imageData);
        let samples = src.reshape(1, src.rows * src.cols);
        samples.convertTo(samples, cv.CV_32F);
        
        let k = 8;
        let labels = new cv.Mat();
        let centers = new cv.Mat();
        let criteria = new cv.TermCriteria(cv.TermCriteria_EPS + cv.TermCriteria_MAX_ITER, 10, 1.0);
        cv.kmeans(samples, k, labels, criteria, 3, cv.KMEANS_PP_CENTERS, centers);
  
        let colors = [];
        for (let i = 0; i < k; i++) {
          let b = centers.floatAt(i, 0);
          let g = centers.floatAt(i, 1);
          let r = centers.floatAt(i, 2);
          let hls = rgbToHls(r, g, b);
          colors.push(`hsl(${hls[0]}, ${hls[1]}%, ${hls[2]}%)`);
        }
  
        src.delete();
        samples.delete();
        labels.delete();
        centers.delete();
        resolve(colors);
      };
      img.onerror = (err) => reject(err);
    });
  }
  
  function rgbToHls(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, l = (max + min) / 2;
    let s = 0;
    if (max !== min) {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h *= 60;
    } else {
      h = 0;
    }
    return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
  }
  