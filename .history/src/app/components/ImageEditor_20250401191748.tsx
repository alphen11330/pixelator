"use client";
import React, { useLayoutEffect } from "react";

type Props = {
  imageSrc: string;
  smoothImageSrc: string;
  setSmoothImageSrc: React.Dispatch<React.SetStateAction<string | null>>;
  grayscale: boolean;
  invertColor: boolean;
};

const ImageEditor: React.FC<Props> = ({
  imageSrc,
  smoothImageSrc,
  setSmoothImageSrc,
  grayscale,
  invertColor,
}) => {
  useEffect(() => {
    if (!window.cv) {
      console.error("OpenCV is not loaded.");
      return;
    }
    if (!imageSrc) return;

    // 元の画像から処理を開始
    const imgElement = document.createElement("img");
    imgElement.src = imageSrc;

    imgElement.onload = () => {
      const cv = window.cv;

      // 元の画像からソースMat作成
      let src = cv.imread(imgElement);
      let dst = new cv.Mat();

      // グレースケール処理
      if (grayscale) {
        if (src.channels() === 4) {
          // RGBA画像ならアルファチャンネルを保持しつつRGBをグレースケール化
          const rgbaChannels = new cv.MatVector();
          cv.split(src, rgbaChannels);

          const r = rgbaChannels.get(0);
          const g = rgbaChannels.get(1);
          const b = rgbaChannels.get(2);
          const a = rgbaChannels.get(3); // アルファチャンネル

          const gray = new cv.Mat();
          cv.addWeighted(r, 0.3, g, 0.59, 0, gray);
          cv.addWeighted(gray, 1, b, 0.11, 0, gray);

          // 4チャンネルに戻す
          const mergedChannels = new cv.MatVector();
          mergedChannels.push_back(gray);
          mergedChannels.push_back(gray);
          mergedChannels.push_back(gray);
          mergedChannels.push_back(a); // アルファチャンネルを戻す

          cv.merge(mergedChannels, dst);

          // メモリ解放
          r.delete();
          g.delete();
          b.delete();
          a.delete();
          gray.delete();
          rgbaChannels.delete();
          mergedChannels.delete();
        } else {
          // RGB画像ならそのままグレースケール化
          cv.cvtColor(src, dst, cv.COLOR_RGB2GRAY);
          cv.cvtColor(dst, dst, cv.COLOR_GRAY2RGB);
        }

        // 中間処理のためにsrcを更新
        src.delete();
        src = dst.clone();
      } else {
        // グレースケールしない場合はソースをそのままコピー
        dst = src.clone();
      }

      // 色反転処理
      if (invertColor) {
        let inverted = new cv.Mat();

        if (dst.channels() === 4) {
          // RGBA画像ならアルファチャンネルを保持しつつRGBを色反転
          const rgbaChannels = new cv.MatVector();
          cv.split(dst, rgbaChannels);

          const r = rgbaChannels.get(0);
          const g = rgbaChannels.get(1);
          const b = rgbaChannels.get(2);
          const a = rgbaChannels.get(3); // アルファチャンネル

          // RGB部分を色反転
          cv.bitwise_not(r, r);
          cv.bitwise_not(g, g);
          cv.bitwise_not(b, b);

          // 4チャンネルに戻す
          const mergedChannels = new cv.MatVector();
          mergedChannels.push_back(r);
          mergedChannels.push_back(g);
          mergedChannels.push_back(b);
          mergedChannels.push_back(a); // アルファチャンネルを戻す

          cv.merge(mergedChannels, inverted);

          // メモリ解放
          r.delete();
          g.delete();
          b.delete();
          a.delete();
          rgbaChannels.delete();
          mergedChannels.delete();
        } else {
          // RGB画像ならそのまま色反転
          cv.bitwise_not(dst, inverted);
        }

        dst.delete();
        dst = inverted;
      }

      // キャンバスに描画
      const canvas = document.createElement("canvas");
      canvas.width = imgElement.width;
      canvas.height = imgElement.height;
      cv.imshow(canvas, dst);

      // 変換後の画像をセット
      setSmoothImageSrc(canvas.toDataURL());

      // メモリ解放
      src.delete();
      dst.delete();
    };
  }, [imageSrc, grayscale, invertColor]);

  return null;
};

export default ImageEditor;
