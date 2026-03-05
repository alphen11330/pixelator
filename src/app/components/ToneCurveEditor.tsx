"use client";
import React, { useCallback, useRef, useState } from "react";
import { CurvePoint, DEFAULT_CURVE_POINTS, buildLUT } from "./toneCurveUtils";
import useDeviceChecker from "../deviceChecker";

type Props = {
  points: CurvePoint[];
  onChange: (points: CurvePoint[]) => void;
  isJP: boolean;
};

const SVG_SIZE = 200;

// LUT全値をSVG path d属性に変換（step=1で最大滑らかさ）
const buildPathD = (points: CurvePoint[]): string => {
  const lut = buildLUT(points);
  let d = "";
  for (let x = 0; x <= 255; x++) {
    const sx = ((x / 255) * SVG_SIZE).toFixed(2);
    const sy = (SVG_SIZE - (lut[x] / 255) * SVG_SIZE).toFixed(2);
    d += x === 0 ? `M ${sx} ${sy}` : ` L ${sx} ${sy}`;
  }
  return d;
};

const ToneCurveEditor: React.FC<Props> = ({ points, onChange, isJP }) => {
  const isPC = useDeviceChecker();
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef<number | null>(null);
  const [centerLocked, setCenterLocked] = useState(false);
  // チェックON時にポイントを自動追加したか記録
  const centerWasAddedRef = useRef(false);

  const handleCenterLockChange = (checked: boolean) => {
    setCenterLocked(checked);
    if (checked) {
      const hasCenter = points.some((p) => p[0] === 128);
      if (!hasCenter) {
        centerWasAddedRef.current = true;
        const newPoints = ([...points, [128, 128]] as CurvePoint[]).sort(
          (a, b) => a[0] - b[0]
        );
        onChange(newPoints);
      } else {
        centerWasAddedRef.current = false;
        // x=128のポイントをy=128に強制
        onChange(points.map((p) => (p[0] === 128 ? [128, 128] : p) as CurvePoint));
      }
    } else {
      // チェックOFF: 自動追加したポイントを削除
      if (centerWasAddedRef.current) {
        centerWasAddedRef.current = false;
        onChange(points.filter((p) => p[0] !== 128));
      }
    }
  };

  const svgToValue = (svgX: number, svgY: number): [number, number] => {
    const x = Math.round((svgX / SVG_SIZE) * 255);
    const y = Math.round(((SVG_SIZE - svgY) / SVG_SIZE) * 255);
    return [Math.max(0, Math.min(255, x)), Math.max(0, Math.min(255, y))];
  };

  const getPointerPos = (
    e: React.PointerEvent<SVGSVGElement>
  ): [number, number] => {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    return [
      (e.clientX - rect.left) * (SVG_SIZE / rect.width),
      (e.clientY - rect.top) * (SVG_SIZE / rect.height),
    ];
  };

  const handlePointerDown = useCallback(
    (idx: number, e: React.PointerEvent<SVGCircleElement>) => {
      e.preventDefault();
      (e.target as Element).setPointerCapture(e.pointerId);
      draggingRef.current = idx;
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (draggingRef.current === null) return;
      const idx = draggingRef.current;

      const [svgX, svgY] = getPointerPos(e);
      const [newX, newY] = svgToValue(svgX, svgY);
      const next = [...points] as CurvePoint[];

      // 中心固定: x=128のポイントはx固定・yのみ移動
      if (centerLocked) {
        const centerIdx = points.findIndex((p) => p[0] === 128);
        if (centerIdx !== -1 && idx === centerIdx) {
          next[idx] = [128, newY];
          onChange(next);
          return;
        }
      }

      if (idx === 0) {
        next[idx] = [0, newY];
      } else if (idx === points.length - 1) {
        next[idx] = [255, newY];
      } else {
        const minX = next[idx - 1][0] + 1;
        const maxX = next[idx + 1][0] - 1;
        next[idx] = [Math.max(minX, Math.min(maxX, newX)), newY];
      }
      onChange(next);
    },
    [points, onChange, centerLocked]
  );

  const handlePointerUp = useCallback(() => {
    draggingRef.current = null;
  }, []);

  const pathD = buildPathD(points);

  return (
    <div style={{ userSelect: "none" }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        width="100%"
        style={{
          display: "block",
          border: "2px solid rgb(240,240,244)",
          borderRadius: "4px",
          background: "rgb(100,98,110)",
          touchAction: "none",
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* グリッド線 */}
        {[0.25, 0.5, 0.75].map((frac) => {
          const v = frac * SVG_SIZE;
          return (
            <React.Fragment key={frac}>
              <line
                x1={v}
                y1={0}
                x2={v}
                y2={SVG_SIZE}
                stroke="rgb(200,200,206)"
                strokeWidth={0.5}
              />
              <line
                x1={0}
                y1={v}
                x2={SVG_SIZE}
                y2={v}
                stroke="rgb(200,200,206)"
                strokeWidth={0.5}
              />
            </React.Fragment>
          );
        })}
        {/* 対角線（デフォルト） */}
        <line
          x1={0}
          y1={SVG_SIZE}
          x2={SVG_SIZE}
          y2={0}
          stroke="rgb(160,160,170)"
          strokeWidth={0.8}
          strokeDasharray="4,3"
        />
        {/* カーブ（step=1 で滑らか） */}
        <path
          d={pathD}
          fill="none"
          stroke="rgb(60,120,220)"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* コントロールポイント */}
        {points.map((pt, idx) => {
          const cx = (pt[0] / 255) * SVG_SIZE;
          const cy = SVG_SIZE - (pt[1] / 255) * SVG_SIZE;
          const isCenter = centerLocked && pt[0] === 128;
          return (
            <circle
              key={idx}
              cx={cx}
              cy={cy}
              r={isPC ? 3 : 6}
              fill={isCenter ? "rgb(255, 180, 0)" : "rgb(37, 69, 225)"}
              stroke="rgb(232, 247, 255)"
              strokeWidth={1.5}
              style={{ cursor: isCenter ? "ns-resize" : "grab" }}
              onPointerDown={(e) => handlePointerDown(idx, e)}
            />
          );
        })}
      </svg>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "0.4rem",
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
            fontSize: "0.75rem",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <input
            type="checkbox"
            checked={centerLocked}
            onChange={(e) => handleCenterLockChange(e.target.checked)}
            style={{ cursor: "pointer" }}
          />
          {isJP ? "中心を固定" : "Lock Center"}
        </label>
        <button
          onClick={() => {
            setCenterLocked(false);
            onChange([...DEFAULT_CURVE_POINTS]);
          }}
          style={{
            fontSize: "0.75rem",
            padding: "0.15rem 0.6rem",
            border: "1px solid rgb(100,98,110)",
            borderRadius: "3px",
            background: "rgb(220,220,226)",
            cursor: "pointer",
          }}
        >
          {isJP ? "リセット" : "Reset"}
        </button>
      </div>
    </div>
  );
};

export default ToneCurveEditor;
