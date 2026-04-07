"use client";

import type { GraphicItem, LibraryItemPayload, SymbolPin } from "@/lib/kicad-render-types";

function arcPath(
  start: [number, number],
  mid: [number, number],
  end: [number, number],
): string {
  const [x1, y1] = start;
  const [xm, ym] = mid;
  const [x2, y2] = end;

  // Find circumscribed circle from 3 points
  const ax = x1, ay = y1;
  const bx = xm, by = ym;
  const cx = x2, cy = y2;

  const D = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(D) < 1e-10) {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }

  const ux =
    ((ax * ax + ay * ay) * (by - cy) +
      (bx * bx + by * by) * (cy - ay) +
      (cx * cx + cy * cy) * (ay - by)) / D;
  const uy =
    ((ax * ax + ay * ay) * (cx - bx) +
      (bx * bx + by * by) * (ax - cx) +
      (cx * cx + cy * cy) * (bx - ax)) / D;

  const r = Math.sqrt((ax - ux) ** 2 + (ay - uy) ** 2);

  // Determine sweep direction using cross product
  const cross = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const sweepFlag = cross > 0 ? 0 : 1;

  // Large arc flag: check if mid is on the major arc
  const angleStart = Math.atan2(ay - uy, ax - ux);
  const angleMid = Math.atan2(ym - uy, xm - ux);
  const angleEnd = Math.atan2(y2 - uy, x2 - ux);

  let startToEnd = angleEnd - angleStart;
  let startToMid = angleMid - angleStart;

  if (sweepFlag === 1) {
    if (startToEnd < 0) startToEnd += 2 * Math.PI;
    if (startToMid < 0) startToMid += 2 * Math.PI;
  } else {
    if (startToEnd > 0) startToEnd -= 2 * Math.PI;
    if (startToMid > 0) startToMid -= 2 * Math.PI;
  }

  const largeArc =
    Math.abs(startToEnd) > Math.PI ? 1 : 0;

  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} ${sweepFlag} ${x2} ${y2}`;
}

function KiCadGraphic({ item }: { item: GraphicItem }) {
  const strokeColor = "#666";
  const sw = item.stroke_width || 0.254;
  const fillColor =
    item.fill === "background" ? "#1a1a1a" :
    item.fill === "outline" ? strokeColor :
    "none";

  switch (item.type) {
    case "rectangle": {
      if (!item.start || !item.end) return null;
      const x = Math.min(item.start[0], item.end[0]);
      const y = Math.min(item.start[1], item.end[1]);
      const w = Math.abs(item.end[0] - item.start[0]);
      const h = Math.abs(item.end[1] - item.start[1]);
      return (
        <rect
          x={x} y={y} width={w} height={h}
          stroke={strokeColor} strokeWidth={sw} fill={fillColor}
        />
      );
    }
    case "polyline": {
      if (!item.pts || item.pts.length === 0) return null;
      const points = item.pts.map(p => `${p[0]},${p[1]}`).join(" ");
      return (
        <polyline
          points={points}
          stroke={strokeColor} strokeWidth={sw} fill={fillColor}
          strokeLinejoin="round"
        />
      );
    }
    case "arc": {
      if (!item.start || !item.mid || !item.end) return null;
      const d = arcPath(item.start, item.mid, item.end);
      return (
        <path d={d} stroke={strokeColor} strokeWidth={sw} fill="none" />
      );
    }
    case "circle": {
      if (!item.center) return null;
      return (
        <circle
          cx={item.center[0]} cy={item.center[1]} r={item.radius || 0}
          stroke={strokeColor} strokeWidth={sw} fill={fillColor}
        />
      );
    }
    default:
      return null;
  }
}

function PinElement({
  pin,
  isSelected,
  onClick,
}: {
  pin: SymbolPin;
  isSelected: boolean;
  onClick: () => void;
}) {
  const color = isSelected ? "#FF2D78" : "#888";
  const textColor = isSelected ? "#FF2D78" : "#ccc";
  const sw = isSelected ? 0.35 : 0.2;

  const angleRad = (pin.angle * Math.PI) / 180;
  const tipX = pin.at[0] + pin.length * Math.cos(angleRad);
  const tipY = pin.at[1] + pin.length * Math.sin(angleRad);

  // Pin name position: offset from body end (at), perpendicular
  // Pin number position: along the pin line, near the tip
  const midX = (pin.at[0] + tipX) / 2;
  const midY = (pin.at[1] + tipY) / 2;

  // Determine text anchor and offset based on pin angle
  let nameX = pin.at[0];
  let nameY = pin.at[1];
  let nameAnchor: "start" | "end" | "middle" = "start";
  let numAnchor: "start" | "end" | "middle" = "middle";

  // Pin angles: 0=left, 90=up, 180=right, 270=down
  // At angle 0, pin body connects at at.x and extends left to tip
  // Name goes inside the body (to the right of at.x)
  const nameOffset = 0.5;
  const numOffset = 0.3;

  if (pin.angle === 0) {
    nameX = pin.at[0] - nameOffset;
    nameAnchor = "end";
  } else if (pin.angle === 180) {
    nameX = pin.at[0] + nameOffset;
    nameAnchor = "start";
  } else if (pin.angle === 90) {
    nameY = pin.at[1] - nameOffset;
    nameAnchor = "middle";
  } else if (pin.angle === 270) {
    nameY = pin.at[1] + nameOffset;
    nameAnchor = "middle";
  }

  return (
    <g onClick={onClick} className="cursor-pointer">
      {/* Pin line */}
      <line
        x1={pin.at[0]} y1={pin.at[1]}
        x2={tipX} y2={tipY}
        stroke={color} strokeWidth={sw}
      />

      {/* Inverted bubble */}
      {pin.shape === "inverted" && (
        <circle
          cx={pin.at[0] + 0.4 * Math.cos(angleRad)}
          cy={pin.at[1] + 0.4 * Math.sin(angleRad)}
          r={0.35}
          stroke={color} strokeWidth={0.15} fill="none"
        />
      )}

      {/* Hit target at tip */}
      <circle
        cx={tipX} cy={tipY} r={0.6}
        fill={isSelected ? "rgba(255,45,120,0.2)" : "transparent"}
        stroke="none"
      />

      {/* Pin number (near midpoint of line) */}
      <g transform={`translate(${midX}, ${midY})`}>
        <text
          transform="scale(1, -1)"
          textAnchor={numAnchor}
          dy={pin.angle === 0 || pin.angle === 180 ? -numOffset : 0}
          dx={pin.angle === 90 || pin.angle === 270 ? numOffset : 0}
          fill={textColor}
          fontSize={0.8}
          fontFamily="JetBrains Mono, monospace"
          opacity={0.6}
        >
          {pin.number}
        </text>
      </g>

      {/* Pin name (inside body) */}
      <g transform={`translate(${nameX}, ${nameY})`}>
        <text
          transform="scale(1, -1)"
          textAnchor={nameAnchor}
          fill={textColor}
          fontSize={0.9}
          fontFamily="JetBrains Mono, monospace"
        >
          {pin.name}
        </text>
      </g>
    </g>
  );
}

export default function SymbolViewer({
  data,
  selectedPinNumber,
  onPinClick,
}: {
  data: LibraryItemPayload | null;
  selectedPinNumber: string | null;
  onPinClick: (pinNumber: string) => void;
}) {
  if (!data || !data.bounding_box) {
    return (
      <div className="border border-border bg-surface-raised flex items-center justify-center h-[400px]">
        <p className="font-mono text-xs text-text-secondary">No symbol preview</p>
      </div>
    );
  }

  const bb = data.bounding_box;
  // Flip Y for SVG: KiCad Y points up, SVG Y points down
  const viewBox = `${bb.x} ${-(bb.y + bb.h)} ${bb.w} ${bb.h}`;
  const isSynthetic = !data.found;

  return (
    <div className="border border-border bg-[#0a0a0a]">
      <div className="px-[16px] py-[8px] flex items-center gap-[8px] border-b border-border">
        <p className="font-mono text-xs text-text-secondary uppercase tracking-wider">
          Symbol
        </p>
        {isSynthetic && (
          <span className="font-mono text-[10px] text-accent/60 uppercase">
            generated
          </span>
        )}
      </div>
      <svg
        viewBox={viewBox}
        className="w-full"
        style={{ height: 400 }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Flip Y axis */}
        <g transform="scale(1, -1)">
          {data.graphics.map((g, i) => (
            <KiCadGraphic key={i} item={g} />
          ))}
          {data.pins.map((pin) => (
            <PinElement
              key={pin.number}
              pin={pin}
              isSelected={selectedPinNumber === pin.number}
              onClick={() => onPinClick(pin.number)}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
