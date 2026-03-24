import type { TTSAudio, AudioData } from "@/api/tts.api";
import {
  generateMultilingualForGroupAPI,
  getAudioGroupByIdAPI,
  getImageUrl,
} from "@/api/tts.api";
import {
  CompassOutlined,
  GlobalOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { Button, message, Select, Spin, Tooltip } from "antd";
import { useEffect, useRef, useState } from "react";
import { formatDistance } from "../utils/format";

const LANGUAGE_OPTIONS = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "Tiếng Anh" },
  { value: "zh", label: "Tiếng Trung" },
  { value: "ja", label: "Tiếng Nhật" },
  { value: "ko", label: "Tiếng Hàn" },
  { value: "fr", label: "Tiếng Pháp" },
];

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

interface TTSDetailViewProps {
  selected: TTSAudio;
  currentDistance: number | null;
  isPlaying: boolean;
  autoGuide: boolean;
  geoError: string | null;
  audioDuration: number;
  onPlayPause: (url?: string) => void;
}

interface AudioEntry {
  languageCode: string;
  s3Url: string | null;
  fileSize: number;
}

export const TTSDetailView = ({
  selected,
  currentDistance,
  isPlaying,
  autoGuide,
  geoError,
  audioDuration,
  onPlayPause,
}: TTSDetailViewProps) => {
  const [selectedLang, setSelectedLang] = useState<string>("vi");
  const [multilingualMap, setMultilingualMap] = useState<Record<string, AudioData>>({});
  const [loadingMultilingual, setLoadingMultilingual] = useState(false);
  const [generatingMultilingual, setGeneratingMultilingual] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioTimeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch multilingual audio group when selected changes
  useEffect(() => {
    if (!selected.groupKey) return;
    setLoadingMultilingual(true);
    setMultilingualMap({});
    setSelectedLang("vi");
    setCurrentTime(0);

    getAudioGroupByIdAPI(selected.id)
      .then((res: any) => {
        const group = res?.data?.data ?? res?.data ?? res;
        if (group?.audioMap) {
          setMultilingualMap(group.audioMap);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingMultilingual(false));
  }, [selected.id, selected.groupKey]);

  // Track playback progress
  useEffect(() => {
    if (isPlaying && audioDuration > 0) {
      setCurrentTime(0);
      audioTimeRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= audioDuration) {
            audioTimeRef.current && clearInterval(audioTimeRef.current);
            return audioDuration;
          }
          return prev + 0.25;
        });
      }, 250);
    } else {
      if (audioTimeRef.current) {
        clearInterval(audioTimeRef.current);
        audioTimeRef.current = null;
      }
    }
    return () => {
      if (audioTimeRef.current) {
        clearInterval(audioTimeRef.current);
      }
    };
  }, [isPlaying, audioDuration]);

  const handleGenerateMultilingual = async () => {
    if (!selected.groupId) return;
    setGeneratingMultilingual(true);
    try {
      const res = await generateMultilingualForGroupAPI(selected.groupId);
      const data = res?.data?.data ?? res?.data ?? res;
      if (data) {
        setMultilingualMap(data);
        message.success("Đã tạo audio đa ngôn ngữ!");
      }
    } catch {
      message.error("Không thể tạo audio đa ngôn ngữ");
    } finally {
      setGeneratingMultilingual(false);
    }
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLang(lang);
    if (lang === "vi") {
      onPlayPause();
    } else {
      const entry = multilingualMap[lang];
      if (entry?.s3Url) {
        onPlayPause(entry.s3Url);
      }
    }
  };

  const hasMultilingual = Object.keys(multilingualMap).length > 0;
  const progressPercent =
    audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;
  const triggerRadius = selected.triggerRadiusMeters ?? selected.accuracy ?? 30;
  const audioTitle =
    selected.description && selected.description.length > 0
      ? "Lịch sử & cách chế biến"
      : "Thuyết minh món ăn";

  const availableLangs = Object.entries(multilingualMap).map(([code, data]) => ({
    languageCode: code,
    s3Url: data.s3Url,
    fileSize: data.fileSize,
  })) as AudioEntry[];

  return (
    <>
      <div className="hero">
        <div className="hero-bg">
          {getImageUrl(selected.imageUrl) && (
            <img
              src={getImageUrl(selected.imageUrl)!}
              alt={selected.foodName || ""}
            />
          )}
        </div>

        <div className="hero-overlay">
          <div className="hero-top">
            {currentDistance != null && (
              <div className="distance-chip">
                <span>Cách bạn</span>
                <strong>{formatDistance(currentDistance)}</strong>
              </div>
            )}
          </div>

          <div className="hero-content">
            <div className="badges">
              {hasMultilingual && (
                <span className="badge secondary">
                  <GlobalOutlined /> {Object.keys(multilingualMap).length} ngôn ngữ
                </span>
              )}
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
            <div className="audio-title">{audioTitle}</div>
          </div>
          <div className="radius">
            <span>Bán kính kích hoạt:</span>
            <strong>{triggerRadius}m</strong>
          </div>
        </div>

        <div className="audio-controls">
          <Button
            type="primary"
            size="large"
            shape="circle"
            icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={() => onPlayPause()}
          />
          <div className="audio-progress">
            <div className="bar-wrap">
              <div
                className="bar-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="time-row">
              <span>{formatTime(currentTime)}</span>
              <span>
                {audioDuration > 0 ? formatTime(audioDuration) : "--:--"}
              </span>
            </div>
          </div>
          <Tooltip title="GPS auto-guide sẽ tự động phát khi bạn vào vùng bán kính cho phép">
            <div className={`auto-guide-pill ${autoGuide ? "on" : "off"}`}>
              <CompassOutlined />
              <span>{autoGuide ? "Auto-guide BẬT" : "Auto-guide TẮT"}</span>
            </div>
          </Tooltip>
        </div>

        <div className="language-selector">
          <div className="lang-label">Ngôn ngữ thuyết minh:</div>
          <Select
            value={selectedLang}
            onChange={handleLanguageChange}
            style={{ width: 180 }}
            options={LANGUAGE_OPTIONS}
            suffixIcon={loadingMultilingual ? <Spin size="small" /> : undefined}
          />
          {hasMultilingual ? (
            <div className="lang-avail">
              {availableLangs.map((a) => (
                <span
                  key={a.languageCode}
                  className={`lang-chip ${selectedLang === a.languageCode ? "active" : ""}`}
                >
                  {a.languageCode.toUpperCase()}
                </span>
              ))}
            </div>
          ) : !loadingMultilingual ? (
            <Tooltip title="Tạo audio đa ngôn ngữ cho món này">
              <Button
                icon={<GlobalOutlined />}
                size="small"
                loading={generatingMultilingual}
                onClick={handleGenerateMultilingual}
              >
                Tạo đa ngôn ngữ
              </Button>
            </Tooltip>
          ) : null}
        </div>

        {geoError && <div className="geo-error">{geoError}</div>}
      </div>
    </>
  );
};
