"use client";
import { useEffect, useState } from "react";

const DeviceChecker = () => {
  const [isPC, setIsPC] = useState(false);

  useEffect(() => {
    // デバイスをチェック
    const checkDevice = () => {
      setIsPC(window.innerWidth > 768);
    };

    // 初期判定
    checkDevice();

    // リサイズイベントを監視してデバイスの変更を判定
    window.addEventListener("resize", checkDevice);

    // クリーンアップ処理を設定（コンポーネントのアンマウント時）
    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []); // 空の依存配列でマウント・アンマウント時のみ実行

  return isPC; // 現在のデバイス状態を返す
};

export default DeviceChecker;
