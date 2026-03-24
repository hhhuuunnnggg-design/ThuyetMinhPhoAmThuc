import { getImageUrl } from "@/api/tts.api";
import type { TTSAudio } from "@/api/tts.api";
import { GeoPosition } from "../types";
import { haversineDistance } from "../utils/geo";

interface AudioListProps {
  audios: TTSAudio[];
  selectedId: number | null;
  loading: boolean;
  position: GeoPosition | null;
  onSelect: (id: number) => void;
}

const getDistance = (audio: TTSAudio, pos: GeoPosition | null): number | null => {
  if (!pos || audio.latitude == null || audio.longitude == null) return null;
  return Math.round(haversineDistance(pos, { lat: audio.latitude, lng: audio.longitude }));
};

export const AudioList = ({ audios, selectedId, loading, position, onSelect }: AudioListProps) => {
  if (loading) {
    return (
      <div className="gps-food-sidebar-list">
        <div className="list-loading">
          <div className="loading-spinner" />
          <span>Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="gps-food-sidebar-list">
      {audios.map((audio) => {
        const isActive = selectedId && audio.id === selectedId;
        const dist = getDistance(audio, position);
        return (
          <div
            key={audio.id}
            className={`stall-item ${isActive ? "active" : ""}`}
            onClick={() => onSelect(audio.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onSelect(audio.id)}
          >
            <div className="thumb">
              {getImageUrl(audio.imageUrl) ? (
                <img src={getImageUrl(audio.imageUrl)!} alt={audio.foodName || "Ảnh món"} />
              ) : (
                <div className="placeholder">IMG</div>
              )}
            </div>
            <div className="info">
              <div className="name">{audio.foodName || "Món chưa đặt tên"}</div>
              <div className="desc">
                {audio.description
                  ? audio.description.length > 40
                    ? audio.description.substring(0, 40) + "..."
                    : audio.description
                  : audio.text.length > 40
                    ? audio.text.substring(0, 40) + "..."
                    : audio.text}
              </div>
              <div className="stall-item-footer">
                {audio.price != null && (
                  <div className="price">
                    {Number(audio.price).toLocaleString("vi-VN")} ₫
                  </div>
                )}
                {dist != null && (
                  <div className={`distance ${dist < 30 ? "near" : dist < 100 ? "medium" : "far"}`}>
                    {dist < 1000 ? `${dist}m` : `${(dist / 1000).toFixed(1)}km`}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {!loading && audios.length === 0 && (
        <div className="empty-state">
          Chưa có audio ẩm thực nào.<br />Hãy tạo ở trang <strong>Admin &gt; TTS Audio</strong>.
        </div>
      )}
    </div>
  );
};
