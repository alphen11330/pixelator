const colorCollectionProcessor = (
    cv: any,
    src: any,
    isHue: boolean,
    hue: number,
    isLuminance: boolean, // HSVではValue
    luminance: number,
    isSaturation: boolean,
    saturation: number,
    contrast: boolean,
    contrastLevel: number,
    brightness: boolean,
    brightnessLevel: number
) => {
    const hsv = new cv.Mat();
    let alpha = new cv.Mat();
    let hasAlpha = false;
    
    // RGBA画像をHSVに変換（アルファチャンネルを分離）
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
        cv.cvtColor(bgr, hsv, cv.COLOR_RGB2HSV);
        
        alpha = channels.get(3).clone();
        
        bgr.delete();
        channels.delete();
        merged.delete();
    } else {
        cv.cvtColor(src, hsv, cv.COLOR_RGB2HSV);
    }

    // HSVチャンネルを調整
    for (let y = 0; y < hsv.rows; y++) {
        for (let x = 0; x < hsv.cols; x++) {
            const pixel = hsv.ucharPtr(y, x);
            if (isHue) pixel[0] = hue;          // 色相 H (0-179)
            if (isSaturation) pixel[1] = saturation; // 彩度 S (0-255)
            if (isLuminance) pixel[2] = luminance;   // 明度 V (0-255)
        }
    }

    // HSVをRGBに変換
    let dst = new cv.Mat();
    cv.cvtColor(hsv, dst, cv.COLOR_HSV2RGB);

    if (hasAlpha) {
        const channels = new cv.MatVector();
        const output = new cv.Mat();
        cv.split(dst, channels);
        channels.push_back(alpha);
        cv.merge(channels, output);
        dst.delete();
        dst = output;

        channels.delete();
    }

    hsv.delete();

    // コントラストと明度の調整
    if (contrast || brightness) {
        const adjustedImage = new cv.Mat();
        const contrastFactor = contrast ? contrastLevel : 1.0;
        const brightnessFactor = brightness ? brightnessLevel : 0;

        if (hasAlpha) {
            const rgbaChannels = new cv.MatVector();
            cv.split(dst, rgbaChannels);

            const rgbOnly = new cv.Mat();
            const tempChannels = new cv.MatVector();
            tempChannels.push_back(rgbaChannels.get(0));
            tempChannels.push_back(rgbaChannels.get(1));
            tempChannels.push_back(rgbaChannels.get(2));
            cv.merge(tempChannels, rgbOnly);

            cv.convertScaleAbs(rgbOnly, adjustedImage, contrastFactor, brightnessFactor);

            const output = new cv.Mat();
            const finalChannels = new cv.MatVector();
            const finalRgbChannels = new cv.MatVector();
            cv.split(adjustedImage, finalRgbChannels);

            finalChannels.push_back(finalRgbChannels.get(0));
            finalChannels.push_back(finalRgbChannels.get(1));
            finalChannels.push_back(finalRgbChannels.get(2));
            finalChannels.push_back(alpha);

            cv.merge(finalChannels, output);

            rgbaChannels.delete();
            tempChannels.delete();
            rgbOnly.delete();
            finalChannels.delete();
            finalRgbChannels.delete();
            adjustedImage.delete();
            dst.delete();

            dst = output;
        } else {
            cv.convertScaleAbs(dst, adjustedImage, contrastFactor, brightnessFactor);
            dst.delete();
            dst = adjustedImage;
        }
    }

    if (hasAlpha) {
        alpha.delete();
    }

    return dst;
};

export default colorCollectionProcessor;
