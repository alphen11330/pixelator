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
    let alpha = new cv.Mat();
    
    // RGBA画像をHLSに変換（アルファチャンネルを分離）
    if (src.channels() === 4) {
        let channels = new cv.MatVector();
        cv.split(src, channels);
        let bgr = new cv.Mat();
        let merged = new cv.MatVector();
        
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
                let pixel = hls.ucharPtr(y, x);
                if(isHue) pixel[0] = hue; // 色相(H)の値を代入
                if (isLuminance) pixel[1] = luminance; // 輝度(L)の値を代入
                pixel[2] = saturation; // 彩度(S)の値を代入


            }
        }
    
    // Lチャネルを統一
    if (isLuminance) {
        for (let y = 0; y < hls.rows; y++) {
            for (let x = 0; x < hls.cols; x++) {
                let pixel = hls.ucharPtr(y, x);
                pixel[1] = luminance; // 輝度(L)の値を代入
            }
        }
    }
    // Sチャネルを統一
    if (isSaturation) {
        for (let y = 0; y < hls.rows; y++) {
            for (let x = 0; x < hls.cols; x++) {
                let pixel = hls.ucharPtr(y, x);
                pixel[2] = saturation; // 彩度(S)の値を代入
            }
        }
    }

    // HLSをRGBに戻す
    let dst = new cv.Mat();
    cv.cvtColor(hls, dst, cv.COLOR_HLS2RGB);
    
    // アルファチャンネルを統合
    if (src.channels() === 4) {
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
