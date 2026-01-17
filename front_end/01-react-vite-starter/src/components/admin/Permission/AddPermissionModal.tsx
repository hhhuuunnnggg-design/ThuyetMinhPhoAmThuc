import { createPermissionAPI, fetchAllMethod } from "@/api";
import { logger } from "@/utils/logger";
import { Form, Input, message, Modal, Select } from "antd";
import { useEffect, useState } from "react";

interface AddPermissionModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const AddPermissionModal = ({
  open,
  onCancel,
  onSuccess,
}: AddPermissionModalProps) => {
  const [form] = Form.useForm();
  const [methodOptions, setMethodOptions] = useState<
    { label: string; value: string }[]
  >([]);

  useEffect(() => {
    if (open) {
      fetchMethodOptions();
    }
  }, [open]);

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
      logger.error("Error fetching method options:", error);
    }
  };

  const handleCreatePermission = async (values: any) => {
    try {
      await createPermissionAPI(values);
      message.success("Tạo quyền thành công!");
      onCancel();
      form.resetFields();
      onSuccess();
      return true;
    } catch (error: any) {
      message.error(error.message || "Tạo quyền thất bại!");
      return false;
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="Tạo quyền mới"
      open={open}
      onCancel={handleCancel}
      onOk={() => form.submit()}
    >
      <Form form={form} layout="vertical" onFinish={handleCreatePermission}>
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

export default AddPermissionModal;
