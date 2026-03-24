import {
  getAudioGroupByIdAPI,
  getVoicesAPI,
  updateTTSGroupAPI,
  uploadFoodImageOnlyAPI,
  type TTSAudioGroup,
  type UpdateTTSAudioGroupRequest,
  type Voice,
} from "@/api/tts.api";
import { logger } from "@/utils/logger";
import { UploadOutlined } from "@ant-design/icons";
import { Button, Form, Input, InputNumber, Modal, Select, Slider, Space, Switch, Upload, message } from "antd";
import { useEffect, useState } from "react";

const { TextArea } = Input;

function unwrapGroupPayload(res: unknown): TTSAudioGroup | null {
  const r = res as Record<string, unknown>;
  if (r?.id != null && typeof r.id === "number") {
    return r as unknown as TTSAudioGroup;
  }
  const top = r?.data as Record<string, unknown> | undefined;
  if (top?.id != null && typeof top.id === "number") {
    return top as unknown as TTSAudioGroup;
  }
  const nested = top?.data as TTSAudioGroup | undefined;
  if (nested?.id != null) {
    return nested;
  }
  return null;
}

interface EditTTSAudioGroupModalProps {
  open: boolean;
  groupId: number | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontSize: 13,
      fontWeight: 600,
      color: "#374151",
      borderBottom: "1px solid #e5e7eb",
      paddingBottom: 6,
      marginBottom: 12,
      marginTop: 8,
    }}
  >
    {children}
  </div>
);

