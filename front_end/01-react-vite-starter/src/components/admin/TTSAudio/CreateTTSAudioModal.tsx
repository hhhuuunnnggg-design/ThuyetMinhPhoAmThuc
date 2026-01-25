import { getVoicesAPI, synthesizeAndSaveAPI, type TTSRequest, type Voice } from "@/api/tts.api";
import { logger } from "@/utils/logger";
import { Button, Form, Input, message, Modal, Select, Slider, Space } from "antd";
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

  useEffect(() => {
    if (open) {
      fetchVoices();
      form.resetFields();
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
        message.warning("Không thể tải danh sách giọng đọc từ API");
      }
    } catch (error: any) {
      logger.error("Fetch voices error:", error);
      message.error("Không thể tải danh sách giọng đọc: " + (error?.message || "Lỗi không xác định"));
    } finally {
      setLoadingVoices(false);
    }
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
