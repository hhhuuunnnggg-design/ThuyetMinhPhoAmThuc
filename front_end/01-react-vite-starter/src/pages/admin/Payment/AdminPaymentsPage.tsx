import {
  fetchAdminPaymentsAPI,
  fetchAdminPaymentsStatsMonthAPI,
  parseAdminPaymentListResponse,
  parseAdminPaymentStatsResponse,
  syncAdminPaymentPayOSAPI,
  type AdminPaymentRecord,
  type AdminPaymentStatsMonth,
} from "@/api/adminPayment.api";
import { CloudSyncOutlined, EyeOutlined, ReloadOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, DatePicker, message, Row, Space, Statistic, Tag, Tooltip } from "antd";
import ProTable from "@ant-design/pro-table";
import { useCallback, useEffect, useRef, useState } from "react";
import dayjs from "dayjs";

const PAYOS_DOCS = "https://payos.vn/docs/api/";

const PENDING_SYNC_PAGE_SIZE = 50;
const PENDING_SYNC_MAX_PAGES = 20;

const AdminPaymentsPage = () => {
  const actionRef = useRef<any>();
  const [searchMonth, setSearchMonth] = useState<dayjs.Dayjs>(dayjs());
  const [stats, setStats] = useState<AdminPaymentStatsMonth | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [pendingPayOSSyncing, setPendingPayOSSyncing] = useState(false);

  const formatCurrency = (amount: number, currency = "VND") => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("vi-VN");
  };

  const statusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "SUCCESS":
        return "green";
      case "PENDING":
        return "orange";
      case "FAILED":
      case "CANCELLED":
      case "REFUNDED":
        return "red";
      default:
        return "default";
    }
  };

  const loadStats = useCallback(async (month?: dayjs.Dayjs) => {
    setStatsLoading(true);
    try {
      const raw = await fetchAdminPaymentsStatsMonthAPI(month?.format("YYYY-MM"));
      setStats(parseAdminPaymentStatsResponse(raw));
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats(searchMonth);
  }, [loadStats, searchMonth]);

  /** Vào trang Thanh toán: gọi PayOS GET payment-requests (qua API sync) cho mọi đơn PENDING, giống nút đồng bộ từng dòng */
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setPendingPayOSSyncing(true);
      let synced = 0;
      try {
        for (let page = 1; page <= PENDING_SYNC_MAX_PAGES; page += 1) {
          if (cancelled) return;
          const raw = await fetchAdminPaymentsAPI({
            page,
            pageSize: PENDING_SYNC_PAGE_SIZE,
            sortBy: "createdAt",
            sortDir: "desc",
            status: "PENDING",
          });
          const { data, total } = parseAdminPaymentListResponse(raw);
          for (const r of data) {
            if (cancelled) return;
            try {
              await syncAdminPaymentPayOSAPI(r.id);
              synced += 1;
            } catch {
              /* thiếu PayOS id / lỗi mạng — bỏ qua, có thể bấm đồng bộ từng dòng */
            }
          }
          if (data.length === 0 || page * PENDING_SYNC_PAGE_SIZE >= total) break;
        }
        if (!cancelled) {
          if (synced > 0) {
            message.success(`Đã đồng bộ ${synced} giao dịch PENDING từ PayOS.`);
          }
          actionRef.current?.reload();
          void loadStats(searchMonth);
        }
      } catch {
        if (!cancelled) void loadStats(searchMonth);
      } finally {
        if (!cancelled) setPendingPayOSSyncing(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [loadStats, searchMonth]);

  const maxDaily = Math.max(1, ...(stats?.dailyRevenue.map((d) => d.amountVnd) ?? [0]));

  return (
    <div style={{ padding: 24 }}>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Quản lý thanh toán PayOS"
        description={
          <>
            Khi mở trang này, hệ thống tự gọi PayOS (GET payment-requests qua backend) để cập nhật các đơn{" "}
            <strong>PENDING</strong>. Vẫn có thể đồng bộ lại từng dòng ở cột thao tác nếu cần. Bảng hiển thị các
            giao dịch tạo qua ứng dụng (lưu nội bộ). Trạng thái cũng cập nhật qua webhook PayOS. API tham khảo:{" "}
            <a href={PAYOS_DOCS} target="_blank" rel="noreferrer">
              Lấy thông tin link thanh toán
            </a>{" "}
            (GET <code>/v2/payment-requests/{"{id}"}</code>). PayOS{" "}
            <strong>không công khai</strong> API liệt kê toàn bộ lịch sử như trang <em>my.payos.vn</em> — thống kê
            tháng theo giờ Việt Nam.
            {pendingPayOSSyncing ? (
              <>
                {" "}
                <strong>Đang đồng bộ PENDING từ PayOS…</strong>
              </>
            ) : null}
          </>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} md={8}>
          <Card loading={statsLoading} bordered={false} style={{ background: "#059669", color: "#fff" }}>
            <Statistic
              title={<span style={{ color: "rgba(255,255,255,0.85)" }}>Doanh thu thanh toán thành công (tháng)</span>}
              value={stats?.totalRevenueVnd ?? 0}
              formatter={(v) => formatCurrency(Number(v))}
              valueStyle={{ color: "#fff" }}
            />
            <div style={{ fontSize: 12, marginTop: 8, opacity: 0.9 }}>Tháng {stats?.monthKey ?? "—"}</div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card loading={statsLoading} bordered={false}>
            <Statistic title="Đơn hoàn thành (tháng)" value={stats?.completedOrdersCount ?? 0} suffix="đơn" />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card loading={statsLoading} bordered={false}>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>Trạng thái (tạo trong tháng)</div>
            <Space wrap size={[8, 8]}>
              <Tag color="orange">PENDING: {stats?.pendingCount ?? 0}</Tag>
              <Tag color="green">SUCCESS: {stats?.successCount ?? 0}</Tag>
              <Tag color="red">CANCELLED: {stats?.cancelledCount ?? 0}</Tag>
              <Tag>FAILED: {stats?.failedCount ?? 0}</Tag>
              {(stats?.otherStatusCount ?? 0) > 0 && <Tag>Khác: {stats?.otherStatusCount}</Tag>}
            </Space>
          </Card>
        </Col>
      </Row>

      {stats && stats.dailyRevenue.length > 0 && (
        <Card
          title={`Doanh thu theo ngày (đơn SUCCESS, tháng ${searchMonth.format("MM/YYYY")})`}
          size="small"
          style={{ marginBottom: 20 }}
          extra={
            <Space>
              <DatePicker.MonthPicker
                value={searchMonth}
                onChange={(val) => {
                  if (val) setSearchMonth(val);
                }}
                placeholder="Chọn tháng"
                allowClear={false}
              />
              <Button size="small" icon={<ReloadOutlined />} onClick={() => void loadStats(searchMonth)}>
                Làm mới thống kê
              </Button>
            </Space>
          }
        >
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 140, overflowX: "auto" }}>
            {stats.dailyRevenue.map((d) => {
              const h = Math.round((d.amountVnd / maxDaily) * 120);
              return (
                <Tooltip key={d.dayOfMonth} title={`Ngày ${d.dayOfMonth}: ${formatCurrency(d.amountVnd)}`}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 10 }}>
                    <div
                      style={{
                        width: "100%",
                        minHeight: 4,
                        height: Math.max(4, h),
                        background: d.amountVnd > 0 ? "#10b981" : "#e2e8f0",
                        borderRadius: 4,
                      }}
                    />
                    <span style={{ fontSize: 9, color: "#94a3b8", marginTop: 4 }}>{d.dayOfMonth}</span>
                  </div>
                </Tooltip>
              );
            })}
          </div>
        </Card>
      )}

      <ProTable<AdminPaymentRecord>
        headerTitle="Danh sách thanh toán"
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: "auto" }}
        toolBarRender={() => [
          <Button
            key="reload"
            icon={<ReloadOutlined />}
            onClick={() => {
              actionRef.current?.reload();
              void loadStats(searchMonth);
            }}
          >
            Làm mới
          </Button>,
        ]}
        request={async (params, sort) => {
          const sortKeys = sort ? Object.keys(sort) : [];
          const sortKey = sortKeys[0] ?? "createdAt";
          const order = sortKey ? (sort as Record<string, string>)[sortKey] : "descend";
          const sortDir = order === "ascend" ? "asc" : "desc";
          try {
            const raw = await fetchAdminPaymentsAPI({
              page: params.current ?? 1,
              pageSize: params.pageSize ?? 20,
              sortBy: sortKey,
              sortDir,
              poiName: typeof params.poiName === "string" ? params.poiName : undefined,
              userId: typeof params.userId === "string" ? params.userId : undefined,
              status: typeof params.status === "string" ? params.status : undefined,
            });
            const { data, total } = parseAdminPaymentListResponse(raw);
            return { data, success: true, total };
          } catch {
            return { data: [], success: false, total: 0 };
          }
        }}
        columns={[
          {
            title: "ID",
            dataIndex: "id",
            width: 70,
            hideInSearch: true,
            sorter: true,
          },
          {
            title: "Món ăn / POI",
            dataIndex: "poiName",
            ellipsis: true,
            render: (_: unknown, r: AdminPaymentRecord) => (
              <div>
                <div style={{ fontWeight: 600 }}>{r.poiName || "—"}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  POI #{r.poiId ?? "—"}
                  {r.restaurantName ? ` · ${r.restaurantName}` : ""}
                </div>
              </div>
            ),
          },
          {
            title: "Người dùng",
            dataIndex: "userId",
            width: 180,
          },
          {
            title: "Số tiền",
            dataIndex: "amount",
            width: 130,
            hideInSearch: true,
            sorter: true,
            render: (_: unknown, r: AdminPaymentRecord) => (
              <span style={{ fontWeight: 600, color: "#16a34a" }}>
                {r.amount != null ? formatCurrency(r.amount) : "—"}
              </span>
            ),
          },
          {
            title: "Trạng thái",
            dataIndex: "status",
            width: 120,
            valueType: "select",
            valueEnum: {
              PENDING: { text: "PENDING" },
              SUCCESS: { text: "SUCCESS" },
              FAILED: { text: "FAILED" },
              CANCELLED: { text: "CANCELLED" },
              REFUNDED: { text: "REFUNDED" },
            },
            render: (_: unknown, r: AdminPaymentRecord) => (
              <Tag color={statusColor(r.status || "")}>{(r.status || "UNKNOWN").toUpperCase()}</Tag>
            ),
          },
          {
            title: "PayOS order / link",
            dataIndex: "payosTransactionId",
            ellipsis: true,
            width: 160,
            hideInSearch: true,
            render: (_: unknown, r: AdminPaymentRecord) => (
              <div style={{ fontSize: 12 }}>
                <div>{r.payosTransactionId || "—"}</div>
                {r.payosPaymentLinkId && (
                  <div style={{ color: "#64748b" }} title={r.payosPaymentLinkId}>
                    link…{r.payosPaymentLinkId.slice(0, 8)}
                  </div>
                )}
              </div>
            ),
          },
          {
            title: "Ngày thanh toán",
            dataIndex: "paidAt",
            width: 170,
            hideInSearch: true,
            sorter: true,
            render: (_: unknown, r: AdminPaymentRecord) => formatDate(r.paidAt),
          },
          {
            title: "Tạo lúc",
            dataIndex: "createdAt",
            width: 170,
            hideInSearch: true,
            sorter: true,
            render: (_: unknown, r: AdminPaymentRecord) => formatDate(r.createdAt),
          },
          // {
          //   title: "Thao tác",
          //   valueType: "option",
          //   width: 140,
          //   render: (_, r) => (
          //     <Space>
          //       {r.payosPaymentLink && (
          //         <Tooltip title="Mở link thanh toán PayOS">
          //           <Button
          //             type="link"
          //             size="small"
          //             icon={<EyeOutlined />}
          //             onClick={() => window.open(r.payosPaymentLink!, "_blank")}
          //           />
          //         </Tooltip>
          //       )}
          //       <Tooltip title="Gọi PayOS GET payment-requests để cập nhật trạng thái">
          //         <Button
          //           type="link"
          //           size="small"
          //           icon={<CloudSyncOutlined />}
          //           loading={syncingId === r.id}
          //           onClick={async () => {
          //             setSyncingId(r.id);
          //             try {
          //               await syncAdminPaymentPayOSAPI(r.id);
          //               message.success("Đã đồng bộ trạng thái từ PayOS.");
          //               actionRef.current?.reload();
          //               void loadStats();
          //             } catch (e: unknown) {
          //               const msg =
          //                 typeof e === "object" && e !== null && "message" in e
          //                   ? String((e as { message: unknown }).message)
          //                   : "Đồng bộ thất bại.";
          //               message.error(msg);
          //             } finally {
          //               setSyncingId(null);
          //             }
          //           }}
          //         />
          //       </Tooltip>
          //     </Space>
          //   ),
          // },
        ]}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showTotal: (t) => `Tổng ${t} giao dịch`,
        }}
      />
    </div>
  );
};

export default AdminPaymentsPage;
