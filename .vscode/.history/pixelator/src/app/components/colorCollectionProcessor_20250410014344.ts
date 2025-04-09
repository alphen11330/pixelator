type ColorCollectionProcessorProps = {
    cv: any;
    src: any;
    isHue: boolean;
    hue: number;
    isLuminance: boolean;
    luminance: number;
    isSaturation: boolean;
    saturation: number;
    contrast: boolean;
    contrastLevel: number;
    brightness: boolean;
    brightnessLevel: number;
  };
  
  const colorCollectionProcessor = ({
    cv,
    src,
    isHue,
    hue,
    isLuminance,
    luminance,
    isSaturation,
    saturation,
    contrast,
    contrastLevel,
    brightness,
    brightnessLevel,
  }: ColorCollectionProcessorProps) => {
    const hls = new cv.Mat();
    let alpha = new cv.Mat();
  
    if (src.channels() === 4) {
      const channels = new cv.MatVector();
      cv.split(src, channels);
      const bgr = new cv.Mat();
      const merged = new cv.MatVector();
  
      merged.push_back(channels.get(0));
      merged.push_back(channels.get(1));
      merged.push_back(channels.get(2));
      cv.merge(merged, bgr);
      cv.cvtColor(bgr, hls, cv.COLOR_RGB2HLS);
  
      alpha = channels.get(3);
  
      bgr.delete();
      channels.delete();
      merged.delete();
    } else {
      cv.cvtColor(src, hls, cv.COLOR_RGB2HLS);
    }
  
    for (let y = 0; y < hls.rows; y++) {
      for (let x = 0; x < hls.cols; x++) {
        const pixel = hls.ucharPtr(y, x);
        if (isHue) pixel[0] = hue;
        if (isLuminance) pixel[1] = luminance;
        if (isSaturation) pixel[2] = saturation;
      }
    }
  
    let dst = new cv.Mat();
    cv.cvtColor(hls, dst, cv.COLOR_HLS2RGB);
  
    if (src.channels() === 4) {
      const channels = new cv.MatVector();
      const output = new cv.Mat();
      cv.split(dst, channels);
      channels.push_back(alpha);
      cv.merge(channels, output);
      dst.delete();
      dst = output;
  
      channels.delete();
      alpha.delete();
    }
  
    hls.delete();
  
    if (contrast || brightness) {
      const adjustedImage = new cv.Mat();
      const contrastFactor = contrast ? contrastLevel : 1.0;
      const brightnessFactor = brightness ? brightnessLevel : 0;
      dst.convertTo(adjustedImage, -1, contrastFactor, brightnessFactor);
      dst.delete();
      dst = adjustedImage;
    }
  
    return dst;
  };
  
  export default colorCollectionProcessor;
  