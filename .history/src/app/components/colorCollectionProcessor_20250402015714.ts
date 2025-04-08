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
    try {
      let hls = new cv.Mat();
      let alpha = null;
  
      // RGBA画像ならアルファチャンネルを分離
      if (src.channels() === 4) {
        let channels = new cv.MatVector();
        cv.split(src, channels);
        
        // もしアルファチャンネルがあれば保持
        alpha = channels.get(3) ? channels.get(3).clone() : null;
  
        let bgr = new cv.Mat();
        let merged = new cv.MatVector();
        merged.push_back(channels.get(0)); // Rチャンネル
        merged.push_back(channels.get(1)); // Gチャンネル
        merged.push_back(channels.get(2)); // Bチャンネル
  
        cv.merge(merged, bgr); // RGBとして再統合
        cv.cvtColor(bgr, hls, cv.COLOR_RGB2HLS); // HLSに変換
  
        // メモリ解放
        bgr.delete();
        channels.delete();
        merged.delete();
      } else {
        cv.cvtColor(src, hls, cv.COLOR_RGB2HLS); // 通常のRGBの場合
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
  
      // アルファチャンネルを統合（alphaがnullでない場合）
      if (alpha) {
        let channels = new cv.MatVector();
        let output = new cv.Mat();
        cv.split(dst, channels); // RGBを分割
        channels.push_back(alpha); // アルファチャンネルを追加
        cv.merge(channels, output); // 再統合
  
        dst.delete();
        dst = output;
  
        // メモリ解放
        channels.delete();
        alpha.delete();
      }
  
      // メモリ解放
      hls.delete();
  
      return dst;
    } catch (error) {
      alert("Error in colorCollectionProcessor:", error);
      return null; // エラー時にはnullを返す
    }
  };
  
  export default colorCollectionProcessor;
  