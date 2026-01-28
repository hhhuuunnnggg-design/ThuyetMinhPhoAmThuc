import { adminUpdateUserAPI, fetchAllRolesAPI } from "@/api";
import { logger } from "@/utils/logger";
import { Form, Input, message, Modal, Select } from "antd";
import { useEffect, useState } from "react";

interface IRole {
  id: number;
  name: string;
  description: string;
  active: boolean;
}

interface IUserData {
  id: number;
  email: string;
  fullname: string;
  gender: string;
  role: {
    id: number;
    name: string;
  };
  createdAt: string;
  avatar?: string;
  coverPhoto?: string;
  dateOfBirth?: string;
  work?: string;
  education?: string;
  currentCity?: string;
  hometown?: string;
  bio?: string;
  isBlocked: boolean;
  isAdmin: boolean;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingUser: IUserData | null;
}

const EditUserModal = ({
  isOpen,
  onClose,
  onSuccess,
  editingUser,
}: EditUserModalProps) => {
  const [editForm] = Form.useForm();
  const [roles, setRoles] = useState<IRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchRoles();
    }
  }, [isOpen]);

  useEffect(() => {
    if (editingUser && isOpen) {
      editForm.setFieldsValue({
        email: editingUser.email,
        roleId: editingUser.role?.id || undefined,
      });
    }
  }, [editingUser, isOpen, editForm]);

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

  const handleUpdateUser = async (values: any) => {
    if (!editingUser) return;

    try {
      const userData = {
        email: values.email,
        password: values.password || undefined,
        roleId: values.roleId || undefined,
      };
      await adminUpdateUserAPI(editingUser.id, userData);
      message.success("Cập nhật người dùng thành công!");
      onClose();
      editForm.resetFields();
      onSuccess();
    } catch (error: any) {
      message.error(error.message || "Cập nhật người dùng thất bại!");
    }
  };

  const handleCancel = () => {
    editForm.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Sửa người dùng"
      open={isOpen}
      onCancel={handleCancel}
      onOk={() => editForm.submit()}
      okText="Cập nhật"
      cancelText="Hủy"
    >
      <Form form={editForm} layout="vertical" onFinish={handleUpdateUser}>
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
          label="Mật khẩu mới"
          rules={[
            { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
          ]}
        >
          <Input.Password placeholder="Nhập mật khẩu mới (để trống nếu không đổi)..." />
        </Form.Item>

        <Form.Item
          name="roleId"
          label="Vai trò"
          rules={[{ required: false }]}
        >
          <Select
            placeholder="Chọn vai trò (để trống để xóa vai trò)..."
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

export default EditUserModal;
