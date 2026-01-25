import { updateTTSAudioAPI, type TTSAudio, type TTSRequest } from "@/api/tts.api";
import { logger } from "@/utils/logger";
import { Button, Form, Input, message, Modal, Select, Slider, Space } from "antd";
import { useEffect } from "react";

const { TextArea } = Input;
const { Option } = Select;

interface EditTTSAudioModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  audio: TTSAudio;
}

const EditTTSAudioModal = ({ open, onCancel, onSuccess, audio }: EditTTSAudioModalProps) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && audio) {
      form.setFieldsValue({
        text: audio.text,
        voice: audio.voice,
        speed: audio.speed,
        ttsReturnOption: audio.format,
        withoutFilter: audio.withoutFilter,
      });
    }
  }, [open, audio, form]);

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
          <Select placeholder="Chọn giọng đọc">
            <Option value="hn-quynhanh">Quỳnh Anh - Nữ miền Bắc</Option>
            <Option value="hcm-diemmy">Diễm My - Nữ miền Nam</Option>
            <Option value="hue-maingoc">Mai Ngọc - Nữ miền Trung</Option>
            <Option value="hn-thanhtung">Thanh Tùng - Nam miền Bắc</Option>
            <Option value="hcm-minhquan">Minh Quân - Nam miền Nam</Option>
            <Option value="hue-baoquoc">Bảo Quốc - Nam miền Trung</Option>
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
