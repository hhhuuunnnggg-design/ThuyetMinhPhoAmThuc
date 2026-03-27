import { useCallback, useEffect, useRef, useState } from "react";
import { getTopPOIsAPI, type TopPOI } from "@/api/app.api";
import { logger } from "@/utils/logger";
import { Card, Col, DatePicker, Progress, Row, Tooltip, Typography } from "antd";
import { CrownOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";

const { Paragraph } = Typography;
const { RangePicker } = DatePicker;

const POLL_MS = 15_000;

function defaultRange(): [Dayjs, Dayjs] {
  const end = dayjs();
  return [end.subtract(6, "day").startOf("day"), end];
}

const AdminTopPOIsPage = () => {
  const [topPOIs, setTopPOIs] = useState<TopPOI[]>([]);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(defaultRange);
  const [loading, setLoading] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTopPOIs = useCallback(async () => {
    const [start, end] = dateRange;
    const from = start.format("YYYY-MM-DD");
    const to = end.format("YYYY-MM-DD");
    setLoading(true);
    try {
      const res: any = await getTopPOIsAPI(from, to, 10);
      if (res?.data) {
        const data = Array.isArray(res.data) ? res.data : res.data.result || [];
        setTopPOIs(data);
      }
    } catch (err) {
      logger.error("Fetch top POIs error:", err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    void fetchTopPOIs();
    pollingRef.current = setInterval(() => void fetchTopPOIs(), POLL_MS);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchTopPOIs]);

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <CrownOutlined style={{ color: "#faad14" }} />
            Top Địa Điểm Nghe Nhiều Nhất
          </h2>
          <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0, maxWidth: 640 }}>
            Xếp hạng theo số lượt ghi nhận trong narration logs (phát xong hoặc dừng). Tự làm mới mỗi{" "}
            {POLL_MS / 1000}s; chọn khoảng ngày để lọc.
          </Paragraph>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <RangePicker
            value={dateRange}
            onChange={(vals) => {
              if (vals?.[0] && vals[1]) {
                setDateRange([vals[0].startOf("day"), vals[1].startOf("day")]);
              }
            }}
            format="DD/MM/YYYY"
            allowClear={false}
            style={{ minWidth: 260 }}
          />
          <Tooltip title="Làm mới ngay">
            <ReloadOutlined
              onClick={() => void fetchTopPOIs()}
              style={{ fontSize: 20, cursor: "pointer", color: "#1890ff" }}
              spin={loading}
            />
          </Tooltip>
        </div>
      </div>

      <Card>
        <Row gutter={[12, 12]}>
          {topPOIs.length === 0 ? (
            <Col span={24}>
              <div style={{ textAlign: "center", color: "#999", padding: "40px 0" }}>
                Chưa có dữ liệu nghe trong khoảng thời gian này
              </div>
            </Col>
          ) : (
            topPOIs.map((poi) => {
              const maxTotal = topPOIs[0]?.totalListens || 1;
              const pct = Math.round((poi.totalListens / maxTotal) * 100);
              return (
                <Col span={24} key={poi.poiId}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 0",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background:
                          poi.rank === 1
                            ? "linear-gradient(135deg,#ffd700,#ff8c00)"
                            : poi.rank === 2
                              ? "linear-gradient(135deg,#c0c0c0,#9e9e9e)"
                              : poi.rank === 3
                                ? "linear-gradient(135deg,#cd7f32,#a0522d)"
                                : "#f0f0f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 14,
                        color: poi.rank <= 3 ? "#fff" : "#666",
                        flexShrink: 0,
                      }}
                    >
                      {poi.rank}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 15,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {poi.poiName}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#888",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {poi.address || "—"}
                      </div>
                      <Progress
                        percent={pct}
                        size="small"
                        showInfo={false}
                        strokeColor={poi.rank === 1 ? "#faad14" : "#1890ff"}
                        trailColor="#f0f0f0"
                        style={{ marginTop: 6 }}
                      />
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 16, color: "#1890ff" }}>
                        {poi.totalListens.toLocaleString("vi-VN")}
                      </div>
                      <div style={{ fontSize: 12, color: "#52c41a" }}>
                        hôm nay: {poi.todayListens.toLocaleString("vi-VN")}
                      </div>
                    </div>
                  </div>
                </Col>
              );
            })
          )}
        </Row>
      </Card>
    </div>
  );
};

export default AdminTopPOIsPage;
