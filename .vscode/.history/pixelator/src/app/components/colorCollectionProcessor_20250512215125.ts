const colorCollectionProcessorOptimized = (
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
    let hls = new cv.Mat();
    let dst = new cv.Mat();
    let alpha: cv.Mat | null = null;
    let hasAlpha = false;

    // RGBA画像をHLSに変換（アルファチャンネルを分離）
    if (src.channels() === 4) {
        hasAlpha = true;
        const channels = new cv.MatVector();
        cv.split(src, channels);
        const bgr = new cv.Mat();
        const merged = new cv.MatVector();

        merged.push_back(channels.get(0));
        merged.push_back(channels.get(1));
        merged.push_back(channels.get(2));
        cv.merge(merged, bgr);
        cv.cvtColor(bgr, hls, cv.COLOR_RGB2HLS);
        alpha = channels.get(3).clone(); // クローンを作成して保持

        bgr.delete();
        channels.delete();
        merged.delete();
    } else {
        cv.cvtColor(src, hls, cv.COLOR_RGB2HLS);
    }

    // HLSチャンネルを加工
    if (isHue || isLuminance || isSaturation) {
        for (let y = 0; y < hls.rows; y++) {
            for (let x = 0; x < hls.cols; x++) {
                const pixel = hls.ucharPtr(y, x);
                if (isHue) {
                    pixel[0] = (pixel[0] + hue) % 180;
                    if (pixel[0] < 0) pixel[0] += 180;
                }
                if (isLuminance) {
                    let newLuminance = pixel[1] + luminance;
                    pixel[1] = Math.max(0, Math.min(255, newLuminance));
                }
                if (isSaturation) {
                    let newSaturation = pixel[2] + saturation;
                    pixel[2] = Math.max(0, Math.min(255, newSaturation));
                }
            }
        }
    }

    // HLSをRGBに戻す
    cv.cvtColor(hls, dst, cv.COLOR_HLS2RGB);
    hls.delete(); // HLSはもう不要なのでここで解放

    // アルファチャンネルを統合
    if (hasAlpha && alpha) {
        const channels = new cv.MatVector();
        const output = new cv.Mat();
        cv.split(dst, channels);
        channels.push_back(alpha);
        cv.merge(channels, output);
        dst.delete();
        dst = output;
        channels.delete();
        alpha.delete(); // 結合後に解放
        alpha = null;
    }

    // コントラストと明度の調整
    if (contrast || brightness) {
        const contrastFactor = contrast ? contrastLevel : 1.0;
        const brightnessFactor = brightness ? brightnessLevel : 0;

        if (hasAlpha && dst.channels() === 4) {
            const rgbaChannels = new cv.MatVector();
            cv.split(dst, rgbaChannels);
            const rgbOnly = new cv.Mat();
            const tempChannels = new cv.MatVector();
            tempChannels.push_back(rgbaChannels.get(0));
            tempChannels.push_back(rgbaChannels.get(1));
            tempChannels.push_back(rgbaChannels.get(2));
            cv.merge(tempChannels, rgbOnly);

            const adjustedRgb = new cv.Mat();
            cv.convertScaleAbs(rgbOnly, adjustedRgb, contrastFactor, brightnessFactor);

            const outputChannels = new cv.MatVector();
            cv.split(adjustedRgb, outputChannels);
            outputChannels.push_back(rgbaChannels.get(3));
            const output = new cv.Mat();
            cv.merge(outputChannels, output);

            rgbaChannels.delete();
            rgbOnly.delete();
            tempChannels.delete();
            adjustedRgb.delete();
            outputChannels.delete();
            dst.delete();
            dst = output;
        } else {
            const adjustedImage = new cv.Mat();
            cv.convertScaleAbs(dst, adjustedImage, contrastFactor, brightnessFactor);
            dst.delete();
            dst = adjustedImage;
        }
    }

    return dst;
};

export default colorCollectionProcessorOptimized;