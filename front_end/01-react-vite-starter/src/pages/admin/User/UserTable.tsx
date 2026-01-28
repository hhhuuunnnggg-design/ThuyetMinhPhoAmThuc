import { changeUserActivityAPI, deleteUserAPI } from "@/api";
import axios from "@/api/axios";
import Restricted from "@/components/common/restricted";
import { logger } from "@/utils/logger";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import ProTable from "@ant-design/pro-table";
import { Avatar, Button, Grid, Image, Popconfirm, Space, Tag, message } from "antd";
import { useEffect, useRef, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import AddUserModal from "./AddUserModal";
import EditUserModal from "./EditUserModal";
import "./UserTable.scss";

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

const UsersPage = () => {
  const screens = Grid.useBreakpoint();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const actionRef = useRef<any>();
  const [roleEnum, setRoleEnum] = useState<Record<string, { text: string }>>(
    {}
  );

  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await axios.get("/api/v1/roles/fetch-all", {
          params: { page: 1, size: 100 },
        });
        const roles = res.data?.result || [];

        const enumData: Record<string, { text: string }> = {};
        roles.forEach((role: any) => {
          enumData[role.name] = { text: role.name };
        });

        setRoleEnum(enumData); // ✅ cập nhật valueEnum
      } catch (error) {
        logger.error("Error fetching roles:", error);
      }
    }

    fetchRoles();
  }, []);



  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      hideInSearch: true,
      responsive: ["lg"],
    },
    {
      title: "Avatar",
      dataIndex: "avatar",
      key: "avatar",
      hideInSearch: true,
      width: 80,
      render: (avatar: string, record: IUserData) => {
        if (avatar) {
          return (
            <Image
              width={48}
              height={48}
              src={avatar}
              style={{
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid #f0f0f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                cursor: "pointer",
              }}
              //preview={{}}
              fallback="https://scontent.fsgn5-15.fna.fbcdn.net/v/t1.30497-1/453178253_471506465671661_2781666950760530985_n.png?stp=dst-png_s200x200&_nc_cat=1&ccb=1-7&_nc_sid=b224c7&_nc_ohc=SRM7Y4ywKQsQ7kNvwG55tLJ&_nc_oc=AdnYeS7uibHVo6DQ05-XRY4l8f9hJz2TaRGXjJ67C1R92drbSrci1-HSJeJMMOuIWYFSEf8mDW7ZXOroQo9wJS7X&_nc_zt=24&_nc_ht=scontent.fsgn5-15.fna&oh=00_AfqUI069Wbgz_Hz5_91DwXHcckeDXzmNgfjjdc_B8LY0Cg&oe=69A1CC3A"
            />
          );
        }
        // Fallback: Avatar với chữ cái đầu
        return (
          <Avatar
            size={48}
            style={{
              backgroundColor: "#1890ff",
              color: "white",
              fontWeight: "bold",
              fontSize: "20px",
              border: "2px solid #f0f0f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            {record.email?.[0]?.toUpperCase() ?? "U"}
          </Avatar>
        );
      },
    },
    {
      title: "Email",
      dataIndex: "email",
      copyable: true,
      key: "email",
    },

    {
      title: "Họ và tên",
      dataIndex: "fullname",
      key: "fullname",
      hideInSearch: true,
      responsive: ["md"],
    },
    {
      title: "Giới tính",
      dataIndex: "gender",
      key: "gender",
      hideInSearch: true,
      responsive: ["lg"],
    },
    {
      title: "Vai trò",
      dataIndex: ["role", "name"],
      key: "role",
      valueType: "select" as const,
      valueEnum: roleEnum,
    },
    {
      title: "Trạng thái",
      dataIndex: "blocked",
      key: "blocked",
      hideInSearch: true,
      render: (blocked: boolean) => (
        <Tag color={blocked ? "red" : "green"}>
          {blocked ? "Bị khóa" : "Hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      hideInSearch: true,
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
      responsive: ["xl"],
    },
    {
      title: "Thao tác",
      key: "action",
      hideInSearch: true,
      width: 140,
      fixed: screens.xs ? "right" : undefined,
      render: (_: any, record: any) => (
        <Space>
          <Restricted permission="/api/v1/users/{id}" method="PUT">
            <Button
              className="edit-user"
              style={{
                backgroundColor: "rgb(255 200 53)", // màu cam đậm (Ant Design orange-6)
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
          <Restricted
            permission="/api/v1/users/changeActivity/{id}"
            method="PUT"
          >
            {record.blocked ? (
              <Button
                type="primary"
                size="small"
                danger
                onClick={() => handleChangeActivity(record.id, record.blocked)}
              >
                <FaEyeSlash />
              </Button>
            ) : (
              <Button
                type="primary"
                size="small"
                onClick={() => handleChangeActivity(record.id, record.blocked)}
              >
                <FaEye />
              </Button>
            )}
          </Restricted>
          <Restricted permission="/api/v1/users/{id}" method="DELETE">
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa người dùng này?"
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

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleRefreshTable = () => {
    actionRef.current?.reload();
  };

  const handleDelete = async (userId: number) => {
    try {
      await deleteUserAPI(userId);
      message.success("Xóa người dùng thành công!");
      // Refresh table
      actionRef.current?.reload();
    } catch (error: any) {
      message.error("Xóa người dùng thất bại!");
    }
  };

  const handleChangeActivity = async (
    userId: number,
    currentStatus: boolean
  ) => {
    try {
      await changeUserActivityAPI(userId);
      const action = currentStatus ? "mở khóa" : "khóa";
      message.success(`${action} tài khoản thành công!`);
      // Refresh table
      actionRef.current?.reload();
    } catch (error: any) {
      message.error("Thay đổi trạng thái tài khoản thất bại!");
    }
  };

  return (
    <div
      className="users-page"
      style={{
        padding: screens.xs ? 12 : screens.md ? 20 : 24,
        maxWidth: "100%",
      }}
    >
      <ProTable<IUserData>
        actionRef={actionRef}
        columns={columns as any}
        className="users-table"
        request={async (params) => {
          try {
            // Xây dựng mảng filter
            const filters: string[] = [];

            if (params.email) {
              filters.push(`email~'${params.email}'`);
            }

            if (params.role) {
              // Tìm kiếm chính xác role name
              filters.push(`role.name~'${params.role}'`);
            }

            const requestParams = {
              page: params.current,
              size: params.pageSize,
              filter: filters,
            };

          

            const res = await axios.get("/api/v1/users/fetch-all", {
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
            logger.error("Users API error:", error);
            return {
              data: [],
              total: 0,
              success: false,
            };
          }
        }}
        rowKey="id"
        scroll={{ x: screens.xs ? 900 : undefined }}
        pagination={{
          showSizeChanger: true,
        }}
        search={{
          labelWidth: screens.xs ? 90 : 120,
          defaultCollapsed: false,
          searchText: "Tìm kiếm",
          resetText: "Làm mới",
        }}
        toolBarRender={() => [
          <Restricted key="create" permission="/api/v1/users/add-user">
            <Button
              type="primary"
              onClick={() => setIsModalOpen(true)}
              size={screens.xs ? "middle" : "large"}
              style={{ width: screens.xs ? "100%" : "auto" }}
            >
              Thêm người dùng
            </Button>
          </Restricted>,
        ]}
      />

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleRefreshTable}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
        }}
        onSuccess={handleRefreshTable}
        editingUser={editingUser}
      />
    </div>
  );
};

export default UsersPage;
