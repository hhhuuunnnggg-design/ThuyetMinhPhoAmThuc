import { CompassOutlined, PauseCircleOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import { getImageUrl } from "@/api/tts.api";
import type { TTSAudio } from "@/api/tts.api";
import { formatDistance } from "../utils/format";

interface TTSDetailViewProps {
  selected: TTSAudio;
  currentDistance: number | null;
  isPlaying: boolean;
  autoGuide: boolean;
  geoError: string | null;
  onPlayPause: () => void;
}

export const TTSDetailView = ({
  selected,
  currentDistance,
  isPlaying,
  autoGuide,
  geoError,
  onPlayPause,
}: TTSDetailViewProps) => {
  return (
    <>
      <div className="hero">
        <div className="hero-bg">
          {getImageUrl(selected.imageUrl) && (
            <img src={getImageUrl(selected.imageUrl)!} alt={selected.foodName || ""} />
          )}
        </div>

        <div className="hero-overlay">
          <div className="hero-top">
            <div className="distance-chip">
              <span>Cách bạn</span>
              <strong>{formatDistance(currentDistance)}</strong>
            </div>
          </div>

          <div className="hero-content">
            <div className="badges">
              <span className="badge">TRUYỀN THỐNG</span>
              <span className="badge secondary">BÁN CHẠY</span>
            </div>
            <h1>{selected.foodName || "Món chưa đặt tên"}</h1>
            <p className="sub">
              {selected.text.length > 80
                ? selected.text.substring(0, 80) + "..."
                : selected.text}
            </p>
          </div>
        </div>
      </div>

      <div className="audio-card">
        <div className="audio-header">
          <div>
            <div className="audio-label">AUDIO GUIDE</div>
            <div className="audio-title">
              {selected.description && selected.description.length > 0
                ? "Lịch sử & cách chế biến"
                : "Thuyết minh món ăn"}
            </div>
          </div>
          <div className="radius">
            <span>Bán kính kích hoạt:</span>
            <strong>{selected.accuracy ?? 30}m</strong>
          </div>
        </div>

        <div className="audio-controls">
          <Button
            type="primary"
            size="large"
            shape="circle"
            icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={onPlayPause}
          />
          <div className="audio-progress">
            <div className="bar" />
            <div className="time-row">
              <span>0:00</span>
              <span>--:--</span>
            </div>
          </div>
          <Tooltip title="GPS auto-guide sẽ tự động phát khi bạn vào vùng bán kính cho phép">
            <div className="auto-guide-pill">
              <CompassOutlined />
              <span>{autoGuide ? "Auto-guide đang bật" : "Auto-guide đang tắt"}</span>
            </div>
          </Tooltip>
        </div>

        {geoError && <div className="geo-error">{geoError}</div>}
      </div>
    </>
  );
};
