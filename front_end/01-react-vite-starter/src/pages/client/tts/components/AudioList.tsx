import { getImageUrl } from "@/api/tts.api";
import type { TTSAudio } from "@/api/tts.api";

interface AudioListProps {
  audios: TTSAudio[];
  selectedId: number | null;
  loading: boolean;
  onSelect: (id: number) => void;
}

export const AudioList = ({ audios, selectedId, loading, onSelect }: AudioListProps) => {
  return (
    <div className="gps-food-sidebar-list">
      {audios.map((audio) => {
        const isActive = selectedId && audio.id === selectedId;
        return (
          <div
            key={audio.id}
            className={`stall-item ${isActive ? "active" : ""}`}
            onClick={() => onSelect(audio.id)}
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
              {audio.price != null && (
                <div className="price">
                  {Number(audio.price).toLocaleString("vi-VN")} ₫
                </div>
              )}
            </div>
          </div>
        );
      })}

      {!loading && audios.length === 0 && (
        <div className="empty-state">
          Chưa có audio ẩm thực nào. Hãy tạo ở trang Admin &gt; TTS Audio.
        </div>
      )}
    </div>
  );
};
