"use client";
import React, { useCallback, useRef, useState } from "react";
import { CurvePoint, DEFAULT_CURVE_POINTS, buildLUT } from "./toneCurveUtils";
import useDeviceChecker from "../deviceChecker";

type Channel = "rgb" | "r" | "g" | "b";

type Props = {
  pointsRgb: CurvePoint[];
  pointsR: CurvePoint[];
  pointsG: CurvePoint[];
  pointsB: CurvePoint[];
  onChange: (channel: Channel, points: CurvePoint[]) => void;
  isJP: boolean;
};

const CHANNEL_COLORS: Record<Channel, { curve: string; point: string }> = {
  rgb: { curve: "rgb(255, 255, 253)", point: "rgb(40, 40, 40)" },
  r: { curve: "rgb(220, 60, 60)", point: "rgb(200, 40, 40)" },
  g: { curve: "rgb(50, 190, 80)", point: "rgb(30, 160, 60)" },
  b: { curve: "rgb(60, 120, 220)", point: "rgb(37, 69, 225)" },
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

const ToneCurveEditor: React.FC<Props> = ({
  pointsRgb,
  pointsR,
  pointsG,
  pointsB,
  onChange,
  isJP,
}) => {
  const isPC = useDeviceChecker();
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef<number | null>(null);
  const [channel, setChannel] = useState<Channel>("rgb");
  const [centerLocked, setCenterLocked] = useState(false);
  // チェックON時にポイントを自動追加したか記録
  const centerWasAddedRef = useRef(false);

  const points: CurvePoint[] =
    channel === "r"
      ? pointsR
      : channel === "g"
      ? pointsG
      : channel === "b"
      ? pointsB
      : pointsRgb;

  const handleChannelChange = (ch: Channel) => {
    setChannel(ch);
    setCenterLocked(false);
    centerWasAddedRef.current = false;
  };

  const handleCenterLockChange = (checked: boolean) => {
    setCenterLocked(checked);
    if (checked) {
      const hasCenter = points.some((p) => p[0] === 128);
      if (!hasCenter) {
        centerWasAddedRef.current = true;
        const newPoints = ([...points, [128, 128]] as CurvePoint[]).sort(
          (a, b) => a[0] - b[0]
        );
        onChange(channel, newPoints);
      } else {
        centerWasAddedRef.current = false;
        // x=128のポイントをy=128に強制
        onChange(
          channel,
          points.map((p) => (p[0] === 128 ? [128, 128] : p) as CurvePoint)
        );
      }
    } else {
      // チェックOFF: 自動追加したポイントを削除
      if (centerWasAddedRef.current) {
        centerWasAddedRef.current = false;
        onChange(
          channel,
          points.filter((p) => p[0] !== 128)
        );
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
          onChange(channel, next);
          return;
        }
      }

      if (idx === 0) {
        // 左辺(x=0)または下辺(y=0)のみ移動可
        const distToLeft = svgX;
        const distToBottom = SVG_SIZE - svgY;
        if (distToLeft <= distToBottom) {
          next[idx] = [0, newY];
        } else {
          const maxX = next.length > 1 ? next[1][0] - 1 : 255;
          next[idx] = [Math.min(maxX, newX), 0];
        }
      } else if (idx === points.length - 1) {
        // 右辺(x=255)または上辺(y=255)のみ移動可
        const distToRight = SVG_SIZE - svgX;
        const distToTop = svgY;
        if (distToRight <= distToTop) {
          next[idx] = [255, newY];
        } else {
          const minX = next.length > 1 ? next[next.length - 2][0] + 1 : 0;
          next[idx] = [Math.max(minX, newX), 255];
        }
      } else {
        const minX = next[idx - 1][0] + 1;
        const maxX = next[idx + 1][0] - 1;
        next[idx] = [Math.max(minX, Math.min(maxX, newX)), newY];
      }
      onChange(channel, next);
    },
    [points, onChange, centerLocked, channel]
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
          stroke={CHANNEL_COLORS[channel].curve}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* コントロールポイント */}
        {points.map((pt, idx) => {
          const cx = (pt[0] / 255) * SVG_SIZE;
          const cy = SVG_SIZE - (pt[1] / 255) * SVG_SIZE;
          const isCenter = centerLocked && pt[0] === 128;
          const isFirstPoint = idx === 0;
          const isLastPoint = idx === points.length - 1;
          let cursor: string;
          if (isCenter) {
            cursor = "ns-resize";
          } else if (isFirstPoint) {
            cursor = pt[0] === 0 ? "ns-resize" : "ew-resize";
          } else if (isLastPoint) {
            cursor = pt[0] === 255 ? "ns-resize" : "ew-resize";
          } else {
            cursor = "grab";
          }
          return (
            <circle
              key={idx}
              cx={cx}
              cy={cy}
              r={isPC ? 3 : 6}
              fill={
                isCenter ? "rgb(255, 180, 0)" : CHANNEL_COLORS[channel].point
              }
              stroke="rgb(253, 247, 246)"
              strokeWidth={1.5}
              style={{ cursor }}
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          {/* チャンネル選択ドロップダウン */}
          <select
            value={channel}
            onChange={(e) => handleChannelChange(e.target.value as Channel)}
            style={{
              fontSize: "0.75rem",
              padding: "0.1rem 0.3rem",
              border: "1px solid rgb(100,98,110)",
              borderRadius: "3px",
              background: "rgb(220,220,226)",
              cursor: "pointer",
            }}
          >
            <option value="rgb">RGB</option>
            <option value="r">{isJP ? "レッド" : "Red"}</option>
            <option value="g">{isJP ? "グリーン" : "Green"}</option>
            <option value="b">{isJP ? "ブルー" : "Blue"}</option>
          </select>
          {/* 中心を固定 */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.2rem",
              fontSize: "0.75rem",
              cursor: "pointer",
              userSelect: "none",
              marginLeft: "0.2rem",
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
        </div>
        <button
          onClick={() => {
            setCenterLocked(false);
            onChange(channel, [...DEFAULT_CURVE_POINTS]);
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
