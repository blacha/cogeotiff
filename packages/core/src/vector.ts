export interface Size {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox extends Point, Size {}
export interface Vector extends Point {
  z: number;
}
