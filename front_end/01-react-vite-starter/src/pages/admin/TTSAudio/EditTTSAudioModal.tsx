import {
  getVoicesAPI,
  updateTTSAudioAPI,
  uploadFoodImageAPI,
  type TTSAudio,
  type TTSRequest,
  type Voice,
} from "@/api/tts.api";
import { logger } from "@/utils/logger";
import { UploadOutlined } from "@ant-design/icons";
import { Button, Form, Input, InputNumber, Modal, Select, Slider, Space, Switch, Upload, message } from "antd";
import { useEffect, useState } from "react";

const { TextArea } = Input;

interface EditTTSAudioModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  audio: TTSAudio;
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: 6,
    marginBottom: 12,
    marginTop: 8,
  }}>{children}</div>
);

const EditTTSAudioModal = ({ open, onCancel, onSuccess, audio }: EditTTSAudioModalProps) => {
  const [form] = Form.useForm();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (open && audio) {
      fetchVoices();
      form.setFieldsValue({
        text: audio.text,
        voice: audio.voice,
        speed: audio.speed,
        ttsReturnOption: audio.format,
        withoutFilter: audio.withoutFilter,
        foodName: audio.foodName,
        price: audio.price,
        description: audio.description,
        imageUrl: audio.imageUrl,
        latitude: audio.latitude,
        longitude: audio.longitude,
        accuracy: audio.accuracy,
        triggerRadiusMeters: audio.triggerRadiusMeters,
        priority: audio.priority,
      });
      setImagePreview(audio.imageUrl ?? null);
    }
  }, [open, audio, form]);

  const fetchVoices = async () => {
    try {
      setLoadingVoices(true);
      const response = await getVoicesAPI();
      if (response?.data?.voices) {
        setVoices(response.data.voices);
      } else {
        message.warning("Không thể tải danh sách giọng đọc từ API");
      }
    } catch (error: any) {
      message.error("Không thể tải danh sách giọng đọc");
      logger.error("Fetch voices error:", error);
    } finally {
      setLoadingVoices(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const response = await uploadFoodImageAPI(audio.id, file);
      if (response?.data?.imageUrl) {
        form.setFieldsValue({ imageUrl: response.data.imageUrl });
        setImagePreview(response.data.imageUrl ?? null);
        message.success("Upload ảnh thành công!");
      }
    } catch (error: any) {
      message.error("Upload ảnh thất bại");
      logger.error("Upload image error:", error);
    } finally {
      setUploadingImage(false);
    }
    return false;
  };

  const handleSubmit = async (values: TTSRequest) => {
    try {
      await updateTTSAudioAPI(audio.id, values);
      message.success("Cập nhật audio thành công!");
      onSuccess();
    } catch (error: any) {
      message.error("Cập nhật audio thất bại: " + (error?.message || "Lỗi không xác định"));
      logger.error("Update TTS audio error:", error);
    }
  };

  return (
    <Modal
      title="Chỉnh sửa TTS Audio"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={620}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ speed: 1.0, ttsReturnOption: 3, withoutFilter: false }}
      >
        <SectionLabel>Cài đặt TTS</SectionLabel>

        <Form.Item
          name="text"
          label="Nội dung text"
          rules={[{ required: true, message: "Vui lòng nhập text" }]}
        >
          <TextArea rows={4} placeholder="Nhập nội dung text..." />
        </Form.Item>

        <Form.Item
          name="voice"
          label="Giọng đọc"
          rules={[{ required: true, message: "Vui lòng chọn giọng đọc" }]}
        >
          <Select
            placeholder="Chọn giọng đọc"
            loading={loadingVoices}
            disabled={loadingVoices || voices.length === 0}
          >
            {voices.map((voice) => (
              <Select.Option key={voice.code} value={voice.code}>
                {voice.name} - {voice.description} ({voice.location})
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="speed" label="Tốc độ">
          <Slider min={0.8} max={1.2} step={0.1} marks={{ 0.8: "Chậm", 1.0: "Bình thường", 1.2: "Nhanh" }} />
        </Form.Item>

        <Form.Item name="ttsReturnOption" label="Định dạng">
          <Select>
            <Select.Option value={2}>WAV</Select.Option>
            <Select.Option value={3}>MP3</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="withoutFilter"
          label="Bộ lọc giọng nói"
          valuePropName="checked"
          tooltip="Bật để giọng đọc tự nhiên hơn, tắt để giữ nguyên tín hiệu gốc"
        >
          <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
        </Form.Item>

        <SectionLabel>Thông tin món ăn</SectionLabel>

        <Form.Item
          name="foodName"
          label="Tên món / gian hàng"
          rules={[{ required: true, message: "Vui lòng nhập tên món hoặc gian hàng" }]}
        >
          <Input placeholder="Ví dụ: Bánh Xèo Cô Ba" />
        </Form.Item>

        <Form.Item name="price" label="Giá tham khảo (VNĐ)">
          <InputNumber style={{ width: "100%" }} min={0} step={1000} />
        </Form.Item>

        <Form.Item name="description" label="Mô tả món ăn / nội dung thuyết minh">
          <TextArea rows={3} placeholder="Lịch sử, cách chế biến, điểm đặc biệt của món..." />
        </Form.Item>

        <Form.Item name="imageUrl" label="Ảnh minh họa">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Upload
              beforeUpload={handleImageUpload}
              showUploadList={false}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />} loading={uploadingImage}>
                {uploadingImage ? "Đang upload..." : "Upload ảnh lên S3"}
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

        <SectionLabel>Vị trí GPS (tùy chọn, dùng cho auto-guide)</SectionLabel>

        <Form.Item label="Tọa độ" style={{ marginBottom: 0 }}>
          <Space.Compact style={{ width: "100%" }}>
            <Form.Item name="latitude" noStyle>
              <InputNumber style={{ width: "50%" }} placeholder="Latitude" min={-90} max={90} />
            </Form.Item>
            <Form.Item name="longitude" noStyle>
              <InputNumber style={{ width: "50%" }} placeholder="Longitude" min={-180} max={180} />
            </Form.Item>
          </Space.Compact>
        </Form.Item>

        <Form.Item
          name="triggerRadiusMeters"
          label="Bán kính kích hoạt (m)"
          tooltip="Khoảng cách tối đa để kích hoạt thuyết minh tự động"
        >
          <InputNumber style={{ width: "100%" }} min={10} step={10} placeholder="Ví dụ: 50" />
        </Form.Item>

        <Form.Item name="accuracy" label="Accuracy GPS (m)">
          <InputNumber style={{ width: "100%" }} min={1} step={1} placeholder="Ví dụ: 10" />
        </Form.Item>

        <Form.Item
          name="priority"
          label="Độ ưu tiên"
          tooltip="Số càng cao = ưu tiên càng cao khi có nhiều POI trong cùng bán kính"
        >
          <InputNumber style={{ width: "100%" }} min={0} step={1} placeholder="Ví dụ: 10" />
        </Form.Item>

        <Form.Item style={{ marginTop: 16 }}>
          <Space>
            <Button type="primary" htmlType="submit">
              Cập nhật
            </Button>
            <Button onClick={onCancel}>Hủy</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditTTSAudioModal;
