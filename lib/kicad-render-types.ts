export interface GraphicItem {
  type: string;
  layer?: string;
  start?: [number, number];
  end?: [number, number];
  mid?: [number, number];
  pts?: [number, number][];
  center?: [number, number];
  radius?: number;
  at?: [number, number];
  angle?: number;
  text?: string;
  stroke_width?: number;
  fill?: string;
}

export interface SymbolPin {
  number: string;
  name: string;
  pin_type: string;
  shape: string;
  at: [number, number];
  angle: number;
  length: number;
}

export interface FootprintPad {
  number: string;
  shape: string;
  at: [number, number];
  size: [number, number];
  angle: number;
  roundrect_rratio: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LibraryItemPayload {
  kind: string;
  found: boolean;
  bounding_box: BoundingBox | null;
  graphics: GraphicItem[];
  pins: SymbolPin[];
  pads: FootprintPad[];
}
