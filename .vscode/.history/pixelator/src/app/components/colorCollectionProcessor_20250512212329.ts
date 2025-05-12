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
    let hls = new cv.Mat();
    let alpha = new cv.Mat();
    let rgbChannels = new cv.MatVector(); // 再利用のためここで宣言
    let hlsChannels = new cv.MatVector(); // 再利用のためここで宣言
    let dst = new cv.Mat(); // 結果格納用
    const hasAlpha = src.channels() === 4;

    try { // メモリリーク防止のため try...finally を使う
        // 1. RGBA -> HLS + Alpha 分離 (必要な場合)
        if (hasAlpha) {
            cv.split(src, rgbChannels); // channels -> rgbChannels
            alpha = rgbChannels.get(3).clone(); // アルファをクローンして保持
            const bgr = new cv.Mat();
            const mergedRgb = new cv.MatVector(); // merged -> mergedRgb
            mergedRgb.push_back(rgbChannels.get(0));
            mergedRgb.push_back(rgbChannels.get(1));
            mergedRgb.push_back(rgbChannels.get(2));
            cv.merge(mergedRgb, bgr);
            cv.cvtColor(bgr, hls, cv.COLOR_RGB2HLS); // Note: OpenCV.js uses RGB, not BGR typically for JS input/output
            bgr.delete();
            mergedRgb.delete();
            // rgbChannels は後で使うかもしれないので、まだ delete しない (不要ならここで delete)
            // rgbChannels.delete(); // alpha以外は不要なので解放
            rgbChannels.delete(); // splitしたものはmergeで不要になったので解放すべき
            rgbChannels = new cv.MatVector(); // 再利用のために再初期化

        } else {
            cv.cvtColor(src, hls, cv.COLOR_RGB2HLS);
        }

        // 2. HLSチャンネル加工 (ベクトル化)
        if (isHue || isLuminance || isSaturation) {
            cv.split(hls, hlsChannels);

            if (isHue) {
                const hChannel = hlsChannels.get(0);
                const lut = new cv.Mat(1, 256, cv.CV_8U);
                const lutData = lut.data;
                const hueShiftInt = Math.round(hue);
                for (let i = 0; i < 180; i++) { // HLS Hue range 0-179
                    let shiftedHue = (i + hueShiftInt) % 180;
                    if (shiftedHue < 0) shiftedHue += 180;
                    lutData[i] = shiftedHue;
                }
                for (let i = 180; i < 256; i++) { // Fill rest of LUT
                    lutData[i] = i;
                }
                cv.LUT(hChannel, lut, hChannel); // Apply LUT in-place
                lut.delete();
                // hChannel doesn't need delete as it's part of hlsChannels
            }

            if (isLuminance) {
                const lChannel = hlsChannels.get(1);
                const lChannelAdjusted = new cv.Mat();
                // Add and clamp using convertTo
                lChannel.convertTo(lChannelAdjusted, cv.CV_8U, 1.0, luminance);
                lChannel.delete(); // Delete original L channel Mat from split
                hlsChannels.set(1, lChannelAdjusted); // Replace with adjusted one
            }

            if (isSaturation) {
                const sChannel = hlsChannels.get(2);
                const sChannelAdjusted = new cv.Mat();
                // Add and clamp using convertTo
                sChannel.convertTo(sChannelAdjusted, cv.CV_8U, 1.0, saturation);
                sChannel.delete(); // Delete original S channel Mat from split
                hlsChannels.set(2, sChannelAdjusted); // Replace with adjusted one
            }

            // 元のhlsを削除し、加工後のチャンネルで再merge
            hls.delete();
            hls = new cv.Mat(); // 新しい Mat インスタンスを準備
            cv.merge(hlsChannels, hls);
        }

        // 3. HLS -> RGB 変換
        cv.cvtColor(hls, dst, cv.COLOR_HLS2RGB);

        // 4. アルファチャンネル統合 (必要な場合)
        if (hasAlpha) {
            const rgbResult = dst.clone(); // RGB結果を一時保存
            dst.delete(); // 古いdstを削除
            cv.split(rgbResult, rgbChannels); // 再利用
            rgbChannels.push_back(alpha); // alpha を追加
            dst = new cv.Mat(); // 新しいdst
            cv.merge(rgbChannels, dst); // RGBA に結合
            rgbResult.delete();
        }

        // 5. コントラストと明度の調整 (convertScaleAbs)
        if (contrast || brightness) {
            const adjustedImage = new cv.Mat();
            const contrastFactor = contrast ? contrastLevel : 1.0;
            const brightnessFactor = brightness ? brightnessLevel : 0;

            // RGBA画像に直接適用を試みる (アルファが保持されるか確認)
            // OpenCV.js の convertScaleAbs はアルファを保持するはず
            cv.convertScaleAbs(dst, adjustedImage, contrastFactor, brightnessFactor);

            // もしアルファが保持されない場合の代替 (元のコードに近いが効率化)
            /*
            if (hasAlpha) {
                 const tempRgbaChannels = new cv.MatVector();
                 cv.split(dst, tempRgbaChannels);
                 const rgbOnly = new cv.Mat();
                 const tempRgbChannels = new cv.MatVector();
                 tempRgbChannels.push_back(tempRgbaChannels.get(0));
                 tempRgbChannels.push_back(tempRgbaChannels.get(1));
                 tempRgbChannels.push_back(tempRgbaChannels.get(2));
                 cv.merge(tempRgbChannels, rgbOnly);

                 const rgbAdjusted = new cv.Mat();
                 cv.convertScaleAbs(rgbOnly, rgbAdjusted, contrastFactor, brightnessFactor);

                 const finalRgbChannels = new cv.MatVector();
                 cv.split(rgbAdjusted, finalRgbChannels);

                 const finalChannels = new cv.MatVector();
                 finalChannels.push_back(finalRgbChannels.get(0));
                 finalChannels.push_back(finalRgbChannels.get(1));
                 finalChannels.push_back(finalRgbChannels.get(2));
                 finalChannels.push_back(tempRgbaChannels.get(3)); // 元のアルファ

                 cv.merge(finalChannels, adjustedImage);

                 // Clean up intermediate Mats
                 tempRgbaChannels.delete();
                 tempRgbChannels.delete();
                 rgbOnly.delete();
                 rgbAdjusted.delete();
                 finalRgbChannels.delete();
                 finalChannels.delete();
            } else {
                 cv.convertScaleAbs(dst, adjustedImage, contrastFactor, brightnessFactor);
            }
            */

            dst.delete();
            dst = adjustedImage;
        }

        return dst; // dstの所有権を呼び出し元に渡す

    } finally {
        // tryブロックでreturnされても、ここで解放処理が実行される
        // dst は return するので delete しない
        hls.delete();
        if (hasAlpha) {
            alpha.delete(); // alphaはここで不要になる
        }
        // MatVectorも解放
        rgbChannels.delete();
        hlsChannels.delete();
    }
};

export default colorCollectionProcessor;