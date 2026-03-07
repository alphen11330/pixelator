"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";

type HarmonyMode = "tetrad" | "analogous" | "dynamic" | "splitcomp";

const W = 160,
  H = 160,
  CX = 80,
  CY = 80;
const R_OUT = 74,
  R_IN = 48,
  MID_R = (R_OUT + R_IN) / 2;
// 青(hue=240°)が下(canvas 90°)になるオフセット: canvas_angle = hue + HUE_OFFSET
const HUE_OFFSET = -150;

const hslToHex = (h: number, s: number, l: number): string => {
  const sn = s / 100,
    ln = l / 100;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
};

const buildAnalogousHues = (
  hub: number,
  offset: number,
  count: number
): number[] => {
  const cOff = Math.min(offset, 120);
  if (count === 1) return [hub % 360];
  return Array.from({ length: count }, (_, k) => {
    const t = (k / (count - 1)) * 2 - 1;
    return (hub + t * cOff + 360) % 360;
  });
};

const buildSplitCompHues = (apex: number, spread: number): number[] => {
  const comp = (apex + 180 + 360) % 360;
  const s = Math.min(Math.max(spread, 1), 150);
  return [apex % 360, (comp + s + 360) % 360, (comp - s + 360) % 360];
};

const MODES: {
  label: string;
  labelJP: string;
  value: HarmonyMode;
  fixedCount: boolean;
  defaultN: number;
}[] = [
  {
    label: "Tetrad",
    labelJP: "テトラード",
    value: "tetrad",
    fixedCount: true,
    defaultN: 4,
  },
  {
    label: "Split Comp",
    labelJP: "分裂補色",
    value: "splitcomp",
    fixedCount: true,
    defaultN: 3,
  },
  {
    label: "Analogous",
    labelJP: "類似配色",
    value: "analogous",
    fixedCount: false,
    defaultN: 4,
  },
  {
    label: "Dynamic",
    labelJP: "均等配色",
    value: "dynamic",
    fixedCount: false,
    defaultN: 6,
  },
];

type Props = {
  isJP: boolean;
  onAdd: (colors: string[]) => void;
  onApply: (colors: string[]) => void;
};

