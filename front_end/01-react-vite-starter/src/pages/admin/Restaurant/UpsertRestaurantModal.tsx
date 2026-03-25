import {
  createAdminRestaurantAPI,
  getAdminRestaurantByIdAPI,
  unwrapAdminRestaurant,
  updateAdminRestaurantAPI,
  type UpsertRestaurantRequest,
} from "@/api/adminRestaurant.api";
import { logger } from "@/utils/logger";
import { Form, Input, InputNumber, Modal, Select, Slider, message } from "antd";
import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  editingId: number | null;
};

const UpsertRestaurantModal = ({ open, onCancel, onSuccess, editingId }: Props) => {
  const [form] = Form.useForm<UpsertRestaurantRequest>();
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
        const raw: any = await getAdminRestaurantByIdAPI(editingId);
        const r = unwrapAdminRestaurant(raw);
        if (!r) {
          message.error("Không đọc được dữ liệu nhà hàng");
          return;
        }
        form.setFieldsValue({
          ownerName: r.ownerName ?? "",
          ownerEmail: r.ownerEmail ?? "",
          ownerPhone: r.ownerPhone ?? "",
          payosClientId: r.payosClientId ?? "",
          payosApiKey: r.payosApiKey ?? "",
          payosChecksumKey: r.payosChecksumKey ?? "",
          bankAccount: r.bankAccount ?? "",
          bankName: r.bankName ?? "",
          commissionRate: r.commissionRate != null ? r.commissionRate * 100 : 5,
        });
      } catch (e: any) {
        message.error(e?.message || "Không tải được nhà hàng");
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

      const body: UpsertRestaurantRequest = {
        ownerName: values.ownerName?.trim(),
        ownerEmail: values.ownerEmail?.trim() || undefined,
        ownerPhone: values.ownerPhone?.trim() || undefined,
        payosClientId: values.payosClientId?.trim() || undefined,
        payosApiKey: values.payosApiKey?.trim() || undefined,
        payosChecksumKey: values.payosChecksumKey?.trim() || undefined,
        bankAccount: values.bankAccount?.trim() || undefined,
        bankName: values.bankName?.trim() || undefined,
        commissionRate:
          values.commissionRate != null ? values.commissionRate / 100 : undefined,
      };

      if (isEdit) {
        await updateAdminRestaurantAPI(editingId!, body);
        message.success("Cập nhật nhà hàng thành công");
      } else {
        await createAdminRestaurantAPI(body);
        message.success("Tạo nhà hàng thành công");
      }
      onSuccess();
      onCancel();
      form.resetFields();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.message || "Thao tác thất bại");
      logger.error("Upsert restaurant error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? "Sửa nhà hàng" : "Tạo nhà hàng mới"}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      destroyOnClose
      width={600}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
        <Form.Item
          name="ownerName"
          label="Tên chủ quán"
          rules={[{ required: true, message: "Nhập tên chủ quán" }]}
        >
          <Input placeholder="VD: Nguyễn Văn A" />
        </Form.Item>

        <Form.Item name="ownerEmail" label="Email liên hệ">
          <Input placeholder="email@domain.com" type="email" />
        </Form.Item>

        <Form.Item name="ownerPhone" label="Số điện thoại">
          <Input placeholder="0xxx xxx xxx" />
        </Form.Item>

        <Form.Item
          name="commissionRate"
          label={`Hoa hồng nền tảng (mặc định 5%)`}
          extra="Kéo thanh trượt hoặc nhập số trực tiếp"
        >
          <Slider
            min={0}
            max={100}
            marks={{ 0: "0%", 5: "5%", 10: "10%", 30: "30%", 50: "50%", 100: "100%" }}
            tooltip={{ formatter: (v) => `${v}%` }}
          />
        </Form.Item>

        <Form.Item label="PayOS" style={{ marginBottom: 4 }}>
          <span style={{ color: "#64748b", fontSize: 12 }}>Cấu hình thanh toán PayOS</span>
        </Form.Item>

        <Form.Item name="payosClientId" label="Client ID" style={{ marginBottom: 8 }}>
          <Input placeholder="PayOS Client ID" />
        </Form.Item>

        <Form.Item name="payosApiKey" label="API Key" style={{ marginBottom: 8 }}>
          <Input.Password placeholder="PayOS API Key" />
        </Form.Item>

        <Form.Item name="payosChecksumKey" label="Checksum Key" style={{ marginBottom: 8 }}>
          <Input.Password placeholder="PayOS Checksum Key" />
        </Form.Item>

        <Form.Item label="Thông tin ngân hàng" style={{ marginBottom: 4 }}>
          <span style={{ color: "#64748b", fontSize: 12 }}>Tài khoản nhận thanh toán</span>
        </Form.Item>

        <Form.Item name="bankAccount" label="Số tài khoản" style={{ marginBottom: 8 }}>
          <Input placeholder="Số tài khoản" />
        </Form.Item>

        <Form.Item name="bankName" label="Tên ngân hàng" style={{ marginBottom: 0 }}>
          <Select
            allowClear
            showSearch
            placeholder="Chọn ngân hàng"
            options={[
              { label: "Vietcombank", value: "Vietcombank" },
              { label: "VietinBank", value: "VietinBank" },
              { label: "BIDV", value: "BIDV" },
              { label: "Agribank", value: "Agribank" },
              { label: "MB Bank", value: "MB Bank" },
              { label: "TPBank", value: "TPBank" },
              { label: "VPBank", value: "VPBank" },
              { label: "ACB", value: "ACB" },
              { label: "Sacombank", value: "Sacombank" },
              { label: "Shinhan Bank", value: "Shinhan Bank" },
              { label: "Techcombank", value: "Techcombank" },
              { label: "OCB", value: "OCB" },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpsertRestaurantModal;
