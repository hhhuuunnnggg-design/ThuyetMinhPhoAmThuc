import { fetchAllMethod, updatePermissionAPI } from "@/services/api";
import { Form, Input, message, Modal, Select } from "antd";
import { useEffect, useState } from "react";

interface IPermission {
  id: number;
  name: string;
  apiPath: string;
  method: string;
  module: string;
  createdAt: string;
}

interface EditPermissionModalProps {
  open: boolean;
  editingPermission: IPermission | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const EditPermissionModal = ({
  open,
  editingPermission,
  onCancel,
  onSuccess,
}: EditPermissionModalProps) => {
  const [form] = Form.useForm();
  const [methodOptions, setMethodOptions] = useState<
    { label: string; value: string }[]
  >([]);

  useEffect(() => {
    if (open) {
      fetchMethodOptions();
    }
  }, [open]);

  useEffect(() => {
    if (editingPermission && open) {
      form.setFieldsValue({
        name: editingPermission.name,
        apiPath: editingPermission.apiPath,
        method: editingPermission.method,
        module: editingPermission.module,
      });
    }
  }, [editingPermission, open, form]);

  const fetchMethodOptions = async () => {
    try {
      const res = await fetchAllMethod();
      const resultData = res.data.data?.result || res.data.result || [];
      // Extract unique methods and update methodOptions
      const uniqueMethods = Array.from(
        new Set(resultData.map((item: any) => item.method))
      ) as string[];
      const newMethodOptions = uniqueMethods.map((method: string) => ({
        label: method,
        value: method,
      }));
      setMethodOptions(newMethodOptions);
    } catch (error) {
      console.error("Error fetching method options:", error);
    }
  };

  const handleUpdatePermission = async (values: any) => {
    if (!editingPermission) return;

    try {
      await updatePermissionAPI(editingPermission.id, values);
      message.success("Cập nhật quyền thành công!");
      onCancel();
      form.resetFields();
      onSuccess();
    } catch (error: any) {
      message.error(error.message || "Cập nhật quyền thất bại!");
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="Sửa quyền"
      open={open}
      onCancel={handleCancel}
      onOk={() => form.submit()}
    >
      <Form form={form} layout="vertical" onFinish={handleUpdatePermission}>
        <Form.Item
          name="name"
          label="Tên quyền"
          rules={[{ required: true, message: "Vui lòng nhập tên quyền!" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="apiPath"
          label="API Path"
          rules={[{ required: true, message: "Vui lòng nhập API Path!" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="method"
          label="Method"
          rules={[{ required: true, message: "Vui lòng chọn method!" }]}
        >
          <Select options={methodOptions} />
        </Form.Item>
        <Form.Item
          name="module"
          label="Module"
          rules={[{ required: true, message: "Vui lòng nhập module!" }]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditPermissionModal;
