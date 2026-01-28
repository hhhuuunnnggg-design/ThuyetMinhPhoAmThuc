import { Slider, Switch } from "antd";

interface MockGPSPanelProps {
  latRange: { min: number; max: number } | null;
  lngRange: { min: number; max: number } | null;
  mockGps: boolean;
  mockLat: number | null;
  mockLng: number | null;
  onMockGpsChange: (value: boolean) => void;
  onLatChange: (value: number) => void;
  onLngChange: (value: number) => void;
}

export const MockGPSPanel = ({
  latRange,
  lngRange,
  mockGps,
  mockLat,
  mockLng,
  onMockGpsChange,
  onLatChange,
  onLngChange,
}: MockGPSPanelProps) => {
  if (!latRange || !lngRange) return null;

  return (
    <div className="gps-mock-panel">
      <div className="mock-header">
        <div className="mock-title">Giả lập di chuyển</div>
        <Switch size="small" checked={mockGps} onChange={onMockGpsChange} />
      </div>

      <div className="mock-row">
        <div className="mock-label">
          LATITUDE{" "}
          <span className="mock-value">
            {mockLat != null ? mockLat.toFixed(6) : "--"}
          </span>
        </div>
        <Slider
          min={latRange.min}
          max={latRange.max}
          step={(latRange.max - latRange.min) / 200}
          value={mockLat ?? latRange.min}
          onChange={(value: number) => {
            onMockGpsChange(true);
            onLatChange(value);
          }}
        />
      </div>

      <div className="mock-row">
        <div className="mock-label">
          LONGITUDE{" "}
          <span className="mock-value">
            {mockLng != null ? mockLng.toFixed(6) : "--"}
          </span>
        </div>
        <Slider
          min={lngRange.min}
          max={lngRange.max}
          step={(lngRange.max - lngRange.min) / 200}
          value={mockLng ?? lngRange.min}
          onChange={(value: number) => {
            onMockGpsChange(true);
            onLngChange(value);
          }}
        />
      </div>
    </div>
  );
};
