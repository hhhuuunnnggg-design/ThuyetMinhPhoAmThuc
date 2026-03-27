import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAdminActiveNarrationsAPI, type ActiveNarration } from "@/api/app.api";
import { logger } from "@/utils/logger";
import { Badge, Card, Col, Progress, Row, Statistic, Table, Tag, Tooltip } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { MapContainer, TileLayer, Circle, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { HeatmapLayer } from "./components/HeatmapLayer";
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

// Map inner component — auto-fits bounds to POI markers
const MapFitter = ({ pois }: { pois: POIMarkerData[] }) => {
  const map = useMap();
  useEffect(() => {
    if (pois.length === 0) return;
    const bounds = L.latLngBounds(pois.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [map, pois]);
  return null;
};

interface POIMarkerData {
  poiId: number;
  poiName: string;
  lat: number;
  lng: number;
  count: number;
  radius: number;
}

const AdminDashboardPage = () => {
  const [activeNarrations, setActiveNarrations] = useState<ActiveNarration[]>([]);
  const [loading, setLoading] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
  const poiMarkers = useMemo<POIMarkerData[]>(() => {
    return Array.from(byPOI.entries()).map(([poiId, narrations]) => {
      const first = narrations[0];
      return {
        poiId,
        poiName: first.poiName || `POI #${poiId}`,
        lat: first.latitude ?? 10.7769,
        lng: first.longitude ?? 106.7009,
        count: narrations.length,
        radius: POI_RADIUS_DEFAULT,
      };
    });
  }, [byPOI]);

  // Heatmap points: each user is a point; intensity = 1 (leaflet.heat normalises)
  const heatPoints = useMemo<[number, number, number][]>(() => {
    return activeNarrations
      .filter((n) => n.status === "PLAYING" && n.latitude != null && n.longitude != null)
      .map((n) => [n.latitude!, n.longitude!, 1] as [number, number, number]);
  }, [activeNarrations]);

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

      {/* ---- Heatmap ---- */}
      <Card
        title={
          <span style={{ fontWeight: 600 }}>
            Bản đồ mật độ người nghe
          </span>
        }
        extra={
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Legend */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
              <span style={{ fontSize: 11, color: "#888" }}>Mật độ:</span>
              <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <div style={{ width: 14, height: 14, background: "#22c55e", borderRadius: 2 }} />
                <span style={{ color: "#888" }}>Ít</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <div style={{ width: 14, height: 14, background: "#facc15", borderRadius: 2 }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <div style={{ width: 14, height: 14, background: "#f97316", borderRadius: 2 }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <div style={{ width: 14, height: 14, background: "#ef4444", borderRadius: 2 }} />
                <span style={{ color: "#888" }}>Đông</span>
              </div>
            </div>
            <span style={{ fontSize: 12, color: "#52c41a", fontWeight: 600 }}>
              {playingCount} người đang nghe
            </span>
          </div>
        }
        style={{ marginBottom: 24 }}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ height: 360, position: "relative" }}>
          {poiMarkers.length === 0 && heatPoints.length === 0 ? (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#999",
                fontSize: 14,
              }}
            >
              Không có dữ liệu vị trí — chưa có ai đang nghe
            </div>
          ) : (
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

              {/* Auto-fit bounds to POIs */}
              <MapFitter pois={poiMarkers} />

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
                />
              ))}

              {/* Heatmap */}
              <HeatmapLayer points={heatPoints} />
            </MapContainer>
          )}
        </div>
      </Card>

      {/* ---- Stats ---- */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đang phát ngay lúc này"
              value={playingCount}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng POI đang active"
              value={activePOICount}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Người đang nghe"
              value={playingCount}
              suffix="người"
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Ngôn ngữ đang phát"
              value={playingLanguages}
              suffix="ngôn ngữ"
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
