"use client";

import type { FootprintPad, GraphicItem, LibraryItemPayload } from "@/lib/kicad-render-types";

const LAYER_COLORS: Record<string, string> = {
  "F.SilkS": "#CCCC00",
  "F.CrtYd": "#CC00CC",
  "F.Fab": "#6666FF",
  "B.SilkS": "#666600",
  "B.CrtYd": "#660066",
  "B.Fab": "#333399",
};

function arcPath(
  start: [number, number],
  mid: [number, number],
  end: [number, number],
): string {
  const [x1, y1] = start;
  const [xm, ym] = mid;
  const [x2, y2] = end;

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
  const cross = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const sweepFlag = cross > 0 ? 1 : 0;

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

  const largeArc = Math.abs(startToEnd) > Math.PI ? 1 : 0;

  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} ${sweepFlag} ${x2} ${y2}`;
}

function FpGraphic({ item }: { item: GraphicItem }) {
  const color = LAYER_COLORS[item.layer || ""] || "#555";
  const sw = item.stroke_width || 0.12;

  switch (item.type) {
    case "line": {
      if (!item.start || !item.end) return null;
      return (
        <line
          x1={item.start[0]} y1={item.start[1]}
          x2={item.end[0]} y2={item.end[1]}
          stroke={color} strokeWidth={sw}
        />
      );
    }
    case "arc": {
      if (!item.start || !item.mid || !item.end) return null;
      const d = arcPath(item.start, item.mid, item.end);
      return <path d={d} stroke={color} strokeWidth={sw} fill="none" />;
    }
    case "circle": {
      if (!item.center) return null;
      return (
        <circle
          cx={item.center[0]} cy={item.center[1]} r={item.radius || 0}
          stroke={color} strokeWidth={sw} fill="none"
        />
      );
    }
    case "poly": {
      if (!item.pts || item.pts.length === 0) return null;
      const points = item.pts.map(p => `${p[0]},${p[1]}`).join(" ");
      const fillVal = item.fill === "solid" || item.fill === "outline" ? color : "none";
      return (
        <polygon
          points={points}
          stroke={color} strokeWidth={sw}
          fill={fillVal} fillOpacity={0.3}
        />
      );
    }
    case "text": {
      if (!item.at) return null;
      return (
        <text
          x={item.at[0]} y={item.at[1]}
          fill={color} fontSize={0.6}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
        >
          {item.text}
        </text>
      );
    }
    default:
      return null;
  }
}

function PadElement({
  pad,
  isSelected,
  onClick,
}: {
  pad: FootprintPad;
  isSelected: boolean;
  onClick: () => void;
}) {
  const fill = isSelected ? "#FF2D78" : "rgba(200, 50, 50, 0.4)";
  const stroke = isSelected ? "#FF2D78" : "rgba(255, 80, 80, 0.6)";
  const sw = 0.05;

  const [cx, cy] = pad.at;
  const [w, h] = pad.size;
  const x = cx - w / 2;
  const y = cy - h / 2;

  const transform = pad.angle ? `rotate(${pad.angle} ${cx} ${cy})` : undefined;

  let shape: React.ReactNode;

  switch (pad.shape) {
    case "circle":
      shape = (
        <circle cx={cx} cy={cy} r={w / 2} fill={fill} stroke={stroke} strokeWidth={sw} />
      );
      break;
    case "oval":
      shape = (
        <rect
          x={x} y={y} width={w} height={h}
          rx={Math.min(w, h) / 2} ry={Math.min(w, h) / 2}
          fill={fill} stroke={stroke} strokeWidth={sw}
        />
      );
      break;
    case "roundrect": {
      const rr = pad.roundrect_rratio || 0.25;
      const rx = rr * Math.min(w, h);
      shape = (
        <rect
          x={x} y={y} width={w} height={h}
          rx={rx} ry={rx}
          fill={fill} stroke={stroke} strokeWidth={sw}
        />
      );
      break;
    }
    default: // rect, custom
      shape = (
        <rect
          x={x} y={y} width={w} height={h}
          fill={fill} stroke={stroke} strokeWidth={sw}
        />
      );
  }

  return (
    <g onClick={onClick} className="cursor-pointer" transform={transform}>
      {shape}
      {/* Pad number label */}
      {pad.number && (
        <text
          x={cx} y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fill={isSelected ? "#fff" : "#ddd"}
          fontSize={Math.min(w, h) * 0.5}
          fontFamily="JetBrains Mono, monospace"
        >
          {pad.number}
        </text>
      )}
    </g>
  );
}

export default function FootprintViewer({
  data,
  highlightedPads,
  onPadClick,
}: {
  data: LibraryItemPayload | null;
  highlightedPads: Set<string>;
  onPadClick: (padNumber: string) => void;
}) {
  if (!data || !data.bounding_box) {
    return (
      <div className="border border-border bg-surface-raised flex items-center justify-center h-[400px]">
        <p className="font-mono text-xs text-text-secondary">No footprint preview</p>
      </div>
    );
  }

  const bb = data.bounding_box;
  const viewBox = `${bb.x} ${bb.y} ${bb.w} ${bb.h}`;

  return (
    <div className="border border-border bg-[#0a0a0a]">
      <p className="px-[16px] py-[8px] font-mono text-xs text-text-secondary uppercase tracking-wider border-b border-border">
        Footprint
      </p>
      <svg
        viewBox={viewBox}
        className="w-full"
        style={{ height: 400 }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Graphics (silkscreen, courtyard, fab) */}
        {data.graphics.map((g, i) => (
          <FpGraphic key={i} item={g} />
        ))}
        {/* Pads */}
        {data.pads.map((pad, i) => (
          <PadElement
            key={`${pad.number}-${i}`}
            pad={pad}
            isSelected={highlightedPads.has(pad.number)}
            onClick={() => pad.number && onPadClick(pad.number)}
          />
        ))}
      </svg>
    </div>
  );
}
