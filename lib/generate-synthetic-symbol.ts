import type { LibraryItemPayload, SymbolPin, GraphicItem } from "./kicad-render-types";

interface PinInfo {
  number: string;
  name: string;
  pin_type: string;
  description: string;
  alt_numbers: string[];
}

type Side = "left" | "right" | "top" | "bottom";

const PIN_SPACING = 2.54; // KiCad standard 100mil grid
const PIN_LENGTH = 2.54;

function assignSide(pinType: string): Side {
  switch (pinType) {
    case "power_in":
      return "top";
    case "power_out":
      return "bottom";
    case "input":
      return "left";
    case "output":
    case "open_collector":
    case "open_emitter":
      return "right";
    case "no_connect":
      return "bottom";
    case "passive":
    case "bidirectional":
    case "tri_state":
    case "free":
    case "unspecified":
    default:
      return "left"; // default, will be balanced later
  }
}

/**
 * Consolidate pins with the same name into a single pin.
 * Extra pin numbers become alt_numbers so the symbol shows one pin
 * but the footprint highlights all associated pads.
 */
function consolidatePins(pins: PinInfo[]): PinInfo[] {
  const byName = new Map<string, PinInfo[]>();
  const result: PinInfo[] = [];

  for (const pin of pins) {
    const key = pin.name.toUpperCase();
    const group = byName.get(key);
    if (group) {
      group.push(pin);
    } else {
      byName.set(key, [pin]);
    }
  }

  for (const group of byName.values()) {
    const primary = { ...group[0], alt_numbers: [...group[0].alt_numbers] };
    for (let i = 1; i < group.length; i++) {
      primary.alt_numbers.push(group[i].number);
      primary.alt_numbers.push(...group[i].alt_numbers);
    }
    result.push(primary);
  }

  return result;
}

/**
 * Generates a synthetic KiCad-style symbol layout from extracted pin data.
 * Used when no existing KiCad library match is found.
 */
export function generateSyntheticSymbol(pins: PinInfo[]): LibraryItemPayload {
  if (pins.length === 0) {
    return { kind: "symbol", found: false, bounding_box: null, graphics: [], pins: [], pads: [] };
  }

  // Consolidate same-name pins into single pins with alt_numbers
  const consolidated = consolidatePins(pins);

  // Group pins by side
  const sides: Record<Side, PinInfo[]> = { left: [], right: [], top: [], bottom: [] };

  for (const pin of consolidated) {
    const side = assignSide(pin.pin_type);
    sides[side].push(pin);
  }

  // Balance left/right if heavily skewed
  const verticalPins = [...sides.left, ...sides.right];
  if (sides.left.length > 0 && sides.right.length === 0) {
    // Split left pins in half, move second half to right
    const mid = Math.ceil(sides.left.length / 2);
    sides.right = sides.left.splice(mid);
  } else if (sides.right.length > 0 && sides.left.length === 0) {
    const mid = Math.ceil(sides.right.length / 2);
    sides.left = sides.right.splice(mid);
  }

  // If all pins ended up on one side only (e.g. all passive), split
  const totalLR = sides.left.length + sides.right.length;
  if (totalLR === 0 && (sides.top.length + sides.bottom.length) > 0) {
    // All pins are top/bottom - move some to left/right for readability
    const allPins = [...sides.top, ...sides.bottom];
    sides.top = [];
    sides.bottom = [];
    const mid = Math.ceil(allPins.length / 2);
    sides.left = allPins.slice(0, mid);
    sides.right = allPins.slice(mid);
  }

  // Calculate body dimensions
  const maxVertical = Math.max(sides.left.length, sides.right.length, 1);
  const maxHorizontal = Math.max(sides.top.length, sides.bottom.length, 1);

  const bodyH = maxVertical * PIN_SPACING;
  const bodyW = Math.max(maxHorizontal * PIN_SPACING, 10.16); // min width 4 grid units

  const halfW = bodyW / 2;
  const halfH = bodyH / 2;

  // Generate body rectangle graphic
  const graphics: GraphicItem[] = [
    {
      type: "rectangle",
      start: [-halfW, halfH],
      end: [halfW, -halfH],
      fill: "background",
      stroke_width: 0.254,
    },
  ];

  // Generate pin positions
  const symbolPins: SymbolPin[] = [];

  // Left side pins: angle 0 means pin extends to the left, body connection on right
  // In KiCad: at = body connection point, pin extends in direction of angle
  // angle 0 = extends right (tip to the right of at)
  // For left-side pins: pin tip is to the left, so angle = 180
  // Actually in KiCad symbol coords:
  // angle 0: pin line goes right from at (tip = at + length in +x)
  // angle 180: pin line goes left from at (tip = at + length in -x)
  // Left-side pins should have body end at -halfW, extending left: angle = 180
  for (let i = 0; i < sides.left.length; i++) {
    const pin = sides.left[i];
    const y = halfH - (i + 0.5) * (bodyH / sides.left.length);
    symbolPins.push({
      number: pin.number,
      name: pin.name,
      pin_type: pin.pin_type,
      shape: "line",
      at: [-halfW, y],
      angle: 180,
      length: PIN_LENGTH,
    });
  }

  // Right side: body end at +halfW, extending right: angle = 0
  for (let i = 0; i < sides.right.length; i++) {
    const pin = sides.right[i];
    const y = halfH - (i + 0.5) * (bodyH / sides.right.length);
    symbolPins.push({
      number: pin.number,
      name: pin.name,
      pin_type: pin.pin_type,
      shape: "line",
      at: [halfW, y],
      angle: 0,
      length: PIN_LENGTH,
    });
  }

  // Top side: body end at +halfH, extending up: angle = 90
  for (let i = 0; i < sides.top.length; i++) {
    const pin = sides.top[i];
    const x = -halfW + (i + 0.5) * (bodyW / sides.top.length);
    symbolPins.push({
      number: pin.number,
      name: pin.name,
      pin_type: pin.pin_type,
      shape: "line",
      at: [x, halfH],
      angle: 90,
      length: PIN_LENGTH,
    });
  }

  // Bottom side: body end at -halfH, extending down: angle = 270
  for (let i = 0; i < sides.bottom.length; i++) {
    const pin = sides.bottom[i];
    const x = -halfW + (i + 0.5) * (bodyW / sides.bottom.length);
    symbolPins.push({
      number: pin.number,
      name: pin.name,
      pin_type: pin.pin_type,
      shape: "line",
      at: [x, -halfH],
      angle: 270,
      length: PIN_LENGTH,
    });
  }

  // Compute bounding box with padding for pin lengths and labels
  const pad = PIN_LENGTH + 5; // extra space for pin labels
  const bbX = -halfW - pad;
  const bbY = -halfH - pad;
  const bbW = bodyW + 2 * pad;
  const bbH = bodyH + 2 * pad;

  return {
    kind: "symbol",
    found: false,
    bounding_box: { x: bbX, y: bbY, w: bbW, h: bbH },
    graphics,
    pins: symbolPins,
    pads: [],
  };
}
