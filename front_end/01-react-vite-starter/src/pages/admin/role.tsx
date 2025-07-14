import Restricted from "@/components/common/restricted";
import { useCurrentApp } from "@/components/context/app.context";
import {
  createRoleAPI,
  deleteRoleAPI,
  fetchPermissionsAPI,
  updateRoleAPI,
} from "@/services/api";
import axios from "@/services/axios.customize";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import ProTable from "@ant-design/pro-table";
import {
  Button,
  Checkbox,
  Divider,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Space,
  Switch,
} from "antd";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

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

const RolePage = () => {
  const { user } = useCurrentApp();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [permissions, setPermissions] = useState<IPermission[]>([]);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const actionRef = useRef<any>();

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const response = await fetchPermissionsAPI();
      if (response.data?.data) {
        setPermissions(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      hideInSearch: true,
    },
    {
      title: "Tên vai trò",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      hideInSearch: true,
    },

    {
      title: "Số quyền",
      key: "permissionCount",
      hideInSearch: true,
      render: (_: any, record: IRoleData) => record.permissions?.length || 0,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      hideInSearch: true,
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Trạng thái",
      dataIndex: "active",
      key: "active",
      hideInSearch: true,
      render: (active: boolean) => (
        <span style={{ color: active ? "green" : "red" }}>
          {active ? "Hoạt động" : "Không hoạt động"}
        </span>
      ),
    },

    {
      title: "Thao tác",
      key: "action",
      hideInSearch: true,
      render: (_: any, record: any) => (
        <Space>
          <Restricted permission="/api/v1/roles/{id}" method="PUT">
            <Button
              style={{
                backgroundColor: "rgb(255 200 53)",
                borderColor: "rgb(255 200 53)",
                color: "white",
              }}
              type="primary"
              size="small"
              onClick={() => handleEdit(record)}
            >
              <EditOutlined />
            </Button>
          </Restricted>
          <Restricted permission="/api/v1/roles/{id}" method="DELETE">
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa vai trò này?"
              onConfirm={() => handleDelete(record.id)}
              okText="Có"
              cancelText="Không"
            >
              <Button type="primary" danger size="small">
                <DeleteOutlined />
              </Button>
            </Popconfirm>
          </Restricted>
        </Space>
      ),
    },
  ];

  const handleCreateRole = async (values: any) => {
    try {
      const roleData = {
        name: values.name,
        description: values.description,
        active: values.active,
        permissions: values.permissions?.map((id: number) => ({ id })) || [],
      };
      await createRoleAPI(roleData);
      message.success("Tạo vai trò thành công!");
      setIsModalOpen(false);
      form.resetFields();
      actionRef.current?.reload();
      return true;
    } catch (error: any) {
      message.error(error.message || "Tạo vai trò thất bại!");
      return false;
    }
  };

  const handleEdit = (role: any) => {
    setEditingRole(role);
    editForm.setFieldsValue({
      name: role.name,
      description: role.description,
      active: role.active,
      permissions: role.permissions?.map((p: IPermission) => p.id) || [],
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateRole = async (values: any) => {
    try {
      const roleData = {
        name: values.name,
        description: values.description,
        active: values.active,
        permissions: values.permissions?.map((id: number) => ({ id })) || [],
      };
      await updateRoleAPI(editingRole.id, roleData);
      message.success("Cập nhật vai trò thành công!");
      setIsEditModalOpen(false);
      setEditingRole(null);
      editForm.resetFields();
      actionRef.current?.reload();
    } catch (error: any) {
      message.error(error.message || "Cập nhật vai trò thất bại!");
    }
  };

  const handleDelete = async (roleId: number) => {
    try {
      await deleteRoleAPI(roleId);
      message.success("Xóa vai trò thành công!");
      actionRef.current?.reload();
    } catch (error: any) {
      message.error("Xóa vai trò thất bại!");
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <ProTable<IRoleData>
        actionRef={actionRef}
        columns={columns as any}
        request={async (params) => {
          try {
            const filters: string[] = [];

            if (params.name) {
              filters.push(`name~'${params.name}'`);
            }

            const requestParams = {
              page: params.current,
              size: params.pageSize,
              filter: filters,
            };

            const res = await axios.get("/api/v1/roles/fetch-all", {
              params: requestParams,
              paramsSerializer: (params) => {
                const query = new URLSearchParams();
                query.append("page", params.page);
                query.append("size", params.size);
                params.filter?.forEach((f: any) => query.append("filter", f));
                return query.toString();
              },
            });

            if (res && res.data) {
              const resultData = res.data.result || [];
              const totalCount = res.data.meta?.total || 0;

              return {
                data: resultData,
                total: totalCount,
                success: true,
              };
            }

            return {
              data: [],
              total: 0,
              success: false,
            };
          } catch (error) {
            console.error("Roles API error:", error);
            return {
              data: [],
              total: 0,
              success: false,
            };
          }
        }}
        rowKey="id"
        pagination={{
          showSizeChanger: true,
        }}
        search={{
          labelWidth: 120,
          defaultCollapsed: false,
          searchText: "Tìm kiếm",
          resetText: "Làm mới",
        }}
        toolBarRender={() => [
          <Restricted key="create" permission="/api/v1/roles/create">
            <Button type="primary" onClick={() => setIsModalOpen(true)}>
              Thêm vai trò
            </Button>
          </Restricted>,
        ]}
      />

      {/* Create Role Modal */}
      <Modal
        title="Tạo vai trò mới"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateRole}>
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
          <Form.Item
            name="active"
            label="Trạng thái"
            valuePropName="checked"
            initialValue={true}
          >
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
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        title="Sửa vai trò"
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingRole(null);
          editForm.resetFields();
        }}
        onOk={() => editForm.submit()}
        width={600}
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdateRole}>
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
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RolePage;
