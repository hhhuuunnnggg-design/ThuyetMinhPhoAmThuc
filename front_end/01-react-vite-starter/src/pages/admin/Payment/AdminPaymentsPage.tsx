import { Alert, Button, message, Space, Tag, Tooltip } from "antd";
import { useRef, useState } from "react";
import { EyeOutlined, ReloadOutlined } from "@ant-design/icons";
import ProTable from "@ant-design/pro-table";
import type { AdminPOI } from "@/api/adminPoi.api";
import { ROUTES } from "@/constants";
import { useNavigate } from "react-router-dom";

interface PaymentRecord {
  id: number;
  userId: string;
  poiId: number;
  poiName: string;
  restaurantId: number | null;
  restaurantName: string | null;
  amount: number;
  currency: string;
  status: string;
  payosTransactionId: string | null;
  payosPaymentLink: string | null;
  payosQrCode: string | null;
  paidAt: string | null;
  createdAt: string;
  description: string | null;
}

const AdminPaymentsPage = () => {
  const actionRef = useRef<any>();
  const navigate = useNavigate();

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
      case "PAID":
      case "SUCCESS":
        return "green";
      case "PENDING":
        return "orange";
      case "FAILED":
      case "CANCELLED":
        return "red";
      default:
        return "default";
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Quản lý thanh toán PayOS"
        description={
          <>
            Danh sách các giao dịch thanh toán. Trạng thái cập nhật tự động qua webhook từ PayOS.
          </>
        }
      />

      <ProTable<PaymentRecord>
        headerTitle="Danh sách thanh toán"
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: "auto" }}
        toolBarRender={() => [
          <Button
            key="reload"
            icon={<ReloadOutlined />}
            onClick={() => actionRef.current?.reload()}
          >
            Làm mới
          </Button>,
        ]}
        request={async (params) => {
          try {
            // TODO: gọi API admin payments khi backend hỗ trợ
            // Hiện tại trả về mock data
            return {
              data: [] as PaymentRecord[],
              success: true,
              total: 0,
            };
          } catch (e) {
            return { data: [], success: false, total: 0 };
          }
        }}
        columns={[
          {
            title: "ID",
            dataIndex: "id",
            width: 70,
            hideInSearch: true,
          },
          {
            title: "Món ăn / POI",
            dataIndex: "poiName",
            ellipsis: true,
            render: (_: unknown, r: PaymentRecord) => (
              <div>
                <div style={{ fontWeight: 600 }}>{r.poiName || "—"}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  POI #{r.poiId}
                </div>
              </div>
            ),
          },
          {
            title: "Người dùng",
            dataIndex: "userId",
            width: 180,
            hideInSearch: false,
          },
          {
            title: "Số tiền",
            dataIndex: "amount",
            width: 130,
            hideInSearch: true,
            render: (v: number) => (
              <span style={{ fontWeight: 600, color: "#16a34a" }}>
                {v ? formatCurrency(v) : "—"}
              </span>
            ),
          },
          {
            title: "Trạng thái",
            dataIndex: "status",
            width: 120,
            hideInSearch: false,
            render: (v: string) => (
              <Tag color={statusColor(v || "")}>
                {(v || "UNKNOWN").toUpperCase()}
              </Tag>
            ),
          },
          {
            title: "PayOS ID",
            dataIndex: "payosTransactionId",
            ellipsis: true,
            width: 160,
            hideInSearch: true,
            render: (v: string | null) =>
              v ? (
                <Tooltip title={v}>
                  <Tag color="blue">{v.slice(0, 12)}…</Tag>
                </Tooltip>
              ) : (
                "—"
              ),
          },
          {
            title: "Ngày thanh toán",
            dataIndex: "paidAt",
            width: 170,
            hideInSearch: true,
            render: (v: string | null) => formatDate(v),
          },
          {
            title: "Tạo lúc",
            dataIndex: "createdAt",
            width: 170,
            hideInSearch: true,
            render: (v: string) => formatDate(v),
          },
          {
            title: "Thao tác",
            valueType: "option",
            width: 100,
            render: (_, r) => (
              <Space>
                {r.payosPaymentLink && (
                  <Tooltip title="Mở link thanh toán PayOS">
                    <Button
                      type="link"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => window.open(r.payosPaymentLink!, "_blank")}
                    />
                  </Tooltip>
                )}
              </Space>
            ),
          },
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
