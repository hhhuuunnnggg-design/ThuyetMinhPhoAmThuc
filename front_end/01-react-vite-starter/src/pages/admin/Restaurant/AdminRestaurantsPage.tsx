import {
  deleteAdminRestaurantAPI,
  fetchAdminRestaurantsAPI,
  parseAdminRestaurantListResponse,
  type AdminRestaurant,
} from "@/api/adminRestaurant.api";
import { ROUTES } from "@/constants";
import { logger } from "@/utils/logger";
import {
  DeleteOutlined,
  EditOutlined,
  LinkOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import ProTable from "@ant-design/pro-table";
import {
  Alert,
  Button,
  message,
  Popconfirm,
  Space,
  Tag,
  Tooltip,
} from "antd";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import UpsertRestaurantModal from "./UpsertRestaurantModal";

const AdminRestaurantsPage = () => {
  const actionRef = useRef<any>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (id: number) => {
    setEditingId(id);
    setModalOpen(true);
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString("vi-VN");

  const formatCommission = (rate: number | null) => {
    if (rate == null) return <span style={{ color: "#999" }}>—</span>;
    return <Tag color="blue">{(rate * 100).toFixed(1)}%</Tag>;
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 70,
    },
    {
      title: "Chủ quán",
      dataIndex: "ownerName",
      key: "ownerName",
      ellipsis: true,
      render: (v: string | null) => (
        <span style={{ fontWeight: 600 }}>{v || "—"}</span>
      ),
    },
    {
      title: "Liên hệ",
      key: "contact",
      hideInSearch: true,
      width: 180,
      render: (_: unknown, r: AdminRestaurant) => (
        <div style={{ fontSize: 12 }}>
          <div>{r.ownerPhone || "—"}</div>
          <div style={{ color: "#64748b" }}>{r.ownerEmail || "—"}</div>
        </div>
      ),
    },
    {
      title: "POI liên kết",
      dataIndex: "poiId",
      key: "poiId",
      width: 110,
      render: (v: number | null) =>
        v ? (
          <Tag color="purple">POI #{v}</Tag>
        ) : (
          <span style={{ color: "#999" }}>Chưa gắn</span>
        ),
    },
    {
      title: "Hoa hồng",
      dataIndex: "commissionRate",
      key: "commissionRate",
      width: 100,
      hideInSearch: true,
      render: formatCommission,
    },
    {
      title: "Thanh toán",
      key: "payment",
      hideInSearch: true,
      width: 160,
      render: (_: unknown, r: AdminRestaurant) => (
        <div style={{ fontSize: 11 }}>
          {r.bankAccount ? (
            <div>
              <span style={{ color: "#22c55e" }}>✓</span>{" "}
              {r.bankName || "?"} — {r.bankAccount}
            </div>
          ) : (
            <span style={{ color: "#f59e0b" }}>⚠ Chưa có TK ngân hàng</span>
          )}
          {r.payosClientId && (
            <div style={{ color: "#22c55e", marginTop: 2 }}>✓ PayOS đã cấu hình</div>
          )}
        </div>
      ),
    },
    {
      title: "Xác minh",
      dataIndex: "isVerified",
      key: "isVerified",
      width: 110,
      hideInSearch: true,
      render: (v: boolean | null) => (
        <Tag color={v ? "green" : "default"}>
          {v ? "Đã xác minh" : "Chưa xác minh"}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      hideInSearch: true,
      render: (v: string) => formatDate(v),
    },
    {
      title: "Thao tác",
      valueType: "option",
      width: 120,
      render: (_: unknown, r: AdminRestaurant) => (
        <Space>
          <Tooltip title="Sửa nhà hàng">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(r.id)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa nhà hàng?"
            description="Xóa nhà hàng sẽ không xóa POI và nhóm TTS liên kết."
            onConfirm={async () => {
              try {
                await deleteAdminRestaurantAPI(r.id);
                message.success("Đã xóa nhà hàng");
                actionRef.current?.reload();
              } catch (e: any) {
                message.error(e?.message || "Xóa thất bại");
                logger.error("Delete restaurant error:", e);
              }
            }}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Quản lý Nhà hàng"
        description={
          <>
            Nhà hàng chứa thông tin chủ quán, cấu hình <strong>PayOS</strong> (thanh toán) và{" "}
            <strong>hoa hồng</strong>. Mỗi nhà hàng có thể gắn với <strong>một POI</strong> (điểm
            kinh doanh). Để thêm nhà hàng, nhấn <strong>Tạo nhà hàng</strong>.
          </>
        }
      />

      <UpsertRestaurantModal
        open={modalOpen}
        editingId={editingId}
        onCancel={() => {
          setModalOpen(false);
          setEditingId(null);
        }}
        onSuccess={() => {
          actionRef.current?.reload();
        }}
      />

      <ProTable<AdminRestaurant>
        headerTitle="Danh sách Nhà hàng"
        actionRef={actionRef}
        rowKey="id"
        search={false}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreate}
          >
            Tạo nhà hàng
          </Button>,
          <Link key="pois" to={ROUTES.ADMIN.POIS}>
            <Button icon={<LinkOutlined />}>Quản lý POI</Button>
          </Link>,
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
            const raw: any = await fetchAdminRestaurantsAPI(
              params.current || 1,
              params.pageSize || 10,
              "createdAt",
              "desc"
            );
            const { data, total } = parseAdminRestaurantListResponse(raw);
            return { data, success: true, total };
          } catch (e) {
            logger.error("Admin restaurant list error:", e);
            message.error("Không tải được danh sách nhà hàng");
            return { data: [], success: false, total: 0 };
          }
        }}
        columns={columns as any}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (t) => `Tổng ${t} nhà hàng`,
        }}
      />
    </div>
  );
};

export default AdminRestaurantsPage;
