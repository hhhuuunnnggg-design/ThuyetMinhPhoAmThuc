import { deleteRoleAPI } from "@/api";
import axios from "@/api/axios";
import Restricted from "@/components/common/restricted";
import { logger } from "@/utils/logger";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import ProTable from "@ant-design/pro-table";
import { Button, message, Popconfirm, Space } from "antd";
import { useRef, useState } from "react";
import AddRoleModal from "./AddRoleModal";
import EditRoleModal from "./EditRoleModel";

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
  //const { user } = useCurrentApp();
  //const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<IRoleData | null>(null);
  const actionRef = useRef<any>();

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
      render: (_: any, record: IRoleData) => (
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

  const handleEdit = (role: IRoleData) => {
    setEditingRole(role);
    setIsEditModalOpen(true);
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

  const handleModalSuccess = () => {
    actionRef.current?.reload();
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
            logger.error("Roles API error:", error);
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

      {/* Add Role Modal */}
      <AddRoleModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      {/* Edit Role Modal */}
      <EditRoleModal
        open={isEditModalOpen}
        editingRole={editingRole}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingRole(null);
        }}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default RolePage;