const EditTTSAudioGroupModal = ({ open, groupId, onCancel, onSuccess }: EditTTSAudioGroupModalProps) => {
  const [form] = Form.useForm();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !groupId) return;

    const load = async () => {
      try {
        setLoadingGroup(true);
        const res = await getAudioGroupByIdAPI(groupId);
        const group = unwrapGroupPayload(res);
        if (!group) {
          message.error("Không đọc được dữ liệu nhóm từ server");
          return;
        }
        form.setFieldsValue({
          foodName: group.foodName,
          price: group.price ?? undefined,
          description: group.description,
          imageUrl: group.imageUrl,
          latitude: group.latitude ?? undefined,
          longitude: group.longitude ?? undefined,
          accuracy: group.accuracy ?? undefined,
          triggerRadiusMeters: group.triggerRadiusMeters ?? undefined,
          priority: group.priority ?? undefined,
          originalText: group.originalText,
          originalVoice: group.originalVoice,
          originalSpeed: group.originalSpeed ?? 1,
          originalFormat: group.originalFormat ?? 3,
          originalWithoutFilter: group.originalWithoutFilter ?? false,
        });
        setImagePreview(group.imageUrl ?? null);
      } catch (e: unknown) {
        message.error("Không tải được nhóm audio");
        logger.error("Load TTS group error:", e);
      } finally {
        setLoadingGroup(false);
      }
    };

    void load();
  }, [open, groupId, form]);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      try {
        setLoadingVoices(true);
        const response = await getVoicesAPI();
        if (response?.data?.voices) {
          setVoices(response.data.voices);
        }
      } catch (e: unknown) {
        message.warning("Không thể tải danh sách giọng đọc");
        logger.error("Fetch voices error:", e);
      } finally {
        setLoadingVoices(false);
      }
    })();
  }, [open]);

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const response = await uploadFoodImageOnlyAPI(file);
      if (response?.data?.imageUrl) {
        form.setFieldsValue({ imageUrl: response.data.imageUrl });
        setImagePreview(response.data.imageUrl);
        message.success("Upload ảnh thành công!");
      }
    } catch (e: unknown) {
      message.error("Upload ảnh thất bại");
      logger.error("Upload image error:", e);
    } finally {
      setUploadingImage(false);
    }
    return false;
  };

  const handleSubmit = async (values: UpdateTTSAudioGroupRequest & { originalWithoutFilter?: boolean }) => {
    if (!groupId) return;
    try {
      setSaving(true);
      const body: UpdateTTSAudioGroupRequest = {
        foodName: values.foodName,
        price: values.price,
        description: values.description,
        imageUrl: values.imageUrl,
        latitude: values.latitude,
        longitude: values.longitude,
        accuracy: values.accuracy,
        triggerRadiusMeters: values.triggerRadiusMeters,
        priority: values.priority,
        originalText: values.originalText,
        originalVoice: values.originalVoice,
        originalSpeed: values.originalSpeed,
        originalFormat: values.originalFormat,
        originalWithoutFilter: values.originalWithoutFilter,
      };
      await updateTTSGroupAPI(groupId, body);
      message.success("Cập nhật nhóm audio thành công!");
      onSuccess();
    } catch (e: unknown) {
      message.error("Cập nhật nhóm thất bại");
      logger.error("Update TTS group error:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Sửa nhóm Audio TTS"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={620}
      destroyOnClose
      confirmLoading={loadingGroup}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          originalSpeed: 1,
          originalFormat: 3,
          originalWithoutFilter: false,
        }}
      >
        <SectionLabel>Text &amp; giọng gốc (tiếng Việt)</SectionLabel>

        <Form.Item
          name="originalText"
          label="Nội dung gốc"
          rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
        >
          <TextArea rows={4} placeholder="Nội dung thuyết minh tiếng Việt..." disabled={loadingGroup} />
        </Form.Item>

        <Form.Item
          name="originalVoice"
          label="Giọng gốc"
          rules={[{ required: true, message: "Vui lòng chọn giọng" }]}
        >
          <Select
            placeholder="Chọn giọng đọc"
            loading={loadingVoices}
            disabled={loadingVoices || loadingGroup || voices.length === 0}
          >
            {voices.map((voice) => (
              <Select.Option key={voice.code} value={voice.code}>
                {voice.name} — {voice.description}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="originalSpeed" label="Tốc độ gốc">
          <Slider
            min={0.8}
            max={1.2}
            step={0.1}
            marks={{ 0.8: "Chậm", 1.0: "Bình thường", 1.2: "Nhanh" }}
            disabled={loadingGroup}
          />
        </Form.Item>

        <Form.Item name="originalFormat" label="Định dạng gốc">
          <Select disabled={loadingGroup}>
            <Select.Option value={2}>WAV</Select.Option>
            <Select.Option value={3}>MP3</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="originalWithoutFilter" label="Bộ lọc giọng" valuePropName="checked">
          <Switch checkedChildren="Bật" unCheckedChildren="Tắt" disabled={loadingGroup} />
        </Form.Item>

        <SectionLabel>Thông tin món / POI</SectionLabel>

        <Form.Item name="foodName" label="Tên món / gian hàng">
          <Input placeholder="Ví dụ: Phở béo" disabled={loadingGroup} />
        </Form.Item>

        <Form.Item name="price" label="Giá tham khảo (VNĐ)">
          <InputNumber style={{ width: "100%" }} min={0} step={1000} disabled={loadingGroup} />
        </Form.Item>

        <Form.Item name="description" label="Mô tả">
          <TextArea rows={3} disabled={loadingGroup} />
        </Form.Item>

        <Form.Item name="imageUrl" label="Ảnh minh họa">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Upload beforeUpload={handleImageUpload} showUploadList={false} accept="image/*">
              <Button icon={<UploadOutlined />} loading={uploadingImage} disabled={loadingGroup}>
                Upload ảnh
              </Button>
            </Upload>
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8, objectFit: "cover" }}
              />
            )}
          </Space>
        </Form.Item>

        <SectionLabel>Vị trí &amp; geofence</SectionLabel>

        <Form.Item label="Tọa độ" style={{ marginBottom: 0 }}>
          <Space.Compact style={{ width: "100%" }}>
            <Form.Item name="latitude" noStyle>
              <InputNumber style={{ width: "50%" }} placeholder="Latitude" min={-90} max={90} disabled={loadingGroup} />
            </Form.Item>
            <Form.Item name="longitude" noStyle>
              <InputNumber
                style={{ width: "50%" }}
                placeholder="Longitude"
                min={-180}
                max={180}
                disabled={loadingGroup}
              />
            </Form.Item>
          </Space.Compact>
        </Form.Item>

        <Form.Item name="triggerRadiusMeters" label="Bán kính kích hoạt (m)">
          <InputNumber style={{ width: "100%" }} min={10} step={10} disabled={loadingGroup} />
        </Form.Item>

        <Form.Item name="accuracy" label="Accuracy GPS (m)">
          <InputNumber style={{ width: "100%" }} min={1} step={1} disabled={loadingGroup} />
        </Form.Item>

        <Form.Item name="priority" label="Độ ưu tiên">
          <InputNumber style={{ width: "100%" }} min={0} step={1} disabled={loadingGroup} />
        </Form.Item>

        <Form.Item style={{ marginTop: 16 }}>
          <Space>
            <Button type="primary" htmlType="submit" loading={saving} disabled={loadingGroup}>
              Lưu nhóm
            </Button>
            <Button onClick={onCancel} disabled={saving}>
              Hủy
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditTTSAudioGroupModal;
