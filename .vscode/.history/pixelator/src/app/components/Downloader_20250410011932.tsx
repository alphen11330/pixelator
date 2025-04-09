import React, { useState } from "react";

interface DownloaderProps {
  dotsImageSrc: string | null;
  fileName?: string;
  minSize?: number;
  buttonText?: string;
}

const Downloader: React.FC<DownloaderProps> = ({
  dotsImageSrc,
  fileName = "pixel-art",
  minSize = 960,
  buttonText = "画像を保存",
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!dotsImageSrc) {
      setError("画像が指定されていません");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const img = new Image();
      img.crossOrigin = "anonymous"; // CORSエラー対策
      img.src = dotsImageSrc;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
      });

      let width = img.width;
      let height = img.height;

      // サイズ調整ロジック
      if (width <= minSize && height <= minSize) {
        const scale = Math.max(minSize / width, minSize / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      } else if (width > minSize || height > minSize) {
        if (width > height) {
          const scale = minSize / width;
          width = minSize;
          height = Math.round(height * scale);
        } else {
          const scale = minSize / height;
          height = minSize;
          width = Math.round(width * scale);
        }
      }

      // キャンバスに描画
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      if (!ctx) {
        throw new Error("Canvas 2D contextの取得に失敗しました");
      }

      // アンチエイリアス無効化（ドット絵の鮮明さを保持）
      ctx.imageSmoothingEnabled = false;

      ctx.drawImage(img, 0, 0, width, height);
      const scaledImage = canvas.toDataURL("image/png");

      // ダウンロード処理
      const link = document.createElement("a");
      link.href = scaledImage;
      link.download = `${fileName}.png`;
      document.body.appendChild(link); // IEとSafariの互換性のため
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ダウンロード中にエラーが発生しました"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <button
        onClick={handleDownload}
        disabled={isLoading || !dotsImageSrc}
        className={`
          relative py-2 px-4 rounded-md font-medium
          transition-all duration-300
          ${
            dotsImageSrc
              ? "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        `}
        aria-label={buttonText}
      >
        {isLoading ? "処理中..." : buttonText}
      </button>

      {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}
    </div>
  );
};

export default Downloader;
