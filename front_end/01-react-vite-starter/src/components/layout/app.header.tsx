import Restricted from "@/components/common/restricted";
import { useCurrentApp } from "@/components/context/app.context";
import { logout } from "@/redux/slice/auth.slice";
import { logoutAPI } from "@/services/api";
import {
  Avatar,
  Badge,
  Button,
  Divider,
  Drawer,
  Dropdown,
  message,
  Popover,
  Space,
} from "antd";
import { useState } from "react";
import { FaReact } from "react-icons/fa";
import { FiShoppingCart } from "react-icons/fi";
import { VscSearchFuzzy } from "react-icons/vsc";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import "./app.header.scss";

const AppHeader = () => {
  const [openDrawer, setOpenDrawer] = useState(false);
  const { user, isAuthenticated, loading, setUser, setIsAuthenticated } =
    useCurrentApp();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutAPI();
      dispatch(logout());
      // Fix: setUser expects IUser but we need to handle null case
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("access_token");
      message.success("Đăng xuất thành công!");
      navigate("/login");
    } catch (error: any) {
      message.error(error?.message || "Đăng xuất thất bại!");
    }
  };

  const menuItems = [
    {
      label: <Link to="/account">Quản lý tài khoản</Link>,
      key: "account",
    },
    {
      label: <Link to="/history">Lịch sử mua hàng</Link>,
      key: "history",
    },
    {
      label: (
        <span style={{ cursor: "pointer" }} onClick={handleLogout}>
          Đăng xuất
        </span>
      ),
      key: "logout",
    },
  ];

  // Fix: Check if user has role instead of comparing role name
  if (user?.role !== null) {
    menuItems.unshift({
      label: (
        <Restricted permission="/api/v1/users/fetch-all">
          <Link to="/admin/user">Trang quản trị</Link>
        </Restricted>
      ),
      key: "admin",
    });
  }

  return (
    <>
      <div className="header-container">
        <header className="page-header">
          <div className="page-header__top">
            <div
              className="page-header__toggle"
              onClick={() => setOpenDrawer(true)}
            >
              ☰
            </div>

            <div className="page-header__logo">
              <span className="logo" onClick={() => navigate("/")}>
                <FaReact className="rotate icon-react" />
                Hỏi Dân !T
                <VscSearchFuzzy className="icon-search" />
              </span>
              <input
                className="input-search"
                type="text"
                placeholder="Bạn tìm gì hôm nay"
              />
            </div>
          </div>

          <nav className="page-header__bottom">
            <ul className="navigation">
              <li className="navigation__item">
                <Popover
                  title="Giỏ hàng"
                  placement="topRight"
                  content={<div>Chưa có sản phẩm</div>}
                >
                  <Badge count={10} size="small" showZero>
                    <FiShoppingCart className="icon-cart" />
                  </Badge>
                </Popover>
              </li>
              <li className="navigation__item mobile">
                <Divider type="vertical" />
              </li>
              <li className="navigation__item mobile">
                {!loading && isAuthenticated && user ? (
                  <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
                    <Space>
                      <Avatar src={user?.avatar} />
                      {user?.fullname}
                    </Space>
                  </Dropdown>
                ) : (
                  <span onClick={() => navigate("/login")}>Tài khoản</span>
                )}
              </li>
            </ul>
          </nav>
        </header>
      </div>

      <Drawer
        title="Menu chức năng"
        placement="left"
        onClose={() => setOpenDrawer(false)}
        open={openDrawer}
      >
        {!isAuthenticated ? (
          <Button type="primary" onClick={() => navigate("/login")}>
            Đăng nhập
          </Button>
        ) : (
          <>
            <p>
              <Link to="/account">Quản lý tài khoản</Link>
            </p>
            <Divider />
            <p>
              <Link to="/history">Lịch sử mua hàng</Link>
            </p>
            <Divider />
            {user?.role !== null && (
              <Restricted permission="/api/v1/users/fetch-all">
                <p>
                  <Link to="/admin/user">Trang quản trị</Link>
                </p>
                <Divider />
              </Restricted>
            )}
            <p
              onClick={handleLogout}
              style={{ cursor: "pointer", color: "red" }}
            >
              Đăng xuất
            </p>
          </>
        )}
      </Drawer>
    </>
  );
};

export default AppHeader;
