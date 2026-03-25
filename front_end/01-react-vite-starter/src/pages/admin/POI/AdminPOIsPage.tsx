import {
  deleteAdminPOIAPI,
  fetchAdminPOIsAPI,
  parseAdminPOIListResponse,
  type AdminPOI,
} from "@/api/adminPoi.api";
import { getImageUrl } from "@/api/tts.api";
import { logger } from "@/utils/logger";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import ProTable from "@ant-design/pro-table";
import { Alert, Button, message, Popconfirm, Space, Tag, Tooltip, Image } from "antd";
import { useRef, useState } from "react";
import UpsertPOIModal from "./UpsertPOIModal";

const AdminPOIsPage = () => {
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

  return (
    <div style={{ padding: 24 }}>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Điểm POI (địa điểm kinh doanh)"
        description={
          <>
            POI dùng cho app & bản đồ: <strong>địa chỉ, GPS, thông tin ẩm thực, mã QR</strong>, liên kết nhà hàng & người tạo.
            TTSAudioGroup chỉ chứa audio đa ngôn ngữ cho POI.
          </>
        }
      />
      <UpsertPOIModal
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
      <ProTable<AdminPOI>
        headerTitle="Danh sách POI"
        actionRef={actionRef}
        rowKey="id"
        search={false}
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Tạo POI
          </Button>,
          <Button key="reload" icon={<ReloadOutlined />} onClick={() => actionRef.current?.reload()}>
            Làm mới
          </Button>,
        ]}
        request={async (params) => {
          try {
            const raw: any = await fetchAdminPOIsAPI(
              params.current || 1,
              params.pageSize || 10,
              "createdAt",
              "desc"
            );
            const { data, total } = parseAdminPOIListResponse(raw);
            return { data, success: true, total };
          } catch (e) {
            logger.error("Admin POI list:", e);
            message.error("Không tải được danh sách POI");
            return { data: [], success: false, total: 0 };
          }
        }}
        columns={[
          { title: "ID", dataIndex: "id", width: 70 },
          {
            title: "Ảnh",
            dataIndex: "imageUrl",
            width: 80,
            render: (_: unknown, r: AdminPOI) => {
              const url = getImageUrl(r.imageUrl);
              if (!url) return "—";
              return (
                <Image
                  src={url}
                  width={52}
                  height={52}
                  style={{ objectFit: "cover", borderRadius: 6 }}
                  fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTIiIGhlaWdodD0iNTIiIHZpZXdCb3g9IjAgMCA1MiA1MiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTIiIGhlaWdodD0iNTIiIGZpbGw9IiNlM2UzZTciLz48dGV4dCB4PSI1MiUiIHk9IjU1JSIgdGV4dCllbGVtZW50PSJzdHJvbmciIGZvbnQtYWxpZ25ubWVudD0ibWlkZGxlIiBmaWxsPSIjNzZiN2VhIiBmb250LXNpemU9IjEyIj5JbWFnZTwvdGV4dD48L3N2Zz4="
                />
              );
            },
          },
          {
            title: "Thông tin",
            dataIndex: "foodName",
            ellipsis: true,
            render: (_: unknown, r: AdminPOI) => (
              <div>
                <div style={{ fontWeight: 600 }}>{r.foodName || "—"}</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  {r.userEmail || "—"}
                </div>
              </div>
            ),
          },
          {
            title: "Địa chỉ",
            dataIndex: "address",
            ellipsis: true,
            width: 200,
          },
          {
            title: "Loại",
            dataIndex: "category",
            width: 120,
            render: (_: unknown, r: AdminPOI) => r.category || "—",
          },
          {
            title: "QR",
            dataIndex: "qrCode",
            ellipsis: true,
            width: 140,
            // ProTable truyền tham số 1 là ReactNode (dom), không phải text — dùng record
            render: (_: unknown, r: AdminPOI) => {
              const qr = r.qrCode;
              if (qr == null || qr === "") return "—";
              const s = String(qr);
              return (
                <Tooltip title={s}>
                  <Tag color="blue" style={{ maxWidth: 120 }}>
                    {s.slice(0, 8)}…
                  </Tag>
                </Tooltip>
              );
            },
          },
          {
            title: "Trạng thái",
            dataIndex: "isActive",
            width: 100,
            render: (_: unknown, r: AdminPOI) => (
              <Tag color={r.isActive ? "green" : "default"}>{r.isActive ? "Hoạt động" : "Tắt"}</Tag>
            ),
          },
          {
            title: "v.",
            dataIndex: "version",
            width: 60,
          },
          {
            title: "Thao tác",
            valueType: "option",
            width: 120,
            render: (_, r) => (
              <Space>
                <Tooltip title="Sửa POI">
                  <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r.id)} />
                </Tooltip>
                <Popconfirm
                  title="Xóa POI?"
                  description="Xóa bản ghi POI."
                  onConfirm={async () => {
                    try {
                      await deleteAdminPOIAPI(r.id);
                      message.success("Đã xóa");
                      actionRef.current?.reload();
                    } catch (e: any) {
                      message.error(e?.message || "Xóa thất bại");
                    }
                  }}
                >
                  <Button type="link" size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (t) => `Tổng ${t} POI`,
        }}
      />
    </div>
  );
};

export default AdminPOIsPage;
