import {
  deleteAdminPOIAPI,
  fetchAdminPOIsAPI,
  parseAdminPOIListResponse,
  type AdminPOI,
} from "@/api/adminPoi.api";
import { createAppPaymentAPI } from "@/api/appPayment.api";
import { getImageUrl } from "@/api/tts.api";
import { ROUTES } from "@/constants";
import type { RootState } from "@/redux/store";
import { logger } from "@/utils/logger";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import ProTable from "@ant-design/pro-table";
import { Alert, Button, message, Popconfirm, Space, Spin, Tag, Tooltip, Image } from "antd";
import { QRCodeSVG } from "qrcode.react";
import { useRef, useState } from "react";
import { useSelector } from "react-redux";
import UpsertPOIModal from "./UpsertPOIModal";

/**
 * Nội dung QR: URL https://.../open-poi?qr=<uuid> để camera điện thoại nhận dạng là link
 * (tránh lỗi "không đúng định dạng" khi QR chỉ là chuỗi UUID thuần).
 * Dev: đặt VITE_PUBLIC_QR_ORIGIN=http://IP_LAN:3000 nếu quét từ điện thoại (localhost trên phone ≠ máy tính).
 */
function buildPoiQrPayload(qrUuid: string): string {
  const fromEnv = import.meta.env.VITE_PUBLIC_QR_ORIGIN?.trim();
  const origin = (fromEnv && fromEnv.length > 0 ? fromEnv : window.location.origin).replace(/\/$/, "");
  return `${origin}${ROUTES.OPEN_POI}?qr=${encodeURIComponent(qrUuid.trim())}`;
}

const AdminPOIsPage = () => {
  const actionRef = useRef<any>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [payingPoiId, setPayingPoiId] = useState<number | null>(null);
  const user = useSelector((s: RootState) => s.auth.user);

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
            <br />
            <strong>Quét QR</strong> = mở trang địa điểm / app. <strong>Click vào QR</strong> = tạo link PayOS và mở trang thanh toán (giống nút ủng hộ trên app).
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
            width: 108,
            align: "center",
            render: (_: unknown, r: AdminPOI) => {
              const qr = r.qrCode;
              if (qr == null || qr === "") return "—";
              const s = String(qr).trim();
              const payload = buildPoiQrPayload(s);
              const paying = payingPoiId === r.id;

              const openPayOS = async () => {
                if (payingPoiId != null) return;
                setPayingPoiId(r.id);
                try {
                  const userId = user?.email ? `admin:${user.email}` : `admin-web-${r.id}`;
                  const amount =
                    r.price != null && Number(r.price) > 0 ? Math.round(Number(r.price)) : 10_000;
                  const description = r.foodName ? `Ủng hộ: ${r.foodName}` : undefined;
                  const payment = await createAppPaymentAPI({
                    poiId: r.id,
                    userId,
                    amount,
                    description,
                  });
                  const link = payment?.payosPaymentLink?.trim();
                  if (link) {
                    window.open(link, "_blank", "noopener,noreferrer");
                    if (link.includes("/mock/")) {
                      message.warning("PayOS đang dùng link thử (mock) — kiểm tra PAYOS_* trên backend.");
                    } else {
                      message.success("Đã mở trang thanh toán PayOS.");
                    }
                  } else {
                    message.error("Không nhận được link thanh toán từ server.");
                  }
                } catch (e: unknown) {
                  const msg =
                    e && typeof e === "object" && "message" in e
                      ? String((e as { message: string }).message)
                      : "Tạo thanh toán thất bại";
                  message.error(msg);
                } finally {
                  setPayingPoiId(null);
                }
              };

              return (
                <Tooltip
                  title={
                    <>
                      <div>
                        <strong>Quét</strong>: mã địa điểm (camera / app).
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <strong>Click</strong>: mở PayOS (ủng hộ), giống app.
                      </div>
                    </>
                  }
                >
                  <button
                    type="button"
                    onClick={openPayOS}
                    disabled={paying}
                    style={{
                      display: "inline-flex",
                      padding: 4,
                      background: "#fff",
                      borderRadius: 6,
                      border: "1px solid #e2e8f0",
                      lineHeight: 0,
                      cursor: paying ? "wait" : "pointer",
                    }}
                    aria-label="Quét QR địa điểm hoặc click để thanh toán PayOS"
                  >
                    {paying ? (
                      <span style={{ width: 56, height: 56, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                        <Spin size="small" />
                      </span>
                    ) : (
                      <QRCodeSVG value={payload} size={56} level="M" marginSize={0} />
                    )}
                  </button>
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
