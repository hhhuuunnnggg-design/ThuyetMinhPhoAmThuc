import { CompassOutlined } from "@ant-design/icons";
import { Button, Switch } from "antd";
import type { TTSAudio } from "@/api/tts.api";
import { ViewMode } from "../types";
import { MockGPSPanel } from "./MockGPSPanel";
import { AudioList } from "./AudioList";

interface TTSSidebarProps {
  autoGuide: boolean;
  viewMode: ViewMode;
  mockGps: boolean;
  geoEnabled: boolean;
  latRange: { min: number; max: number } | null;
  lngRange: { min: number; max: number } | null;
  mockLat: number | null;
  mockLng: number | null;
  audios: TTSAudio[];
  selectedId: number | null;
  loading: boolean;
  onAutoGuideChange: (value: boolean) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onMockGpsChange: (value: boolean) => void;
  onLatChange: (value: number) => void;
  onLngChange: (value: number) => void;
  onSelect: (id: number) => void;
}

export const TTSSidebar = ({
  autoGuide,
  viewMode,
  mockGps,
  geoEnabled,
  latRange,
  lngRange,
  mockLat,
  mockLng,
  audios,
  selectedId,
  loading,
  onAutoGuideChange,
  onViewModeChange,
  onMockGpsChange,
  onLatChange,
  onLngChange,
  onSelect,
}: TTSSidebarProps) => {
  return (
    <div className="gps-food-sidebar">
      <div className="gps-food-sidebar-header">
        <div className="app-title">
          <span className="dot" />
          <div>
            <div className="title">Phố Ẩm Thực GPS</div>
            <div className="subtitle">Hệ thống thuyết minh tự động</div>
          </div>
        </div>
        <div className="auto-guide-toggle">
          <span>TỰ ĐỘNG PHÁT</span>
          <Switch
            checked={autoGuide}
            onChange={onAutoGuideChange}
            size="small"
            style={{ marginLeft: 8 }}
          />
        </div>
      </div>

      <MockGPSPanel
        latRange={latRange}
        lngRange={lngRange}
        mockGps={mockGps}
        mockLat={mockLat}
        mockLng={mockLng}
        onMockGpsChange={onMockGpsChange}
        onLatChange={onLatChange}
        onLngChange={onLngChange}
      />

      <AudioList
        audios={audios}
        selectedId={selectedId}
        loading={loading}
        onSelect={onSelect}
      />

      <div className="gps-food-sidebar-footer">
        <div className="footer-top">
          <Button size="small">Ngôn ngữ: VI</Button>
          <Button
            size="small"
            icon={<CompassOutlined />}
            type={geoEnabled ? "primary" : "default"}
          >
            GPS: {geoEnabled ? "BẬT" : "TẮT"}
          </Button>
        </div>
        <div className="footer-tabs">
          <Button
            size="small"
            type={viewMode === "detail" ? "primary" : "default"}
            onClick={() => onViewModeChange("detail")}
          >
            Chi tiết
          </Button>
          <Button
            size="small"
            type={viewMode === "map" ? "primary" : "default"}
            onClick={() => onViewModeChange("map")}
          >
            Bản đồ
          </Button>
        </div>
      </div>
    </div>
  );
};
