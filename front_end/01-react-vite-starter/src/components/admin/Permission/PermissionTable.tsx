import { deletePermissionAPI, fetchAllMethod } from "@/services/api";
import axios from "@/services/axios.customize";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import ProTable from "@ant-design/pro-table";
import { Button, message, Popconfirm, Space } from "antd";
import { useRef, useState } from "react";
import AddPermissionModal from "./AddPermissionModal";
import EditPermissionModal from "./EditPermissionModal";

interface IPermission {
  id: number;
  name: string;
  apiPath: string;
  method: string;
  module: string;
  createdAt: string;
}

const PermissionPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] =
    useState<IPermission | null>(null);
  const actionRef = useRef<any>();
  const [methodOptions, setMethodOptions] = useState<
    { label: string; value: string }[]
  >([]);

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      hideInSearch: true,
    },
    {
      title: "Tên quyền",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "API Path",
      dataIndex: "apiPath",
      key: "apiPath",
      hideInSearch: true,
    },
    {
      title: "Method",
      dataIndex: "method",
      key: "method",
      valueType: "select" as const,
      valueEnum: methodOptions.reduce(
        (acc, option) => ({
          ...acc,
          [option.value]: { text: option.label },
        }),
        {}
      ),
    },
    {
      title: "Module",
      dataIndex: "module",
      copyable: true,
      key: "module",
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      hideInSearch: true,
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Thao tác",
      key: "action",
      hideInSearch: true,
      render: (_: any, record: IPermission) => (
        <Space>
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
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa quyền này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="primary" danger size="small">
              <DeleteOutlined />
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleEdit = (permission: IPermission) => {
    setEditingPermission(permission);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (permissionId: number) => {
    try {
      await deletePermissionAPI(permissionId);
      message.success("Xóa quyền thành công!");
      actionRef.current?.reload();
    } catch (error: any) {
      message.error("Xóa quyền thất bại!");
    }
  };

  const handleModalSuccess = () => {
    actionRef.current?.reload();
  };

  return (
    <div style={{ padding: 24 }}>
      <ProTable<IPermission>
        actionRef={actionRef}
        columns={columns as any}
        request={async (params) => {
          try {
            const filters: string[] = [];
            if (params.method) {
              filters.push(`method~'${params.method}'`);
            }
            if (params.module) {
              filters.push(`module~'${params.module}'`);
            }
            if (params.name) {
              filters.push(`name~'${params.name}'`);
            }
            const requestParams = {
              page: params.current,
              size: params.pageSize,
              filter: filters,
            };

            console.log("Request params:", requestParams);
            console.log("Filters:", filters);

            //cái này để log ra MethodOptions
            const res2 = await fetchAllMethod();
            const resultData = res2.data.data?.result || res2.data.result || [];
            // Extract unique methods and update methodOptions
            const uniqueMethods = Array.from(
              new Set(resultData.map((item: IPermission) => item.method))
            );
            const newMethodOptions = uniqueMethods.map((method) => ({
              label: method,
              value: method,
            }));
            setMethodOptions(newMethodOptions as any);
            //-----------------------------------------------------------------------

            const res = await axios.get("/api/v1/permissions/fetch-all", {
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
            console.error("Users API error:", error);
            return {
              data: [],
              total: 0,
              success: false,
            };
          }
        }}
        rowKey="id"
        pagination={{ showSizeChanger: true }}
        search={{
          labelWidth: 120,
          defaultCollapsed: false,
          searchText: "Tìm kiếm",
          resetText: "Làm mới",
        }}
        toolBarRender={() => [
          <Button
            type="primary"
            key="create"
            onClick={() => setIsModalOpen(true)}
          >
            Thêm quyền
          </Button>,
        ]}
      />

      {/* Add Permission Modal */}
      <AddPermissionModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      {/* Edit Permission Modal */}
      <EditPermissionModal
        open={isEditModalOpen}
        editingPermission={editingPermission}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingPermission(null);
        }}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default PermissionPage;
