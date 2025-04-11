const colorCollectionProcessor = (
    cv: any,
    src: any,
    isHue: boolean,
    hue: number,
    isLuminance: boolean,
    luminance: number,
    isSaturation: boolean,
    saturation: number,
    contrast: boolean,
    contrastLevel: number,
    brightness: boolean,
    brightnessLevel: number
) => {
    const hls = new cv.Mat();
    let alpha = new cv.Mat();
    let hasAlpha = false;
    
    // RGBA画像をHLSに変換（アルファチャンネルを分離）
    if (src.channels() === 4) {
        hasAlpha = true;
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
        alpha = channels.get(3).clone(); // クローンを作成して保持
        
        // メモリ解放
        bgr.delete();
        channels.delete();
        merged.delete();
    } else {
        cv.cvtColor(src, hls, cv.COLOR_RGB2HLS);
    }
    
    // HLSチャンネルを加工
    for (let y = 0; y < hls.rows; y++) {
        for (let x = 0; x < hls.cols; x++) {
            const pixel = hls.ucharPtr(y, x);
            if (isHue) {
                // 現在の色相に回転量を加算
                pixel[0] = (pixel[0] + hue) % 180;  // 色相はOpenCVで0〜179度の範囲
                if (pixel[0] < 0) pixel[0] += 180; // 負の値にならないように調整
            }
            if (isLuminance) pixel[1] = luminance; // 輝度(L)の値を代入
            if (isSaturation) {
                // 現在の彩度に与えられた値を加算
                let newSaturation = pixel[2] + saturation;
    
                // 彩度が範囲を超えないように制限
                if (newSaturation < 0) newSaturation = 0;
                if (newSaturation > 255) newSaturation = 255;
    
                // 画像の彩度が最初から高い場合でも、変化を抑えたい場合にスケーリング
                // 加算後、範囲内に収めるだけではなく、スムーズに変化させる処理
                pixel[2] = newSaturation;
            }
            }
        }
    }

    // HLSをRGBに戻す
    let dst = new cv.Mat();
    cv.cvtColor(hls, dst, cv.COLOR_HLS2RGB);
    
    // アルファチャンネルを統合
    if (hasAlpha) {
        const channels = new cv.MatVector();
        const output = new cv.Mat();
        cv.split(dst, channels);
        channels.push_back(alpha); // この時点でalphaはまだ有効
        cv.merge(channels, output);
        dst.delete();
        dst = output;
        
        // メモリ解放
        channels.delete();
        // alphaはこの時点では削除しない - コントラスト調整で使用するため
    }
    
    // メモリ解放
    hls.delete();
    
    // コントラストと明度の調整（convertScaleAbs()を使用）
    if (contrast || brightness) {
        const adjustedImage = new cv.Mat();
        
        // コントラストと明度の調整値を設定
        const contrastFactor = contrast ? contrastLevel : 1.0;
        const brightnessFactor = brightness ? brightnessLevel : 0;
        
        if (hasAlpha) {
            // アルファチャンネルを分離
            const rgbaChannels = new cv.MatVector();
            cv.split(dst, rgbaChannels);
            
            // RGB部分のみを取得
            const rgbOnly = new cv.Mat();
            const tempChannels = new cv.MatVector();
            tempChannels.push_back(rgbaChannels.get(0));
            tempChannels.push_back(rgbaChannels.get(1));
            tempChannels.push_back(rgbaChannels.get(2));
            cv.merge(tempChannels, rgbOnly);
            
            // RGBにコントラスト・明度調整適用
            cv.convertScaleAbs(rgbOnly, adjustedImage, contrastFactor, brightnessFactor);
            
            // 調整されたRGBとアルファを再統合
            const output = new cv.Mat();
            const finalChannels = new cv.MatVector();
            const finalRgbChannels = new cv.MatVector();
            cv.split(adjustedImage, finalRgbChannels);
            
            finalChannels.push_back(finalRgbChannels.get(0));
            finalChannels.push_back(finalRgbChannels.get(1));
            finalChannels.push_back(finalRgbChannels.get(2));
            finalChannels.push_back(alpha); // ここでalphaを使用
            
            cv.merge(finalChannels, output);
            
            // メモリ解放
            rgbaChannels.delete();
            tempChannels.delete();
            rgbOnly.delete();
            finalChannels.delete();
            finalRgbChannels.delete();
            adjustedImage.delete();
            dst.delete();
            
            dst = output;
        } else {
            // アルファなしの場合は単純にコントラスト・明度調整
            cv.convertScaleAbs(dst, adjustedImage, contrastFactor, brightnessFactor);
            dst.delete();
            dst = adjustedImage;
        }
    }
    
    // 最後にアルファをクリーンアップ
    if (hasAlpha) {
        alpha.delete();
    }
    
    return dst;
};
  
export default colorCollectionProcessor;