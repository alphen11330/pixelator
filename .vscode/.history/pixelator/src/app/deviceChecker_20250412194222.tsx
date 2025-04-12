"use client";
import { useEffect, useState } from "react";

const DeviceChecker = () => {
  const [isPC, setIsPC] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsPC(window.innerWidth > 768);
    };

    checkDevice();

    window.addEventListener("resize", checkDevice);
    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  return isPC; // 現在のデバイス状態を返す
};

export default DeviceChecker;
