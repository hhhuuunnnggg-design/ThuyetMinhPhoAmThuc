import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchAdminPOIsAPI, parseAdminPOIListResponse, type AdminPOI } from "@/api/adminPoi.api";
import { getAdminActiveNarrationsAPI, getOnlineStatsAPI, type ActiveNarration, type OnlineStats } from "@/api/app.api";
import { logger } from "@/utils/logger";
import { Badge, Card, Col, Progress, Row, Statistic, Table, Tag, Tooltip } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { HeatmapLayer } from "./components/HeatmapLayer";
import { UserMarkerLayer } from "./components/UserMarkerLayer";
import L from "leaflet";

// POI circle marker icon showing active listener count
function poiIcon(count: number) {
  return L.divIcon({
    html: `<div style="
      background:${count > 0 ? "#22c55e" : "#9ca3af"};
      color:#fff;border-radius:50%;width:36px;height:36px;
      display:flex;align-items:center;justify-content:center;
      font-weight:700;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,0.3);
      border:2px solid #fff;
    ">${count > 0 ? count : "·"}</div>`,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

const LANGUAGE_COLORS: Record<string, string> = {
  vi: "#ff6b35",
  en: "#3b82f6",
  zh: "#ef4444",
  ja: "#ec4899",
  ko: "#8b5cf6",
  fr: "#10b981",
};

// Default map center: HCM City
const DEFAULT_CENTER: [number, number] = [10.7769, 106.7009];

const POI_RADIUS_DEFAULT = 50; // metres

// Map inner component — auto-fits bounds to POI markers ONCE
const MapFitter = ({ pois }: { pois: POIMarkerData[] }) => {
  const map = useMap();
  const hasFitRef = useRef(false);

  useEffect(() => {
    if (pois.length === 0 || hasFitRef.current) return;
    const bounds = L.latLngBounds(pois.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    hasFitRef.current = true;
  }, [map, pois]);
  return null;
};

interface POIMarkerData {
  poiId: number;
  poiName: string;
  address?: string | null;
  category?: string | null;
  isActive?: boolean | null;
  lat: number;
  lng: number;
  count: number;
  radius: number;
}

const AdminDashboardPage = () => {
  const [activeNarrations, setActiveNarrations] = useState<ActiveNarration[]>([]);
  const [allPOIs, setAllPOIs] = useState<AdminPOI[]>([]);
  const [onlineStats, setOnlineStats] = useState<OnlineStats>({ onlineNow: 0, usersToday: 0, playingNow: 0, onlineDevices: [] });
  const [loading, setLoading] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onlinePollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchActive = useCallback(async () => {
    try {
      const res: any = await getAdminActiveNarrationsAPI();
      if (res?.data) {
        const data = Array.isArray(res.data) ? res.data : res.data.result || [];
        setActiveNarrations(data);
      }
    } catch (err) {
      logger.error("Fetch active narrations error:", err);
    }
  }, []);

  useEffect(() => {
    void fetchActive();
    pollingRef.current = setInterval(() => void fetchActive(), 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchActive]);

  // Poll online stats mỗi 5s
  const fetchOnlineStats = useCallback(async () => {
    try {
      const res: any = await getOnlineStatsAPI();
      if (res?.data) {
        const d = res.data.data ?? res.data;
        if (d && typeof d.onlineNow === "number") setOnlineStats(d);
      }
    } catch (err) {
      logger.error("Fetch online stats error:", err);
    }
  }, []);

  useEffect(() => {
    void fetchOnlineStats();
    onlinePollingRef.current = setInterval(() => void fetchOnlineStats(), 5000);
    return () => {
      if (onlinePollingRef.current) clearInterval(onlinePollingRef.current);
    };
  }, [fetchOnlineStats]);

  // Load all POIs once for the map
  useEffect(() => {
    fetchAdminPOIsAPI(1, 1000)
      .then((res: any) => {
        const parsed = parseAdminPOIListResponse(res.data);
        setAllPOIs(parsed.data);
      })
      .catch((err) => logger.error("Fetch all POIs error:", err));
  }, []);

  // Group playing narrations by POI (by poiId)
  const byPOI = useMemo(() => {
    const map = new Map<number, ActiveNarration[]>();
    activeNarrations
      .filter((n) => n.status === "PLAYING")
      .forEach((n) => {
        const list = map.get(n.poiId) ?? [];
        list.push(n);
        map.set(n.poiId, list);
      });
    return map;
  }, [activeNarrations]);

  // POI markers with count
  const poiMarkers = useMemo(() => {
    return allPOIs
      .filter((poi) => poi.latitude != null && poi.longitude != null && typeof poi.id === "number")
      .map((poi) => {
        const activeList = byPOI.get(poi.id!) || [];
        return {
          poiId: poi.id!,
          poiName: poi.foodName || `POI #${poi.id}`,
          address: poi.address,
          category: poi.category,
          isActive: poi.isActive,
          lat: poi.latitude!,
          lng: poi.longitude!,
          count: activeList.length,
          radius: 30, // Geofence trigger radius (thực tế backend dùng radiusKm, đây là demo UI vòng tròn)
        };
      });
  }, [allPOIs, byPOI]);

  // Heatmap points: all online devices (playing or not) have intensity = 1
  const heatPoints = useMemo<[number, number, number][]>(() => {
    const points: [number, number, number][] = [];
    (onlineStats?.onlineDevices || []).forEach((d) => {
      if (d.lat != null && d.lng != null) {
        points.push([d.lat, d.lng, 1]);
      }
    });
    return points;
  }, [onlineStats]);

  // Map center: first POI with coords, or default
  const mapCenter = useMemo<[number, number]>(() => {
    if (poiMarkers.length > 0) return [poiMarkers[0].lat, poiMarkers[0].lng];
    return DEFAULT_CENTER;
  }, [poiMarkers]);

  const columns = [
    {
      title: "POI",
      dataIndex: "poiName",
      key: "poiName",
      render: (name: string) => <span style={{ fontWeight: 600 }}>{name}</span>,
    },
    {
      title: "Device",
      dataIndex: "deviceId",
      key: "deviceId",
      render: (id: string) => (
        <span style={{ fontFamily: "monospace", fontSize: 11 }}>{id}</span>
      ),
    },
    {
      title: "Ngôn ngữ",
      dataIndex: "languageCode",
      key: "languageCode",
      render: (lang: string) => (
        <Tag color={LANGUAGE_COLORS[lang] || "default"} style={{ fontWeight: 600 }}>
          {(lang || "").toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Bắt đầu",
      dataIndex: "startedAt",
      key: "startedAt",
      render: (v: string) => new Date(v).toLocaleTimeString("vi-VN"),
    },
    {
      title: "Kết thúc ước tính",
      dataIndex: "estimatedEndAt",
      key: "estimatedEndAt",
      render: (v: string) => new Date(v).toLocaleTimeString("vi-VN"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (s: string) => {
        const color = s === "PLAYING" ? "processing" : s === "COMPLETED" ? "success" : "warning";
        return <Tag color={color}>{s}</Tag>;
      },
    },
    {
      title: "Vị trí",
      dataIndex: "latitude",
      key: "location",
      render: (_: any, r: ActiveNarration) =>
        r.latitude != null && r.longitude != null ? (
          <span style={{ fontSize: 11, color: "#888" }}>
            {r.latitude.toFixed(5)}, {r.longitude.toFixed(5)}
          </span>
        ) : (
          "—"
        ),
    },
  ];

  const playingCount = activeNarrations.filter((n) => n.status === "PLAYING").length;
  const activePOICount = byPOI.size;
  const playingLanguages = [...new Set(activeNarrations.map((n) => n.languageCode))].length;

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h2 style={{ margin: 0 }}>Dashboard Real-time</h2>
        <Tooltip title="Làm mới">
          <ReloadOutlined
            onClick={() => {
              setLoading(true);
              void fetchActive().finally(() => setLoading(false));
            }}
            style={{ fontSize: 18, cursor: "pointer" }}
            spin={loading}
          />
        </Tooltip>
      </div>

      {/* ---- Realtime Map ---- */}
      <Card
        title={
          <span style={{ fontWeight: 600 }}>
            🗺️ Bản đồ người dùng realtime
          </span>
        }
        extra={
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            {/* Heatmap density legend */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
              <span style={{ fontSize: 11, color: "#888" }}>Mật độ:</span>
              {["#22c55e", "#facc15", "#f97316", "#ef4444"].map((c) => (
                <div key={c} style={{ width: 12, height: 12, background: c, borderRadius: 2 }} />
              ))}
            </div>
            <span style={{ fontSize: 12, color: "#52c41a", fontWeight: 700 }}>
              🟢 {playingCount} đang nghe
            </span>
          </div>
        }
        style={{ marginBottom: 24 }}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ height: 480, position: "relative" }}>
          <MapContainer
            center={mapCenter}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
            zoomControl={true}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Auto-fit bounds to POIs when available */}
            {poiMarkers.length > 0 && <MapFitter pois={poiMarkers} />}

            {/* POI trigger-radius circles */}
            {poiMarkers.map((poi) => (
              <Circle
                key={poi.poiId}
                center={[poi.lat, poi.lng]}
                radius={poi.radius}
                pathOptions={{
                  color: poi.count > 0 ? "#22c55e" : "#9ca3af",
                  fillColor: poi.count > 0 ? "#22c55e" : "#9ca3af",
                  fillOpacity: 0.08,
                  weight: 1.5,
                  dashArray: "5, 5",
                }}
              />
            ))}

            {/* POI number markers */}
            {poiMarkers.map((poi) => (
              <Marker
                key={`marker-${poi.poiId}`}
                position={[poi.lat, poi.lng]}
                icon={poiIcon(poi.count)}
              >
                <Popup closeButton={false}>
                  <div style={{ minWidth: 200, fontFamily: "Inter, sans-serif" }}>
                    <h4 style={{ margin: 0, paddingBottom: 8, borderBottom: "1px solid #eee", color: "#22c55e", fontSize: 15 }}>
                      {poi.poiName}
                    </h4>
                    <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6, color: "#333" }}>
                      <div style={{ marginBottom: 4 }}><b>📍 Đ/c:</b> {poi.address || "—"}</div>
                      <div style={{ marginBottom: 4 }}><b>🏷️ Loại:</b> {poi.category || "—"}</div>
                      <div style={{ marginBottom: 4 }}><b>📶 STT:</b> {poi.isActive ? "✅ Hoạt động" : "❌ Tạm dừng"}</div>
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: "#888" }}>Đang nghe lúc này:</span>
                        <span style={{ fontWeight: "900", fontSize: 16, color: poi.count > 0 ? "#22c55e" : "#888" }}>
                          {poi.count}
                        </span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Individual mobile user markers removed to prevent overlapping POI count marker */}
            <UserMarkerLayer onlineDevices={onlineStats?.onlineDevices || []} />

            {/* Heatmap density overlay */}
            <HeatmapLayer points={heatPoints} />
          </MapContainer>

          {/* Overlay khi rỗng */}
          {playingCount === 0 && (
            <div
              style={{
                position: "absolute",
                bottom: 16,
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(0,0,0,0.55)",
                color: "#fff",
                padding: "6px 16px",
                borderRadius: 20,
                fontSize: 13,
                pointerEvents: "none",
                zIndex: 1000,
              }}
            >
              Chưa có ai đang nghe — bản đồ mặc định TP.HCM
            </div>
          )}
        </div>
      </Card>

      {/* ---- Stats ---- */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card styles={{ body: { padding: "16px 20px" } }}>
            <Statistic
              title={
                <span style={{ fontSize: 12 }}>
                  🟢 Đang online ngay lúc này
                </span>
              }
              value={onlineStats.onlineNow}
              suffix="thiết bị"
              valueStyle={{ color: "#22c55e", fontSize: 22 }}
            />
            <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
              heartbeat ≤ 2 phút
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card styles={{ body: { padding: "16px 20px" } }}>
            <Statistic
              title={
                <span style={{ fontSize: 12 }}>👥 Người dùng hôm nay</span>
              }
              value={onlineStats.usersToday}
              suffix="người"
              valueStyle={{ color: "#6366f1", fontSize: 22 }}
            />
            <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
              unique device ID
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card styles={{ body: { padding: "16px 20px" } }}>
            <Statistic
              title={<span style={{ fontSize: 12 }}>▶️ Đang phát ngay lúc này</span>}
              value={playingCount}
              valueStyle={{ color: "#1890ff", fontSize: 22 }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card styles={{ body: { padding: "16px 20px" } }}>
            <Statistic
              title={<span style={{ fontSize: 12 }}>📍 POI đang active</span>}
              value={activePOICount}
              valueStyle={{ color: "#52c41a", fontSize: 22 }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card styles={{ body: { padding: "16px 20px" } }}>
            <Statistic
              title={<span style={{ fontSize: 12 }}>🎧 Người đang nghe</span>}
              value={playingCount}
              suffix="người"
              valueStyle={{ color: "#fa8c16", fontSize: 22 }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card styles={{ body: { padding: "16px 20px" } }}>
            <Statistic
              title={<span style={{ fontSize: 12 }}>🌐 Ngôn ngữ đang phát</span>}
              value={playingLanguages}
              suffix="ngôn ngữ"
              valueStyle={{ fontSize: 22 }}
            />
          </Card>
        </Col>
      </Row>

      {/* ---- POI Cards ---- */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {Array.from(byPOI.entries()).map(([poiId, narrations]) => {
          const first = narrations[0];
          const poiName = first.poiName || `POI #${poiId}`;
          return (
            <Col span={6} key={poiId}>
              <Card
                size="small"
                title={<span style={{ fontWeight: 600 }}>{poiName}</span>}
                extra={
                  <Badge
                    status={narrations.length > 0 ? "processing" : "default"}
                    text={
                      <span style={{ fontSize: 12 }}>
                        {narrations.length} đang nghe
                      </span>
                    }
                  />
                }
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {Object.entries(
                    narrations.reduce<Record<string, number>>((acc, n) => {
                      acc[n.languageCode] = (acc[n.languageCode] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([lang, count]) => (
                    <div
                      key={lang}
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <Tag color={LANGUAGE_COLORS[lang] || "default"}>
                        {lang.toUpperCase()}
                      </Tag>
                      <Progress
                        percent={Math.round((count / narrations.length) * 100)}
                        size="small"
                        format={(p) => `${p}%`}
                        strokeColor={LANGUAGE_COLORS[lang] || "#1890ff"}
                      />
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* ---- Table ---- */}
      <Card title="Danh sách người đang nghe (auto-refresh 5s)">
        <Table
          dataSource={activeNarrations.filter((n) => n.status === "PLAYING")}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
          locale={{ emptyText: "Không có ai đang nghe" }}
        />
      </Card>
    </div>
  );
};

export default AdminDashboardPage;
