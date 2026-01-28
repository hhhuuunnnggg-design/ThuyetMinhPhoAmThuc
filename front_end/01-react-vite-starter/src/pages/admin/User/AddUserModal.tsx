import { adminCreateUserAPI, fetchAllRolesAPI } from "@/api";
import { logger } from "@/utils/logger";
import { Form, Input, message, Modal, Select } from "antd";
import { useEffect, useState } from "react";

interface IRole {
  id: number;
  name: string;
  description: string;
  active: boolean;
}

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddUserModal = ({ isOpen, onClose, onSuccess }: AddUserModalProps) => {
  const [form] = Form.useForm();
  const [roles, setRoles] = useState<IRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchRoles();
    }
  }, [isOpen]);

  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const response = await fetchAllRolesAPI();
      const rolesData =
        response.data?.data?.result || response.data?.result || [];
      if (Array.isArray(rolesData)) {
        // Chỉ lấy các role đang active
        setRoles(rolesData.filter((role: IRole) => role.active));
      }
    } catch (error: any) {
      logger.error("Error fetching roles:", error);
      message.error("Lỗi khi tải danh sách vai trò!");
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleCreateUser = async (values: any) => {
    try {
      const userData = {
        email: values.email,
        password: values.password,
        roleId: values.roleId || undefined,
      };
      await adminCreateUserAPI(userData);
      message.success("Tạo người dùng thành công!");
      onClose();
      form.resetFields();
      onSuccess();
      return true;
    } catch (error: any) {
      message.error(error.message || "Tạo người dùng thất bại!");
      return false;
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Tạo người dùng mới"
      open={isOpen}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      okText="Tạo"
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical" onFinish={handleCreateUser}>
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Vui lòng nhập email!" },
            { type: "email", message: "Email không hợp lệ!" },
          ]}
        >
          <Input placeholder="Nhập email..." />
        </Form.Item>

        <Form.Item
          name="password"
          label="Mật khẩu"
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu!" },
            { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
          ]}
        >
          <Input.Password placeholder="Nhập mật khẩu..." />
        </Form.Item>

        <Form.Item
          name="firstName"
          label="Họ"
          rules={[{ required: true, message: "Vui lòng nhập họ!" }]}
        >
          <Input placeholder="Nhập họ..." />
        </Form.Item>

        <Form.Item
          name="lastName"
          label="Tên"
          rules={[{ required: true, message: "Vui lòng nhập tên!" }]}
        >
          <Input placeholder="Nhập tên..." />
        </Form.Item>

        <Form.Item
          name="roleId"
          label="Vai trò"
          rules={[{ required: false }]}
        >
          <Select
            placeholder="Chọn vai trò (tùy chọn)..."
            allowClear
            loading={loadingRoles}
          >
            {roles.map((role) => (
              <Select.Option key={role.id} value={role.id}>
                {role.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddUserModal;
