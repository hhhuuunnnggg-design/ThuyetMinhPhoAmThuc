import { logoutAPI } from "@/api";
import { useCurrentApp } from "@/components/context/app.context";
import { ROUTES, STORAGE_KEYS } from "@/constants";
import {
  AppstoreOutlined,
  DollarCircleOutlined,
  ExceptionOutlined,
  HeartTwoTone,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SoundOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Avatar, Dropdown, Layout, Menu, Space, message } from "antd";
import React, { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";

type MenuItem = Required<MenuProps>["items"][number];

const { Content, Footer, Sider } = Layout;

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const { user, setUser, setIsAuthenticated, isAuthenticated } =
    useCurrentApp();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutAPI();
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      message.success("Đăng xuất thành công!");
      navigate(ROUTES.LOGIN);
    } catch (error: any) {
      message.error(error?.message || "Đăng xuất thất bại!");
    }
  };

  const hasPermission = (apiPath: string, method: string) => {
    return user?.role?.permissions?.some(
      (p: any) => p.apiPath === apiPath && p.method === method
    );
  };

  const items: MenuItem[] = [
    {
      label: <Link to={ROUTES.ADMIN.BASE}>Dashboard</Link>,
      key: "dashboard",
      icon: <AppstoreOutlined />,
    },
    {
      label: <span>Manage Users</span>,
      key: "user",
      icon: <UserOutlined />,
      children: [
        {
          label: <Link to={ROUTES.ADMIN.USER}>CRUD</Link>,
          key: "crud",
          icon: <TeamOutlined />,
        },
      ],
    },
    ...(hasPermission("/api/v1/roles/fetch-all", "GET")
      ? [
          {
            label: <Link to={ROUTES.ADMIN.ROLE}>Manage Role</Link>,
            key: "role",
            icon: <ExceptionOutlined />,
          },
        ]
      : []),
    ...(hasPermission("/api/v1/permissions/fetch-all", "GET")
      ? [
          {
            label: <Link to={ROUTES.ADMIN.PERMISSION}>Manage Permission</Link>,
            key: "permission",
            icon: <DollarCircleOutlined />,
          },
        ]
      : []),
    ...(hasPermission("/api/v1/tts/audios", "GET")
      ? [
          {
            label: <Link to={ROUTES.ADMIN.TTS_AUDIO}>Manage TTS Audio</Link>,
            key: "tts-audio",
            icon: <SoundOutlined />,
          },
        ]
      : []),
  ];

  const itemsDropdown = [
    {
      label: (
        <label style={{ cursor: "pointer" }} onClick={() => alert("me")}>
          Quản lý tài khoản
        </label>
      ),
      key: "account",
    },
    {
      label: <Link to={ROUTES.HOME}>Trang chủ</Link>,
      key: "home",
    },
    {
      label: (
        <label style={{ cursor: "pointer" }} onClick={() => handleLogout()}>
          Đăng xuất
        </label>
      ),
      key: "logout",
    },
  ];

  if (!isAuthenticated) return null;

  return (
    <Layout style={{ minHeight: "100vh" }} className="layout-admin">
      <Sider
        theme="light"
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      >
        <div style={{ height: 32, margin: 16, textAlign: "center" }}>Admin</div>
        <Menu
          defaultSelectedKeys={[activeMenu]}
          mode="inline"
          items={items}
          onClick={(e) => setActiveMenu(e.key)}
        />
      </Sider>
      <Layout>
        <div
          className="admin-header"
          style={{
            height: "50px",
            borderBottom: "1px solid #ebebeb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 15px",
          }}
        >
          <span>
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              className: "trigger",
              onClick: () => setCollapsed(!collapsed),
            })}
          </span>
          <Dropdown menu={{ items: itemsDropdown }} trigger={["click"]}>
            <Space style={{ cursor: "pointer" }}>
              <Avatar
                src={user?.avatar || undefined}
                style={{ background: "#87d068" }}
              >
                {user?.fullname?.[0] || "U"}
              </Avatar>
              {user?.fullname}
            </Space>
          </Dropdown>
        </div>
        <Content style={{ padding: "15px" }}>
          <Outlet />
        </Content>
        <Footer style={{ padding: 0, textAlign: "center" }}>
          facebook_clone <HeartTwoTone />
        </Footer>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
