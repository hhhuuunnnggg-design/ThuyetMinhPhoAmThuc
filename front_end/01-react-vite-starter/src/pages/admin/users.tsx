import Restricted from "@/components/common/restricted";
import { RootState } from "@/redux/store";
import { createUserAPI } from "@/services/api";
import axios from "@/services/axios.customize";
import ProTable from "@ant-design/pro-table";
import { Button, Form, Input, message, Modal, Select } from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const UsersPage = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const hasPermission = user?.role.permissions.some(
      (p) => p.apiPath === "/api/v1/users/fetch-all"
    );
    if (!hasPermission) {
      message.error("Bạn không có quyền truy cập trang này!");
      navigate("/");
    }
  }, [user, navigate]);

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Họ",
      dataIndex: "firstName",
      key: "firstName",
    },
    {
      title: "Tên",
      dataIndex: "lastName",
      key: "lastName",
    },
    {
      title: "Giới tính",
      dataIndex: "gender",
      key: "gender",
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
    },
  ];

  const handleCreateUser = async (values: any) => {
    try {
      await createUserAPI(values);
      message.success("Tạo người dùng thành công!");
      setIsModalOpen(false);
      form.resetFields();
      // Refresh table
      return true;
    } catch (error: any) {
      message.error(error.mesage || "Tạo người dùng thất bại!");
      return false;
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <ProTable<IUserData>
        columns={columns}
        request={async (params) => {
          try {
            const res = await axios.get<IBackendRes<IModelPaginate<IUserData>>>(
              "/api/v1/users/fetch-all",
              {
                params: {
                  current: params.current,
                  pageSize: params.pageSize,
                },
              }
            );
            return {
              data: res.data.results,
              total: res.data.meta.total,
              success: true,
            };
          } catch (error) {
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
        search={false}
        toolBarRender={() => [
          <Restricted key="create" permission="/api/v1/users/add-user">
            <Button type="primary" onClick={() => setIsModalOpen(true)}>
              Thêm người dùng
            </Button>
          </Restricted>,
        ]}
      />
      <Modal
        title="Tạo người dùng mới"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateUser}>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: "Vui lòng nhập email!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="firstName"
            label="Họ"
            rules={[{ required: true, message: "Vui lòng nhập họ!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="lastName"
            label="Tên"
            rules={[{ required: true, message: "Vui lòng nhập tên!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="gender"
            label="Giới tính"
            rules={[{ required: true, message: "Vui lòng chọn giới tính!" }]}
          >
            <Select>
              <Select.Option value="MALE">Nam</Select.Option>
              <Select.Option value="FEMALE">Nữ</Select.Option>
              <Select.Option value="OTHER">Khác</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UsersPage;
