import { logoutAPI } from "@/services/api";
import {
  AppstoreOutlined,
  DollarCircleOutlined,
  ExceptionOutlined,
  HeartTwoTone,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Avatar, Dropdown, Layout, Menu, Space, message } from "antd";
import React, { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useCurrentApp } from "../context/app.context";
type MenuItem = Required<MenuProps>["items"][number];

const { Content, Footer, Sider } = Layout;

const LayoutAdmin = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const { user, setUser, setIsAuthenticated, isAuthenticated } =
    useCurrentApp();
  const navigate = useNavigate();

  // Check if user has admin role
  useEffect(() => {
    if (isAuthenticated && user?.role === null) {
      message.error("Bạn không có quyền truy cập trang quản trị!");
      navigate("/");
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogout = async () => {
    try {
      await logoutAPI();
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("access_token");
      message.success("Đăng xuất thành công!");
      navigate("/login");
    } catch (error: any) {
      message.error(error?.message || "Đăng xuất thất bại!");
    }
  };

  const items: MenuItem[] = [
    {
      label: <Link to="/admin">Dashboard</Link>,
      key: "dashboard",
      icon: <AppstoreOutlined />,
    },
    {
      label: <span>Manage Users</span>,
      key: "user",
      icon: <UserOutlined />,
      children: [
        {
          label: <Link to="/admin/user">CRUD</Link>,
          key: "crud",
          icon: <TeamOutlined />,
        },
      ],
    },
    {
      label: <Link to="/admin/test1">Manage Books</Link>,
      key: "book",
      icon: <ExceptionOutlined />,
    },
    {
      label: <Link to="/admin/test2">Manage Orders</Link>,
      key: "order",
      icon: <DollarCircleOutlined />,
    },
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
      label: <Link to={"/"}>Trang chủ</Link>,
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

  // If not authenticated, show loading or redirect
  if (!isAuthenticated) {
    return null;
  }

  // If user has no role, redirect to home
  if (user?.role === null) {
    return null;
  }

  return (
    <>
      <Layout style={{ minHeight: "100vh" }} className="layout-admin">
        <Sider
          theme="light"
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
        >
          <div style={{ height: 32, margin: 16, textAlign: "center" }}>
            Admin
          </div>
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
              {React.createElement(
                collapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
                {
                  className: "trigger",
                  onClick: () => setCollapsed(!collapsed),
                }
              )}
            </span>
            <Dropdown menu={{ items: itemsDropdown }} trigger={["click"]}>
              <Space style={{ cursor: "pointer" }}>
                <Avatar src={user?.avatar} />
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
    </>
  );
};

export default LayoutAdmin;