const ColorHarmonyGenerator: React.FC<Props> = ({ isJP, onAdd, onApply }) => {
  const ringRef = useRef<HTMLCanvasElement>(null);
  const topRef = useRef<HTMLCanvasElement>(null);
  const slCanvasRef = useRef<HTMLCanvasElement>(null);
  const slPadRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ type: "hue"; idx: number } | { type: "sl" } | null>(
    null
  );

  // All mutable state in one ref to avoid stale closures in draw functions
  const st = useRef({
    mode: "tetrad" as HarmonyMode,
    n: 4,
    S: 1.0,
    L: 0.5,
    hues: [0, 90, 180, 270] as number[],
    hub: 180,
    offset: 30,
    apex: 0,
    spread: 30,
  });

  // Trigger re-render
  const [tick, setTick] = useState(0);
  const redraw = useCallback(() => setTick((t) => t + 1), []);

  // ── Draw: color wheel ring (once on mount) ──────────────────────────────
  useEffect(() => {
    const canvas = ringRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, W, H);
    for (let d = 0; d < 360; d++) {
      ctx.beginPath();
      ctx.strokeStyle = `hsl(${d},100%,50%)`;
      ctx.lineWidth = R_OUT - R_IN + 2;
      ctx.arc(
        CX,
        CY,
        MID_R,
        ((d + HUE_OFFSET - 1) * Math.PI) / 180,
        ((d + HUE_OFFSET + 1) * Math.PI) / 180
      );
      ctx.stroke();
    }
  }, []);

  // ── Draw: SL pad ─────────────────────────────────────────────────────────
  const drawSL = useCallback(() => {
    const canvas = slCanvasRef.current;
    const pad = slPadRef.current;
    if (!canvas || !pad) return;
    const pw = pad.offsetWidth || 120;
    const ph = pad.offsetHeight || 160;
    canvas.width = pw;
    canvas.height = ph;
    const ctx = canvas.getContext("2d")!;

    const avgH =
      st.current.mode === "analogous"
        ? st.current.hub
        : st.current.hues.reduce((a, b) => a + b, 0) / st.current.hues.length;

    const gS = ctx.createLinearGradient(0, 0, pw, 0);
    gS.addColorStop(0, `hsl(${avgH},0%,50%)`);
    gS.addColorStop(1, `hsl(${avgH},100%,50%)`);
    ctx.fillStyle = gS;
    ctx.fillRect(0, 0, pw, ph);

    const gL = ctx.createLinearGradient(0, 0, 0, ph);
    gL.addColorStop(0, "rgba(255,255,255,0.8)");
    gL.addColorStop(0.45, "rgba(0,0,0,0)");
    gL.addColorStop(1, "rgba(0,0,0,0.8)");
    ctx.fillStyle = gL;
    ctx.fillRect(0, 0, pw, ph);

    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    [0.25, 0.5, 0.75].forEach((t) => {
      ctx.beginPath();
      ctx.moveTo(t * pw, 0);
      ctx.lineTo(t * pw, ph);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, t * ph);
      ctx.lineTo(pw, t * ph);
      ctx.stroke();
    });
  }, []);

  // ── Draw: handles on top canvas ──────────────────────────────────────────
  const drawHandles = useCallback(() => {
    const canvas = topRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, W, H);

    const { mode, hues, hub, offset, apex, spread, S, L } = st.current;
    const sat = Math.round(S * 100),
      lit = Math.round(L * 100);

    // Connecting lines
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    if (mode === "analogous") {
      hues.forEach((h, i) => {
        const r = ((h + HUE_OFFSET) * Math.PI) / 180;
        const x = CX + MID_R * Math.cos(r),
          y = CY + MID_R * Math.sin(r);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
    } else if (mode === "splitcomp") {
      [0, 1, 2, 0].forEach((idx, i) => {
        const r = ((hues[idx] + HUE_OFFSET) * Math.PI) / 180;
        const x = CX + MID_R * Math.cos(r),
          y = CY + MID_R * Math.sin(r);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
    } else {
      hues.forEach((h, i) => {
        const r = ((h + HUE_OFFSET) * Math.PI) / 180;
        const x = CX + MID_R * Math.cos(r),
          y = CY + MID_R * Math.sin(r);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.closePath();
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Analogous: guide marker
    if (mode === "analogous") {
      const guideAngle = (hub + 180 + 360) % 360;
      const gr = ((guideAngle + HUE_OFFSET) * Math.PI) / 180;
      const gx = CX + MID_R * Math.cos(gr),
        gy = CY + MID_R * Math.sin(gr);
      ctx.setLineDash([3, 5]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      const r0 = ((hues[0] + HUE_OFFSET) * Math.PI) / 180;
      ctx.moveTo(gx, gy);
      ctx.lineTo(CX + MID_R * Math.cos(r0), CY + MID_R * Math.sin(r0));
      const rn = ((hues[hues.length - 1] + HUE_OFFSET) * Math.PI) / 180;
      ctx.moveTo(gx, gy);
      ctx.lineTo(CX + MID_R * Math.cos(rn), CY + MID_R * Math.sin(rn));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(Math.PI / 4);
      ctx.beginPath();
      ctx.rect(-6, -6, 12, 12);
      ctx.fillStyle = `hsl(${guideAngle},${sat}%,${lit}%)`;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.stroke();
      ctx.restore();
      ctx.font = "bold 8px monospace";
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.textAlign = "center";
      ctx.fillText(`±${Math.round(Math.min(offset, 120))}°`, CX, CY + 4);
    }

    // Split comp: axis line + spread label
    if (mode === "splitcomp") {
      const apexRad = ((apex + HUE_OFFSET) * Math.PI) / 180;
      const compRad = ((apex + 180 + HUE_OFFSET) * Math.PI) / 180;
      ctx.setLineDash([2, 6]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.beginPath();
      ctx.moveTo(
        CX + MID_R * Math.cos(apexRad),
        CY + MID_R * Math.sin(apexRad)
      );
      ctx.lineTo(
        CX + MID_R * Math.cos(compRad),
        CY + MID_R * Math.sin(compRad)
      );
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = "bold 8px monospace";
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.textAlign = "center";
      ctx.fillText(`±${Math.round(spread)}°`, CX, CY + 4);
    }

    // Handles
    hues.forEach((h, i) => {
      const r = ((h + HUE_OFFSET) * Math.PI) / 180;
      const hx = CX + MID_R * Math.cos(r),
        hy = CY + MID_R * Math.sin(r);
      const isApex = mode === "splitcomp" && i === 0;
      ctx.beginPath();
      ctx.arc(hx, hy, isApex ? 9 : 6, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${h},${sat}%,${lit}%)`;
      ctx.fill();
      ctx.lineWidth = isApex ? 2.5 : 1.5;
      ctx.strokeStyle = isApex ? "#fff" : "rgba(255,255,255,0.75)";
      ctx.stroke();
      if (isApex) {
        ctx.beginPath();
        ctx.arc(hx, hy, 14, 0, Math.PI * 2);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.stroke();
      }
    });
  }, []);

  const draw = useCallback(() => {
    drawSL();
    drawHandles();
  }, [drawSL, drawHandles]);

  useEffect(() => {
    draw();
  }, [tick, draw]);

  // ── Hit test ──────────────────────────────────────────────────────────────
  const hitHue = (mx: number, my: number): number => {
    const dx = mx - CX,
      dy = my - CY,
      dist = Math.hypot(dx, dy);
    if (dist < R_IN - 8 || dist > R_OUT + 8) return -1;
    const angle =
      ((Math.atan2(dy, dx) * 180) / Math.PI - HUE_OFFSET + 360) % 360;
    if (st.current.mode === "analogous") {
      const guideAngle = (st.current.hub + 180 + 360) % 360;
      if (Math.abs(((angle - guideAngle + 540) % 360) - 180) < 15) return -2;
    }
    let best = -1,
      bestD = 22;
    st.current.hues.forEach((h, i) => {
      const diff = Math.abs(((angle - h + 540) % 360) - 180);
      if (diff < bestD) {
        bestD = diff;
        best = i;
      }
    });
    return best;
  };

  // ── Update hue on drag ────────────────────────────────────────────────────
  const updateHue = (mx: number, my: number, idx: number) => {
    const angle =
      ((Math.atan2(my - CY, mx - CX) * 180) / Math.PI - HUE_OFFSET + 360) % 360;
    const s = st.current;
    if (s.mode === "analogous") {
      if (idx === -2) {
        s.hub = (angle + 180 + 360) % 360;
        s.hues = buildAnalogousHues(s.hub, s.offset, s.n);
      } else {
        const isEnd = idx === 0 || idx === s.hues.length - 1;
        if (isEnd) {
          const delta = ((angle - s.hub + 540) % 360) - 180;
          const t =
            s.hues.length === 1
              ? 1
              : Math.abs((idx / (s.hues.length - 1)) * 2 - 1);
          s.offset = Math.max(
            1,
            Math.min(120, Math.abs(delta) / (t < 0.01 ? 1 : t))
          );
          s.hues = buildAnalogousHues(s.hub, s.offset, s.n);
        } else {
          const diff = angle - s.hues[idx];
          s.hub = (s.hub + diff + 360) % 360;
          s.hues = buildAnalogousHues(s.hub, s.offset, s.n);
        }
      }
    } else if (s.mode === "splitcomp") {
      if (idx === 0) {
        s.apex = angle;
        s.hues = buildSplitCompHues(s.apex, s.spread);
      } else {
        const comp = (s.apex + 180 + 360) % 360;
        const delta = ((angle - comp + 540) % 360) - 180;
        s.spread = Math.max(1, Math.min(150, Math.abs(delta)));
        s.hues = buildSplitCompHues(s.apex, s.spread);
      }
    } else if (s.mode === "tetrad") {
      const diff = angle - s.hues[idx];
      if (idx === 0 || idx === 2) {
        s.hues[0] = (s.hues[0] + diff + 360) % 360;
        s.hues[2] = (s.hues[2] + diff + 360) % 360;
      } else {
        s.hues[1] = (s.hues[1] + diff + 360) % 360;
        s.hues[3] = (s.hues[3] + diff + 360) % 360;
      }
    } else {
      const diff = angle - s.hues[idx];
      s.hues = s.hues.map((h) => (h + diff + 360) % 360);
    }
  };

  // ── Pointer events: wheel ─────────────────────────────────────────────────
  const onWheelPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (W / rect.width);
    const my = (e.clientY - rect.top) * (H / rect.height);
    const hi = hitHue(mx, my);
    if (hi >= 0 || hi === -2) {
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = { type: "hue", idx: hi };
    }
  };

  const onWheelPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current || dragRef.current.type !== "hue") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (W / rect.width);
    const my = (e.clientY - rect.top) * (H / rect.height);
    updateHue(mx, my, dragRef.current.idx);
    draw();
  };

  const onWheelPointerUp = () => {
    dragRef.current = null;
    redraw();
  };

  // ── Pointer events: SL pad ────────────────────────────────────────────────
  const updateSL = (e: React.PointerEvent) => {
    const pad = slPadRef.current;
    if (!pad) return;
    const rect = pad.getBoundingClientRect();
    st.current.S = Math.max(
      0.01,
      Math.min(1.0, (e.clientX - rect.left) / rect.width)
    );
    st.current.L = Math.max(
      0.05,
      Math.min(0.95, 1 - (e.clientY - rect.top) / rect.height)
    );
    draw();
  };

  const onSLPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { type: "sl" };
    updateSL(e);
  };

  const onSLPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.type !== "sl") return;
    updateSL(e);
  };

  const onSLPointerUp = () => {
    dragRef.current = null;
    redraw();
  };

  // ── Mode change ───────────────────────────────────────────────────────────
  const [modeUI, setModeUI] = useState<HarmonyMode>("tetrad");
  const [nUI, setNUI] = useState(4);

  const changeMode = (newMode: HarmonyMode, newN: number, resetSL = false) => {
    const s = st.current;
    s.mode = newMode;
    s.n = newN;
    if (newMode === "tetrad") s.hues = [0, 90, 180, 270];
    else if (newMode === "splitcomp") {
      s.apex = 0;
      s.spread = 30;
      s.hues = buildSplitCompHues(0, 30);
    } else if (newMode === "analogous") {
      s.hub = 180;
      s.offset = 30;
      s.hues = buildAnalogousHues(180, 30, newN);
    } else
      s.hues = Array.from({ length: newN }, (_, i) => ((i * 360) / newN) % 360);
    if (resetSL) {
      s.S = 1.0;
      s.L = 0.5;
    }
    setModeUI(newMode);
    setNUI(newN);
    redraw();
  };

  const changeN = (newN: number) => {
    const s = st.current;
    s.n = newN;
    if (s.mode === "analogous")
      s.hues = buildAnalogousHues(s.hub, s.offset, newN);
    else
      s.hues = Array.from({ length: newN }, (_, i) => ((i * 360) / newN) % 360);
    setNUI(newN);
    redraw();
  };

  // ── Natural correction ────────────────────────────────────────────────────
  const [naturalCorrection, setNaturalCorrection] = useState(false);
  const [correctionStrength, setCorrectionStrength] = useState(50); // 0-100

  // ── Derived values for render ─────────────────────────────────────────────
  const sat = Math.round(st.current.S * 100);
  const lit = Math.round(st.current.L * 100);
  // 補正: 黄(60°)→明るく / 青(240°)→暗く  cos((h-60)°) で ±1 に正規化
  const applyNaturalCorrection = (h: number, baseLit: number): number => {
    if (!naturalCorrection) return baseLit;
    const delta =
      Math.cos(((h - 60) * Math.PI) / 180) * (correctionStrength / 100) * 250;
    return Math.max(5, Math.min(95, baseLit + delta));
  };
  const paletteEntries = st.current.hues.map((h) => {
    const correctedL = applyNaturalCorrection(h, lit);
    return { hex: hslToHex(h, sat, correctedL), l: correctedL };
  });
  if (naturalCorrection) paletteEntries.sort((a, b) => b.l - a.l);
  const paletteHex = paletteEntries.map((e) => e.hex);
  const currentMode = MODES.find((m) => m.value === modeUI)!;

  // ── Styles (matching pixelator) ───────────────────────────────────────────
  const btnBase: React.CSSProperties = {
    fontSize: "0.78rem",
    padding: "0.25rem 0.9rem",
    border: "solid 1.5px rgb(102, 122, 149)",
    borderRadius: "5px",
    cursor: "pointer",
    userSelect: "none",
  };

  return (
    <div style={{ userSelect: "none" }}>
      {/* Mode selector + count slider */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.5rem",
        }}
      >
        <select
          value={modeUI}
          onChange={(e) => {
            const cfg = MODES.find((m) => m.value === e.target.value)!;
            changeMode(cfg.value, cfg.defaultN);
          }}
          style={{
            fontSize: "0.75rem",
            padding: "0.1rem 0.3rem",
            border: "1px solid rgb(100,98,110)",
            borderRadius: "3px",
            background: "rgb(220,220,226)",
            cursor: "pointer",
          }}
        >
          {MODES.map((m) => (
            <option key={m.value} value={m.value}>
              {isJP ? m.labelJP : m.label}
            </option>
          ))}
        </select>
        {!currentMode.fixedCount && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              flex: 1,
            }}
          >
            <input
              type="range"
              min={2}
              max={12}
              value={nUI}
              onChange={(e) => changeN(+e.target.value)}
              style={{
                flex: 1,
                accentColor: "rgb(60,120,220)",
                cursor: "pointer",
              }}
            />
            <span
              style={{
                fontSize: "0.72rem",
                minWidth: 16,
                color: "rgb(50,48,60)",
              }}
            >
              {nUI}
            </span>
          </div>
        )}
      </div>

      {/* Wheel + SL pad */}
      <div style={{ display: "flex", gap: "0.5rem", height: H + "px" }}>
        {/* Color wheel */}
        <div
          style={{ position: "relative", flexShrink: 0, width: W, height: H }}
        >
          <canvas
            ref={ringRef}
            width={W}
            height={H}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              borderRadius: "50%",
            }}
          />
          <canvas
            ref={topRef}
            width={W}
            height={H}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              cursor: "crosshair",
              touchAction: "none",
            }}
            onPointerDown={onWheelPointerDown}
            onPointerMove={onWheelPointerMove}
            onPointerUp={onWheelPointerUp}
            onPointerLeave={onWheelPointerUp}
          />
        </div>

        {/* SL pad */}
        <div
          ref={slPadRef}
          style={{
            flex: 1,
            position: "relative",
            borderRadius: "8px",
            overflow: "hidden",
            border: "1px solid rgb(100,98,110)",
            cursor: "crosshair",
            touchAction: "none",
          }}
          onPointerDown={onSLPointerDown}
          onPointerMove={onSLPointerMove}
          onPointerUp={onSLPointerUp}
          onPointerLeave={onSLPointerUp}
        >
          <canvas
            ref={slCanvasRef}
            style={{
              display: "block",
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
            }}
          />
          {/* Dot indicator */}
          <div
            style={{
              position: "absolute",
              width: 13,
              height: 13,
              borderRadius: "50%",
              border: "2px solid white",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.5)",
              background: `hsl(${st.current.hues[0] ?? 0},${sat}%,${lit}%)`,
              left: `${st.current.S * 100}%`,
              top: `${(1 - st.current.L) * 100}%`,
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }}
          />
          {/* S/L label */}
          <div
            style={{
              position: "absolute",
              bottom: 4,
              right: 6,
              fontSize: "0.58rem",
              color: "rgba(255,255,255,0.55)",
              fontFamily: "monospace",
              pointerEvents: "none",
            }}
          >
            S {sat}&nbsp;&nbsp;L {lit}
          </div>
        </div>
      </div>

      {/* ナチュラル補正 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          marginTop: "0.5rem",
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.2rem",
            fontSize: "0.75rem",
            cursor: "pointer",
            userSelect: "none",
            flexShrink: 0,
          }}
        >
          <input
            type="checkbox"
            checked={naturalCorrection}
            onChange={(e) => setNaturalCorrection(e.target.checked)}
            style={{ cursor: "pointer" }}
          />
          {isJP ? "ナチュラル補正" : "Natural"}
        </label>
        {naturalCorrection && (
          <>
            <input
              type="range"
              min={0}
              max={100}
              value={correctionStrength}
              onChange={(e) => setCorrectionStrength(+e.target.value)}
              style={{
                flex: 1,
                accentColor: "rgb(60,120,220)",
                cursor: "pointer",
              }}
            />
            <span
              style={{
                fontSize: "0.72rem",
                minWidth: 24,
                textAlign: "right",
                color: "rgb(50,48,60)",
              }}
            >
              {correctionStrength}
            </span>
          </>
        )}
      </div>

      {/* Palette preview bar */}
      <div
        style={{
          display: "flex",
          height: 22,
          borderRadius: 5,
          overflow: "hidden",
          marginTop: "0.5rem",
          border: "1px solid rgb(100,98,110)",
        }}
      >
        {paletteHex.map((c, i) => (
          <div key={i} style={{ flex: 1, background: c }} />
        ))}
      </div>

      {/* Add / Apply / Reset buttons */}
      <div
        style={{
          display: "flex",
          gap: "0.4rem",
          marginTop: "0.5rem",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <button
            onClick={() => onAdd(paletteHex)}
            style={{ ...btnBase, background: "rgb(220,220,226)" }}
          >
            {isJP ? "追加" : "Add"}
          </button>
          <button
            onClick={() => onApply(paletteHex)}
            style={{ ...btnBase, background: "rgb(220,220,226)" }}
          >
            {isJP ? "反映" : "Apply"}
          </button>
        </div>
        <button
          onClick={() =>
            changeMode(
              modeUI,
              MODES.find((m) => m.value === modeUI)!.defaultN,
              true
            )
          }
          style={{ ...btnBase, background: "rgb(220,220,226)" }}
        >
          {isJP ? "リセット" : "Reset"}
        </button>
      </div>
    </div>
  );
};

export default ColorHarmonyGenerator;
