import {
  getAudioGroupByIdAPI,
  getVoicesAPI,
  updateTTSGroupAPI,
  type TTSAudioGroup,
  type UpdateTTSAudioGroupRequest,
  type Voice,
} from "@/api/tts.api";
import { logger } from "@/utils/logger";
import { Button, Form, Input, Modal, Select, Slider, Space, Switch, message } from "antd";
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
          originalText: group.originalText,
          originalVoice: group.originalVoice,
          originalSpeed: group.originalSpeed ?? 1,
          originalFormat: group.originalFormat ?? 3,
          originalWithoutFilter: group.originalWithoutFilter ?? false,
        });
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

  const handleSubmit = async (values: UpdateTTSAudioGroupRequest & { originalWithoutFilter?: boolean }) => {
    if (!groupId) return;
    try {
      setSaving(true);
      const body: UpdateTTSAudioGroupRequest = {
        originalText: values.originalText,
        originalVoice: values.originalVoice,
        originalSpeed: values.originalSpeed,
        originalFormat: values.originalFormat,
        originalWithoutFilter: values.originalWithoutFilter,
      };
      await updateTTSGroupAPI(groupId, body);
      message.success(
        "Đã lưu. Nếu bạn đổi nội dung hoặc giọng/tốc độ, hệ thống đã tổng hợp lại file audio (có thể mất vài giây)."
      );
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

        <p style={{ color: "#64748b", fontSize: 12, marginTop: 8 }}>
          Thông tin ẩm thực (tên món, giá, mô tả, ảnh) nằm ở <strong>POI liên kết</strong> — chỉnh sửa tại trang{" "}
          <strong>Quản lý POI</strong>.
        </p>

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
