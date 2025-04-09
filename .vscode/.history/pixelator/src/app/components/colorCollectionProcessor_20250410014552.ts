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
    
    // RGBA画像をHLSに変換（アルファチャンネルを分離）
    if (src.channels() === 4) {
      const channels = new cv.MatVector();
      cv.split(src, channels);
      const bgr = new cv.Mat();
      const merged = new cv.MatVector();
      
      // BGR部分のみHLSに変換
      merged.push_back(channels.get(0));
      merged.push_back(channels.get(1));
      merged.push_back(channels.get(2));
      cv.merge(merged, bgr);
      cv.cvtColor(bgr, hls, cv.COLOR_RGB2HLS);
      
      // アルファチャンネルを保持
      alpha = channels.get(3);
      
      // メモリ解放
      bgr.delete();
      channels.delete();
      merged.delete();
    } else {
      cv.cvtColor(src, hls, cv.COLOR_RGB2HLS);
    }
    
    // HLSチャンネルを統一
    for (let y = 0; y < hls.rows; y++) {
      for (let x = 0; x < hls.cols; x++) {
        const pixel = hls.ucharPtr(y, x);
        if (isHue) pixel[0] = hue; // 色相(H)の値を代入
        if (isLuminance) pixel[1] = luminance; // 輝度(L)の値を代入
        if (isSaturation) pixel[2] = saturation; // 彩度(S)の値を代入
      }
    }
  
    // HLSをRGBに戻す
    let dst = new cv.Mat();
    cv.cvtColor(hls, dst, cv.COLOR_HLS2RGB);
    
    // アルファチャンネルを統合
    if (src.channels() === 4) {
      const channels = new cv.MatVector();
      const output = new cv.Mat();
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
    
    // コントラストと明度の調整
    if (contrast || brightness) {
      const adjustedImage = new cv.Mat();
      
      // コントラストと明度の調整値を設定
      // コントラスト: contrastLevel (1.0がデフォルト、1.0より大きいとコントラスト増加)
      // 明度: brightnessLevel (0がデフォルト、正の値で明るく、負の値で暗く)
      const contrastFactor = contrast ? contrastLevel : 1.0;
      const brightnessFactor = brightness ? brightnessLevel : 0;
      
      // コントラストと明度を調整する行列を作成
      dst.convertTo(adjustedImage, -1, contrastFactor, brightnessFactor);
      
      // 調整前の画像を解放
      dst.delete();
      dst = adjustedImage;
    }
    
    return dst;
  };
  
  export default colorCollectionProcessor;
  