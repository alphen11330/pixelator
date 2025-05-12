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
    const dst = new cv.Mat();
    let alpha: any = null;
    let hasAlpha = src.channels() === 4;

    // RGBA画像をHLSに変換し、アルファチャンネルを分離
    if (hasAlpha) {
        const channels = new cv.MatVector();
        cv.split(src, channels);
        const b = channels.get(0), g = channels.get(1), r = channels.get(2), a = channels.get(3);
        alpha = a.clone();

        const bgr = new cv.MatVector();
        bgr.push_back(r);
        bgr.push_back(g);
        bgr.push_back(b);
        const mergedBgr = new cv.Mat();
        cv.merge(bgr, mergedBgr);
        cv.cvtColor(mergedBgr, hls, cv.COLOR_RGB2HLS);

        // メモリ解放
        b.delete(); g.delete(); r.delete(); a.delete();
        channels.delete(); bgr.delete(); mergedBgr.delete();
    } else {
        cv.cvtColor(src, hls, cv.COLOR_RGB2HLS);
    }

    // HLSチャンネルをピクセル単位で加工
    for (let y = 0; y < hls.rows; y++) {
        for (let x = 0; x < hls.cols; x++) {
            const pixel = hls.ucharPtr(y, x);
            if (isHue) {
                pixel[0] = (pixel[0] + hue + 180) % 180;
            }
            if (isLuminance) {
                pixel[1] = Math.min(255, Math.max(0, pixel[1] + luminance));
            }
            if (isSaturation) {
                pixel[2] = Math.min(255, Math.max(0, pixel[2] + saturation));
            }
        }
    }

    // RGBへ変換
    cv.cvtColor(hls, dst, cv.COLOR_HLS2RGB);
    hls.delete();

    // アルファ統合（RGBAに戻す）
    if (hasAlpha) {
        const rgbChannels = new cv.MatVector();
        const final = new cv.MatVector();
        cv.split(dst, rgbChannels);
        final.push_back(rgbChannels.get(0));
        final.push_back(rgbChannels.get(1));
        final.push_back(rgbChannels.get(2));
        final.push_back(alpha);
        const merged = new cv.Mat();
        cv.merge(final, merged);
        dst.delete();
        rgbChannels.delete();
        final.delete();
        dst = merged;
    }

    // コントラスト・明度調整
    if (contrast || brightness) {
        const adjusted = new cv.Mat();
        const alphaChannel = hasAlpha ? new cv.Mat() : null;

        if (hasAlpha) {
            const rgba = new cv.MatVector();
            cv.split(dst, rgba);
            const rgb = new cv.MatVector();
            rgb.push_back(rgba.get(0));
            rgb.push_back(rgba.get(1));
            rgb.push_back(rgba.get(2));
            alphaChannel.assign(rgba.get(3));

            const rgbMat = new cv.Mat();
            cv.merge(rgb, rgbMat);
            cv.convertScaleAbs(rgbMat, adjusted, contrast ? contrastLevel : 1.0, brightness ? brightnessLevel : 0);

            const finalChannels = new cv.MatVector();
            const adjustedChannels = new cv.MatVector();
            cv.split(adjusted, adjustedChannels);
            finalChannels.push_back(adjustedChannels.get(0));
            finalChannels.push_back(adjustedChannels.get(1));
            finalChannels.push_back(adjustedChannels.get(2));
            finalChannels.push_back(alphaChannel);

            const output = new cv.Mat();
            cv.merge(finalChannels, output);

            // メモリ解放
            rgba.delete(); rgb.delete(); rgbMat.delete();
            adjustedChannels.delete(); finalChannels.delete(); alphaChannel.delete();
            adjusted.delete(); dst.delete();

            return output;
        } else {
            cv.convertScaleAbs(dst, adjusted, contrast ? contrastLevel : 1.0, brightness ? brightnessLevel : 0);
            dst.delete();
            return adjusted;
        }
    }

    // 最後にアルファ解放
    if (hasAlpha && alpha) {
        alpha.delete();
    }

    return dst;
};

export default colorCollectionProcessor;
