import { useCallback, useEffect, useRef, useState } from "react";
import { getAdminActiveNarrationsAPI, type ActiveNarration } from "@/api/app.api";
import { logger } from "@/utils/logger";
import { Badge, Card, Col, Progress, Row, Statistic, Table, Tag, Tooltip } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

const LANGUAGE_COLORS: Record<string, string> = {
  vi: "#ff6b35",
  en: "#3b82f6",
  zh: "#ef4444",
  ja: "#ec4899",
  ko: "#8b5cf6",
  fr: "#10b981",
};

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

  const columns = [
    {
      title: "POI",
      dataIndex: "poiName",
      key: "poiName",
      render: (name: string) => (
        <span style={{ fontWeight: 600 }}>{name}</span>
      ),
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
        const color =
          s === "PLAYING"
            ? "processing"
            : s === "COMPLETED"
              ? "success"
              : "warning";
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

  const byPOI = activeNarrations.reduce<Record<string, ActiveNarration[]>>(
    (acc, n) => {
      (acc[n.poiName] ||= []).push(n);
      return acc;
    },
    {}
  );

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

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đang phát ngay lúc này"
              value={activeNarrations.filter((n) => n.status === "PLAYING").length}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng POI đang active"
              value={Object.keys(byPOI).length}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Người đang nghe"
              value={activeNarrations.filter((n) => n.status === "PLAYING").length}
              suffix="người"
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Ngôn ngữ đang phát"
              value={[...new Set(activeNarrations.map((n) => n.languageCode))].length}
              suffix="ngôn ngữ"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        {Object.entries(byPOI).map(([poiName, narrations]) => (
          <Col span={6} key={poiName}>
            <Card
              size="small"
              title={<span style={{ fontWeight: 600 }}>{poiName}</span>}
              extra={
                <Badge
                  status="processing"
                  text={
                    <span style={{ fontSize: 12 }}>
                      {narrations.filter((n) => n.status === "PLAYING").length} đang nghe
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
        ))}
      </Row>

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
