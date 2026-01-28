import { fetchAllPermissionsAPI, updateRoleAPI } from "@/api";
import { logger } from "@/utils/logger";
import { Checkbox, Divider, Form, Input, message, Modal, Switch } from "antd";
import { useEffect, useState } from "react";

interface IPermission {
  id: number;
  name: string;
  apiPath: string;
  method: string;
  module: string;
}

interface IRoleData {
  id: number;
  name: string;
  description: string;
  active: boolean;
  createdAt: string;
  permissions: IPermission[];
}

interface EditRoleModalProps {
  open: boolean;
  editingRole: IRoleData | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const EditRoleModal = ({
  open,
  editingRole,
  onCancel,
  onSuccess,
}: EditRoleModalProps) => {
  const [permissions, setPermissions] = useState<IPermission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      fetchPermissions();
    }
  }, [open]);

  useEffect(() => {
    if (editingRole && open) {
      form.setFieldsValue({
        name: editingRole.name,
        description: editingRole.description,
        active: editingRole.active,
        permissions:
          editingRole.permissions?.map((p: IPermission) => p.id) || [],
      });
    }
  }, [editingRole, open, form]);

  const fetchPermissions = async () => {
    setLoadingPermissions(true);
    try {
      const response = await fetchAllPermissionsAPI();
      const permissionsData =
        response.data?.data?.result || response.data?.result || [];
      if (Array.isArray(permissionsData)) {
        setPermissions(permissionsData);
      } else {
        logger.error("Permissions data is not an array:", permissionsData);
        message.error("Không thể tải danh sách quyền!");
      }
    } catch (error: any) {
      logger.error("Error fetching permissions:", error);
      message.error("Lỗi khi tải danh sách quyền!");
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleUpdateRole = async (values: any) => {
    if (!editingRole) return;

    try {
      const roleData = {
        name: values.name,
        description: values.description,
        active: values.active ?? true,
        permissionIds: values.permissions || [],
      };
      await updateRoleAPI(editingRole.id, roleData);
      message.success("Cập nhật vai trò thành công!");
 
      onCancel();
      form.resetFields();
      onSuccess();
    } catch (error: any) {
      message.error(error.message || "Cập nhật vai trò thất bại!");
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="Sửa vai trò"
      open={open}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      width={600}
    >
      <Form form={form} layout="vertical" onFinish={handleUpdateRole}>
        <Form.Item
          name="name"
          label="Tên vai trò"
          rules={[{ required: true, message: "Vui lòng nhập tên vai trò!" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="description"
          label="Mô tả"
          rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}
        >
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="active" label="Trạng thái" valuePropName="checked">
          <Switch
            checkedChildren="Hoạt động"
            unCheckedChildren="Không hoạt động"
          />
        </Form.Item>
        <Divider>Quyền hạn</Divider>
        <Form.Item
          name="permissions"
          label="Chọn quyền"
          rules={[
            { required: true, message: "Vui lòng chọn ít nhất một quyền!" },
          ]}
        >
          {loadingPermissions ? (
            <div>Đang tải danh sách quyền...</div>
          ) : permissions.length === 0 ? (
            <div>Không có quyền nào được tải!</div>
          ) : (
            <Checkbox.Group style={{ width: "100%" }}>
              {permissions.map((permission) => (
                <div key={permission.id} style={{ marginBottom: 8 }}>
                  <Checkbox value={permission.id}>
                    <div>
                      <div style={{ fontWeight: "bold" }}>
                        {permission.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        {permission.method} {permission.apiPath}
                      </div>
                    </div>
                  </Checkbox>
                </div>
              ))}
            </Checkbox.Group>
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditRoleModal;
