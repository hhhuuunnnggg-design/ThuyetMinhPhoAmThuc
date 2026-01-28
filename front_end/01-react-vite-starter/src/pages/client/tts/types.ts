export interface GeoPosition {
  lat: number;
  lng: number;
}

export type ViewMode = "detail" | "map";
export type PositionSource = "gps" | "slider" | "drag";
