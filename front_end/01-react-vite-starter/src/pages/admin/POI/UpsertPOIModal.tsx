import {
  createAdminPOIAPI,
  getAdminPOIByIdAPI,
  unwrapAdminPOI,
  updateAdminPOIAPI,
  type UpsertPOIRequest,
} from "@/api/adminPoi.api";
import { logger } from "@/utils/logger";
import {
  Form,
  Input,
  InputNumber,
  Modal,
  Slider,
  message,
} from "antd";
import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  editingId: number | null;
};

const UpsertPOIModal = ({ open, onCancel, onSuccess, editingId }: Props) => {
  const [form] = Form.useForm<UpsertPOIRequest>();
  const [loading, setLoading] = useState(false);

  const isEdit = editingId != null;

  useEffect(() => {
    if (!open) {
      form.resetFields();
      return;
    }
    if (editingId == null) {
      form.resetFields();
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const raw: any = await getAdminPOIByIdAPI(editingId);
        const poi = unwrapAdminPOI(raw);
        if (!poi) {
          message.error("Không đọc được dữ liệu POI");
          return;
        }
        form.setFieldsValue({
          foodName: poi.foodName ?? undefined,
          price: poi.price ?? undefined,
          description: poi.description ?? undefined,
          imageUrl: poi.imageUrl ?? undefined,
          address: poi.address ?? undefined,
          category: poi.category ?? undefined,
          openHours: poi.openHours ?? undefined,
          phone: poi.phone ?? undefined,
          latitude: poi.latitude ?? undefined,
          longitude: poi.longitude ?? undefined,
          accuracy: poi.accuracy ?? undefined,
          triggerRadiusMeters: poi.triggerRadiusMeters ?? 50,
          priority: poi.priority ?? 0,
          restaurantId: poi.restaurantId ?? undefined,
          userId: poi.userId ?? undefined,
        });
      } catch (e: any) {
        message.error(e?.message || "Không tải được POI");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, editingId, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const body: UpsertPOIRequest = {
        foodName: values.foodName || undefined,
        price: values.price ?? undefined,
        description: values.description || undefined,
        imageUrl: values.imageUrl || undefined,
        address: values.address || undefined,
        category: values.category || undefined,
        openHours: values.openHours || undefined,
        phone: values.phone || undefined,
        latitude: values.latitude ?? undefined,
        longitude: values.longitude ?? undefined,
        accuracy: values.accuracy ?? undefined,
        triggerRadiusMeters: values.triggerRadiusMeters ?? undefined,
        priority: values.priority ?? undefined,
        restaurantId: values.restaurantId ?? undefined,
        userId: values.userId ?? undefined,
      };
      if (isEdit) {
        await updateAdminPOIAPI(editingId!, body);
        message.success("Cập nhật POI thành công");
      } else {
        await createAdminPOIAPI(body);
        message.success("Tạo POI thành công");
      }
      onSuccess();
      onCancel();
      form.resetFields();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.message || "Thao tác thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? "Sửa POI" : "Tạo POI mới"}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      destroyOnClose
      width={640}
    >
      <p style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>
        POI là điểm kinh doanh trên bản đồ. Chứa <strong>thông tin ẩm thực</strong>, <strong>GPS</strong>, bán kính kích
        hoạt. TTSAudioGroup tạo sau từ trang Nhóm TTS và liên kết ngược lại POI này.
      </p>
      <Form form={form} layout="vertical">
        {/* Thông tin ẩm thực */}
        <Form.Item name="foodName" label="Tên món ăn">
          <Input placeholder="VD: Phở bò Hà Nội" />
        </Form.Item>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Form.Item name="price" label="Giá (VND)">
            <InputNumber
              placeholder="50000"
              style={{ width: "100%" }}
              min={0}
              step={1000}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(v) => Number(String(v).replace(/,/g, ""))}
            />
          </Form.Item>

          <Form.Item name="category" label="Loại hình">
            <Input placeholder="street_food, restaurant, cafe..." />
          </Form.Item>
        </div>

        <Form.Item name="description" label="Mô tả món ăn">
          <Input.TextArea rows={3} placeholder="Mô tả chi tiết món ăn..." />
        </Form.Item>

        <Form.Item name="imageUrl" label="Link ảnh">
          <Input placeholder="https://..." />
        </Form.Item>

        <Form.Item name="address" label="Địa chỉ">
          <Input.TextArea rows={2} placeholder="Địa chỉ thực tế" />
        </Form.Item>

        <Form.Item name="openHours" label="Giờ mở cửa">
          <Input placeholder="VD: 7:00–22:00" />
        </Form.Item>

        <Form.Item name="phone" label="Điện thoại">
          <Input placeholder="Số liên hệ" />
        </Form.Item>

        {/* GPS */}
        <Form.Item label="Vị trí GPS" style={{ marginBottom: 4 }}>
          <span style={{ color: "#64748b", fontSize: 12 }}>Tọa độ kích hoạt thuyết minh trên app</span>
        </Form.Item>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Form.Item name="latitude" label="Vĩ độ" style={{ marginBottom: 8 }}>
            <InputNumber
              placeholder="21.0285"
              style={{ width: "100%" }}
              step={0.0001}
              min={-90}
              max={90}
            />
          </Form.Item>

          <Form.Item name="longitude" label="Kinh độ" style={{ marginBottom: 8 }}>
            <InputNumber
              placeholder="105.8542"
              style={{ width: "100%" }}
              step={0.0001}
              min={-180}
              max={180}
            />
          </Form.Item>
        </div>

        <Form.Item
          name="triggerRadiusMeters"
          label={`Bán kính kích hoạt (${form.getFieldValue("triggerRadiusMeters") ?? 50} m)`}
          extra="Khoảng cách để app tự động phát thuyết minh"
          style={{ marginBottom: 8 }}
        >
          <Slider
            min={5}
            max={200}
            marks={{ 5: "5m", 50: "50m", 100: "100m", 200: "200m" }}
            tooltip={{ formatter: (v) => `${v}m` }}
          />
        </Form.Item>

        <Form.Item name="priority" label="Ưu tiên khi gần nhau" style={{ marginBottom: 0 }}>
          <InputNumber min={0} max={100} placeholder="0" style={{ width: "100%" }} />
        </Form.Item>

        {/* User & Restaurant */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Form.Item name="userId" label="ID User sở hữu (tùy chọn)" style={{ marginTop: 8 }}>
            <InputNumber
              min={1}
              style={{ width: "100%" }}
              placeholder="Nếu cần phân quyền"
            />
          </Form.Item>

          <Form.Item name="restaurantId" label="ID nhà hàng (tùy chọn)" style={{ marginTop: 8 }}>
            <InputNumber
              min={1}
              style={{ width: "100%" }}
              placeholder="Nếu đã có bản ghi Nhà hàng"
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
};

export default UpsertPOIModal;
