"use client";
import { useEffect, useState } from "react";

const useDeviceChecker = () => {
  const [isPC, setIsPC] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkDevice = () => {
      const isWideEnough = window.innerWidth > 768;
      const isLandscape = window.innerWidth >= window.innerHeight;
      setIsPC(isWideEnough || isLandscape);
    };

    checkDevice();

    window.addEventListener("resize", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  return isPC; // 現在のデバイス状態を返す
};

export default useDeviceChecker;
