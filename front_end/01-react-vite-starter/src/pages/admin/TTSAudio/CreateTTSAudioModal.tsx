import {
  getVoicesAPI,
  synthesizeAndSaveAPI,
  uploadFoodImageOnlyAPI,
  type TTSRequest,
  type Voice,
} from "@/api/tts.api";
import { logger } from "@/utils/logger";
import { UploadOutlined } from "@ant-design/icons";
import { Button, Form, Input, InputNumber, Modal, Select, Slider, Space, Upload, message } from "antd";
import { useEffect, useState } from "react";

const { TextArea } = Input;
const { Option } = Select;

interface CreateTTSAudioModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const CreateTTSAudioModal = ({ open, onCancel, onSuccess }: CreateTTSAudioModalProps) => {
  const [form] = Form.useForm();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchVoices();
      form.resetFields();
      setImagePreview(null);
    }
  }, [open, form]);

  const fetchVoices = async () => {
    try {
      setLoadingVoices(true);
      const response = await getVoicesAPI();
      // Response format: { statusCode, error, message, data: { voices: Voice[] } }
      if (response?.data?.voices) {
        setVoices(response.data.voices);
      } else {
        logger.warn("Invalid voices response format:", response);
        logger.warn("Invalid voices response format2:", response?.data?.voices);
        message.warning("Không thể tải danh sách giọng đọc từ API");
      }
    } catch (error: any) {
      logger.error("Fetch voices error:", error);
      message.error("Không thể tải danh sách giọng đọc: " + (error?.message || "Lỗi không xác định"));
    } finally {
      setLoadingVoices(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const response = await uploadFoodImageOnlyAPI(file);
      if (response?.data?.imageUrl) {
        form.setFieldsValue({ imageUrl: response.data.imageUrl });
        setImagePreview(response.data.imageUrl);
        message.success("Upload ảnh thành công!");
        return false; // Prevent default upload
      }
    } catch (error: any) {
      message.error("Upload ảnh thất bại: " + (error?.message || "Lỗi không xác định"));
      logger.error("Upload image error:", error);
    } finally {
      setUploadingImage(false);
    }
    return false;
  };

  const handleSubmit = async (values: TTSRequest) => {
    try {
      setLoading(true);
      await synthesizeAndSaveAPI(values);
      message.success("Tạo audio thành công!");
      onSuccess();
    } catch (error: any) {
      message.error("Tạo audio thất bại: " + (error?.message || "Lỗi không xác định"));
      logger.error("Create TTS audio error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Tạo mới TTS Audio"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          speed: 1.0,
          ttsReturnOption: 3,
          withoutFilter: false,
        }}
      >
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
          <Select placeholder="Chọn giọng đọc" loading={loadingVoices} disabled={loadingVoices || voices.length === 0}>
            {voices.map((voice) => (
              <Option key={voice.code} value={voice.code}>
                {voice.name} - {voice.description} ({voice.location})
              </Option>
            ))}
            {!loadingVoices && voices.length === 0 && (
              <Option value="" disabled>
                Không có giọng đọc nào
              </Option>
            )}
          </Select>
        </Form.Item>

        <Form.Item name="speed" label="Tốc độ">
          <Slider min={0.8} max={1.2} step={0.1} marks={{ 0.8: "Chậm", 1.0: "Bình thường", 1.2: "Nhanh" }} />
        </Form.Item>

        <Form.Item name="ttsReturnOption" label="Định dạng">
          <Select>
            <Option value={2}>WAV</Option>
            <Option value={3}>MP3</Option>
          </Select>
        </Form.Item>

        {/* Thông tin ẩm thực & GPS dùng cho Phố Ẩm Thực GPS */}
        <Form.Item
          label="Thông tin món ăn"
          style={{ marginBottom: 0, fontWeight: 500 }}
        />

        <Form.Item
          name="foodName"
          label="Tên món / gian hàng"
          rules={[{ required: true, message: "Vui lòng nhập tên món hoặc gian hàng" }]}
        >
          <Input placeholder="Ví dụ: Phở Gia Truyền Cụ Tặng" />
        </Form.Item>

        <Form.Item name="price" label="Giá tham khảo (VNĐ)">
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            step={1000}
            formatter={(value) => (value ? `${Number(value).toLocaleString("vi-VN")} ₫` : "")}
            parser={(value) => (value ? value.replace(/[^\d]/g, "") : "") as any}
          />
        </Form.Item>

        <Form.Item name="description" label="Mô tả món ăn / nội dung thuyết minh">
          <TextArea rows={3} placeholder="Lịch sử, cách chế biến, điểm đặc biệt của món..." />
        </Form.Item>

        <Form.Item name="imageUrl" label="Ảnh minh họa">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Upload
              beforeUpload={(file) => {
                handleImageUpload(file);
                return false; // Prevent default upload
              }}
              showUploadList={false}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />} loading={uploadingImage}>
                {uploadingImage ? "Đang upload..." : "Upload ảnh lên S3"}
              </Button>
            </Upload>
            {imagePreview && (
              <div style={{ marginTop: 8 }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8, objectFit: "cover" }}
                />
              </div>
            )}
          </Space>
        </Form.Item>

        <Form.Item
          label="Vị trí GPS (tùy chọn, dùng cho auto-guide)"
          style={{ marginBottom: 0, fontWeight: 500 }}
        />

        <Form.Item label="Tọa độ" style={{ marginBottom: 0 }}>
          <Space.Compact style={{ width: "100%" }}>
            <Form.Item name="latitude" noStyle>
              <InputNumber style={{ width: "50%" }} placeholder="Latitude" />
            </Form.Item>
            <Form.Item name="longitude" noStyle>
              <InputNumber style={{ width: "50%" }} placeholder="Longitude" />
            </Form.Item>
          </Space.Compact>
        </Form.Item>

        <Form.Item name="accuracy" label="Bán kính kích hoạt (mét)">
          <InputNumber style={{ width: "100%" }} min={10} step={10} placeholder="Ví dụ: 30" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              Tạo mới
            </Button>
            <Button onClick={onCancel}>Hủy</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateTTSAudioModal;
