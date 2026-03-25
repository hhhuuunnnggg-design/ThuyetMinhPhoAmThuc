import {
  createTTSGroupAPI,
  getVoicesAPI,
  type TTSRequest,
  type Voice,
} from "@/api/tts.api";
import { fetchAdminPOIsAPI, parseAdminPOIListResponse } from "@/api/adminPoi.api";
import { logger } from "@/utils/logger";
import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  Slider,
  Space,
  Switch,
  message,
} from "antd";
import { useEffect, useState } from "react";

const { TextArea } = Input;

interface CreateTTSAudioModalProps {
  open: boolean;
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

const CreateTTSAudioModal = ({ open, onCancel, onSuccess }: CreateTTSAudioModalProps) => {
  const [form] = Form.useForm();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [loadingPOIs, setLoadingPOIs] = useState(false);
  const [poiOptions, setPoiOptions] = useState<{ label: string; value: number }[]>([]);

  useEffect(() => {
    if (open) {
      fetchVoices();
      fetchPOIs();
      form.resetFields();
    }
  }, [open, form]);

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

  const fetchPOIs = async () => {
    try {
      setLoadingPOIs(true);
      const raw: any = await fetchAdminPOIsAPI(1, 500, "createdAt", "desc");
      const { data } = parseAdminPOIListResponse(raw);
      setPoiOptions(
        data.map((p) => ({
          value: p.id,
          label: `${p.id} — ${p.foodName || p.address || "POI"} ${
            p.latitude ? `(${p.latitude.toFixed(4)}, ${p.longitude?.toFixed(4)})` : ""
          }`,
        }))
      );
    } catch (error: any) {
      logger.error("Fetch POIs error:", error);
    } finally {
      setLoadingPOIs(false);
    }
  };

  const handleSubmit = async (values: TTSRequest) => {
    try {
      setLoading(true);
      await createTTSGroupAPI(values);
      message.success("Tạo nhóm audio thành công!");
      onSuccess();
    } catch (error: any) {
      message.error(
        "Tạo nhóm audio thất bại: " + (error?.message || "Lỗi không xác định")
      );
      logger.error("Create TTS group error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Tạo nhóm TTS Audio"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={620}
      destroyOnClose
    >
      <p style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>
        Nhóm audio gắn với một <strong>POI đã tạo</strong>. Thông tin ẩm thực (tên món, giá, mô tả, ảnh) nằm ở{" "}
        <strong>POI</strong>.
      </p>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ speed: 1.0, ttsReturnOption: 3, withoutFilter: false }}
      >
        {/* POI bắt buộc phải chọn trước */}
        <SectionLabel>POI liên kết</SectionLabel>

        <Form.Item
          name="poiId"
          label="Điểm kinh doanh"
          rules={[{ required: true, message: "Phải chọn POI trước" }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Chọn POI đã tạo ở Quản lý POI"
            loading={loadingPOIs}
            disabled={loadingPOIs}
            options={poiOptions}
          />
        </Form.Item>

        <SectionLabel>Cài đặt TTS</SectionLabel>

        <Form.Item
          name="text"
          label="Nội dung text gốc (tiếng Việt)"
          rules={[{ required: true, message: "Vui lòng nhập text" }]}
        >
          <TextArea rows={4} placeholder="Nhập nội dung thuyết minh tiếng Việt..." />
        </Form.Item>

        <Form.Item
          name="voice"
          label="Giọng đọc gốc"
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
          <Slider
            min={0.8}
            max={1.2}
            step={0.1}
            marks={{ 0.8: "Chậm", 1.0: "Bình thường", 1.2: "Nhanh" }}
          />
        </Form.Item>

        <Form.Item
          name="ttsReturnOption"
          label="Định dạng"
          tooltip="Chọn định dạng file audio đầu ra"
        >
          <Select>
            <Select.Option value={2}>WAV</Select.Option>
            <Select.Option value={3}>MP3</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="withoutFilter"
          label="Bộ lọc giọng nói"
          valuePropName="checked"
          tooltip="Bật để giọng đọc tự nhiên hơn (có bộ lọc nâng cao), tắt để giữ nguyên tín hiệu gốc"
        >
          <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
        </Form.Item>

        <Form.Item style={{ marginTop: 16 }}>
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
