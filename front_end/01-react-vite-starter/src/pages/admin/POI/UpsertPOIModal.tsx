import {
  createAdminPOIAPI,
  getAdminPOIByIdAPI,
  unwrapAdminPOI,
  updateAdminPOIAPI,
  type UpsertPOIRequest,
} from "@/api/adminPoi.api";
import {
  fetchAdminRestaurantsAPI,
  parseAdminRestaurantListResponse,
  type AdminRestaurant,
} from "@/api/adminRestaurant.api";
import { uploadFoodImageOnlyAPI, getImageUrl } from "@/api/tts.api";
import { useCurrentApp } from "@/components/context/app.context";
import { logger } from "@/utils/logger";
import {
  Alert,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Slider,
  message,
  Upload,
} from "antd";
import { PlusOutlined, LoadingOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";

type Props = {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  editingId: number | null;
};

const UpsertPOIModal = ({ open, onCancel, onSuccess, editingId }: Props) => {
  const [form] = Form.useForm<UpsertPOIRequest>();
  const [loading, setLoading] = useState(false);
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  /** Hiển thị chủ sở hữu khi sửa POI */
  const [editOwnerHint, setEditOwnerHint] = useState<string | null>(null);
  const { user } = useCurrentApp();
  /** Upload ảnh */
  const [imageFileList, setImageFileList] = useState<UploadFile[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const isEdit = editingId != null;

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const raw: any = await fetchAdminRestaurantsAPI(1, 500, "createdAt", "desc");
        const { data } = parseAdminRestaurantListResponse(raw);
        setRestaurants(data);
      } catch (e) {
        logger.error("Load restaurants for POI modal:", e);
        setRestaurants([]);
      }
    })();
  }, [open]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setUploadedImageUrl(null);
      setImageFileList([]);
      return;
    }
    if (editingId == null) {
      form.resetFields();
      setEditOwnerHint(null);
      setUploadedImageUrl(null);
      setImageFileList([]);
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
        const name = [poi.userFullName, poi.userEmail].filter(Boolean).join(" — ");
        setEditOwnerHint(
          poi.userId != null
            ? name
              ? `${name} (user ID: ${poi.userId})`
              : `User ID: ${poi.userId}`
            : "Chưa gán user sở hữu"
        );
        setUploadedImageUrl(poi.imageUrl ?? null);
        if (poi.imageUrl) {
          setImageFileList([
            {
              uid: "-1",
              name: "current-image",
              status: "done",
              url: getImageUrl(poi.imageUrl) ?? undefined,
            },
          ]);
        } else {
          setImageFileList([]);
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
        imageUrl: uploadedImageUrl || undefined,
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
      setUploadedImageUrl(null);
      setImageFileList([]);
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.message || "Thao tác thất bại");
    } finally {
      setLoading(false);
    }
  };

  /** Một nhà hàng chỉ gắn một POI: ẩn nhà hàng đã có POI khác; khi sửa vẫn giữ option đang gắn với POI này */
  const restaurantsForSelect = restaurants.filter((r) => {
    if (r.poiId == null) return true;
    if (editingId != null && r.poiId === editingId) return true;
    return false;
  });

  const restaurantOptions = restaurantsForSelect.map((r) => {
    const label =
      [r.ownerName, r.ownerEmail].filter(Boolean).join(" — ") || `Nhà hàng #${r.id}`;
    return { value: r.id, label };
  });

  const imageUploadProps: UploadProps = {
    name: "image",
    accept: "image/*",
    listType: "picture-card",
    fileList: imageFileList,
    beforeUpload: () => false,
    onChange: async ({ fileList: newFileList }) => {
      setImageFileList(newFileList);
      const latest = newFileList[newFileList.length - 1];
      if (!latest || latest.status === "uploading" || latest.status === "done") return;

      const rawFile = latest.originFileObj as File | undefined;
      if (!rawFile) return;

      setUploadingImage(true);
      try {
        const res: any = await uploadFoodImageOnlyAPI(rawFile);
        // Axios interceptor trả về body RestResponse: { data: { imageUrl, message } }
        const url = res?.data?.imageUrl;
        if (url) {
          setUploadedImageUrl(url);
          setImageFileList((prev) =>
            prev.map((f) =>
              f.uid === latest.uid ? { ...f, status: "done" as const, url: getImageUrl(url) ?? undefined } : f
            )
          );
          message.success("Upload ảnh thành công");
        } else {
          message.error("Upload ảnh thất bại — không nhận được URL");
          setImageFileList((prev) => prev.filter((f) => f.uid !== latest.uid));
        }
      } catch (e: any) {
        logger.error("Upload image error:", e);
        message.error(e?.message || "Upload ảnh thất bại");
        setImageFileList((prev) => prev.filter((f) => f.uid !== latest.uid));
      } finally {
        setUploadingImage(false);
      }
    },
    onRemove: () => {
      setUploadedImageUrl(null);
      setImageFileList([]);
      return true;
    },
  };

  return (
    <Modal
      title={isEdit ? "Sửa POI" : "Tạo POI mới"}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading || uploadingImage}
      destroyOnClose
      width={640}
    >
      <p style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>
        POI là điểm kinh doanh trên bản đồ. Chứa <strong>thông tin ẩm thực</strong>, <strong>GPS</strong>, bán kính kích
        hoạt. TTSAudioGroup tạo sau từ trang Nhóm TTS và liên kết ngược lại POI này.
      </p>

      {!isEdit && user && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Chủ sở hữu POI"
          description={
            <>
              POI sẽ được gắn với tài khoản đang đăng nhập: <strong>{user.fullname}</strong> (ID:{" "}
              <strong>{user.id}</strong>). Không cần nhập tay.
            </>
          }
        />
      )}

      {isEdit && editOwnerHint && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Chủ sở hữu POI"
          description={<span>{editOwnerHint}. Cập nhật POI không đổi chủ sở hữu.</span>}
        />
      )}

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
              parser={(v) => Number(String(v).replace(/,/g, "")) as any}
            />
          </Form.Item>

          <Form.Item name="category" label="Loại hình">
            <Input placeholder="street_food, restaurant, cafe..." />
          </Form.Item>
        </div>

        <Form.Item name="description" label="Mô tả món ăn">
          <Input.TextArea rows={3} placeholder="Mô tả chi tiết món ăn..." />
        </Form.Item>

        <Form.Item label="Ảnh món ăn" required>
          <Upload
            {...imageUploadProps}
            style={{ width: "100%" }}
          >
            {imageFileList.length === 0 && (
              <div>
                {uploadingImage ? <LoadingOutlined /> : <PlusOutlined />}
                <div style={{ marginTop: 8, fontSize: 12 }}>Tải ảnh lên</div>
              </div>
            )}
          </Upload>
          {uploadedImageUrl && (
            <div style={{ marginTop: 8, fontSize: 12, color: "#52c41a" }}>
              Đã upload: {uploadedImageUrl}
            </div>
          )}
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

        <Form.Item name="restaurantId" label="Nhà hàng (tùy chọn)">
          <Select
            allowClear
            placeholder="Chọn nhà hàng trong danh sách"
            options={restaurantOptions}
            showSearch
            optionFilterProp="label"
            notFoundContent={
              restaurants.length === 0
                ? "Chưa có nhà hàng — tạo ở menu Nhà hàng"
                : restaurantOptions.length === 0
                  ? "Tất cả nhà hàng đã gắn POI — hủy liên kết ở POI khác hoặc tạo nhà hàng mới"
                  : undefined
            }
          />
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
      </Form>
    </Modal>
  );
};

export default UpsertPOIModal;
