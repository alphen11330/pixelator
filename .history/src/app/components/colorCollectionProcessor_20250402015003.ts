const colorCollectionProcessor = (
    cv: any,
    src: any,
    isHue: boolean,
    hue: number,
    isLuminance: boolean,
    luminance: number,
    isSaturation: boolean,
    saturation: number
  ) => {
    let hls = new cv.Mat();
    let alpha = null;
  
    // RGBA画像ならアルファチャンネルを分離
    if (src.channels() === 4) {
      let channels = new cv.MatVector();
      cv.split(src, channels);
      alpha = channels.get(3).clone();
  
      let bgr = new cv.Mat();
      let merged = new cv.MatVector();
      merged.push_back(channels.get(0));
      merged.push_back(channels.get(1));
      merged.push_back(channels.get(2));
  
      cv.merge(merged, bgr);
      cv.cvtColor(bgr, hls, cv.COLOR_RGB2HLS);
  
      // メモリ解放
      bgr.delete();
      channels.delete();
      merged.delete();
    } else {
      cv.cvtColor(src, hls, cv.COLOR_RGB2HLS);
    }
  
    // HLSデータを一括処理
    let hlsData = hls.data; // Uint8Array
    let totalPixels = hls.rows * hls.cols * hls.channels();
  
    for (let i = 0; i < totalPixels; i += 3) {
      if (isHue) hlsData[i] = hue; // Hチャンネル
      if (isLuminance) hlsData[i + 1] = luminance; // Lチャンネル
      if (isSaturation) hlsData[i + 2] = saturation; // Sチャンネル
    }
  
    // HLSをRGBに戻す
    let dst = new cv.Mat();
    cv.cvtColor(hls, dst, cv.COLOR_HLS2RGB);
  
    // アルファチャンネルを統合
    if (alpha) {
      let channels = new cv.MatVector();
      let output = new cv.Mat();
      cv.split(dst, channels);
      channels.push_back(alpha);
      cv.merge(channels, output);
  
      dst.delete();
      dst = output;
  
      // メモリ解放
      channels.delete();
      alpha.delete();
    }
  
    // メモリ解放
    hls.delete();
  
    return dst;
  };
  
  export default colorCollectionProcessor;
  