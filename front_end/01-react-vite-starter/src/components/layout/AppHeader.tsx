import { logoutAPI } from "@/api";
import Restricted from "@/components/common/restricted";
import { useCurrentApp } from "@/components/context/app.context";
import { ROUTES, STORAGE_KEYS } from "@/constants";
import { logout } from "@/redux/slice/auth.slice";
import {
  EnvironmentTwoTone,
  HeartTwoTone,
  ShopTwoTone,
  SoundTwoTone,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Divider,
  Drawer,
  Dropdown,
  Space,
  message,
} from "antd";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import "./AppHeader.scss";

const AppHeader = () => {
  const [openDrawer, setOpenDrawer] = useState(false);
  const { user, isAuthenticated, loading, setUser, setIsAuthenticated } =
    useCurrentApp();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // const [showChat, setShowChat] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutAPI();
      dispatch(logout());
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      message.success("Đăng xuất thành công!");
      navigate(ROUTES.LOGIN);
    } catch (error: any) {
      message.error(error?.message || "Đăng xuất thất bại!");
    }
  };

  const menuItems = [
    {
      label: <Link to="/account">Tài khoản</Link>,
      key: "account",
    },
    {
      label: <Link to="/history">Lịch sử nghe</Link>,
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

  if (user?.role !== null) {
    menuItems.unshift({
      label: (
        <Restricted permission="/api/v1/users/fetch-all">
          <Link to={ROUTES.ADMIN.USER}>Trang quản trị</Link>
        </Restricted>
      ),
      key: "admin",
    });
  }

  const navItems = [
    {
      icon: <EnvironmentTwoTone />,
      label: "Bản đồ",
      key: "map",
      onClick: () => navigate(`${ROUTES.TTS}#map`),
    },
    {
      icon: <ShopTwoTone />,
      label: "Điểm ăn",
      key: "spots",
      onClick: () => navigate(`${ROUTES.TTS}#spots`),
    },
    {
      icon: <SoundTwoTone />,
      label: "Thuyết minh",
      key: "audio",
      onClick: () => navigate(`${ROUTES.TTS}#audio`),
    },
    {
      icon: <HeartTwoTone />,
      label: "Yêu thích",
      key: "favorites",
      onClick: () => navigate(`${ROUTES.TTS}#favorites`),
    },
  ];

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
              <Link to={ROUTES.HOME} className="logo">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <img
                    style={{ width: "40px", height: "40px" }}
                    src="https://static.vinwonders.com/production/pho-am-thuc-vinh-khanh-3.jpg"
                    alt="Phố Ẩm Thực"
                  />
                  <div className="app-title">
                    <div className="app-title__main">Phố Ẩm Thực</div>
                    <div className="app-title__sub">Thuyết minh & bản đồ món ngon</div>
                  </div>
                </div>
              </Link>

              <input
                className="input-search"
                type="text"
                placeholder="Tìm quán ăn, món ngon, địa điểm..."
              />
            </div>
            <div className="page-header__center">
              {navItems.map((item, index) => (
                <div
                  key={`${item.key}-${index}`}
                  className="nav-item"
                  onClick={item.onClick}
                  title={item.label}
                >
                  {item.icon}
                </div>
              ))}
            </div>
            <nav className="page-header__nav">
              {!loading && isAuthenticated && user && (
                <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
                  <Space className="nav-item">
                    <Avatar
                      className="facebook-post__avatar"
                      src={user.avatar || undefined}
                      style={{ background: "#87d068", alignContent: "center" }}
                    >
                      {user.fullname?.[0] || "U"}
                    </Avatar>

                    <div className="user-name">{user?.fullname}</div>
                  </Space>
                </Dropdown>
              )}
            </nav>
          </div>
        </header>
      </div>

      <Drawer
        title="Menu chức năng"
        placement="left"
        onClose={() => setOpenDrawer(false)}
        open={openDrawer}
      >
        <div className="drawer-shortcuts">
          {navItems.map((item) => (
            <div
              key={item.key}
              className="drawer-shortcuts__item"
              onClick={() => {
                item.onClick();
                setOpenDrawer(false);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  item.onClick();
                  setOpenDrawer(false);
                }
              }}
            >
              <span className="drawer-shortcuts__icon">{item.icon}</span>
              <span className="drawer-shortcuts__label">{item.label}</span>
            </div>
          ))}
        </div>
        <Divider />
        {!isAuthenticated ? (
          <Button type="primary" onClick={() => navigate(ROUTES.LOGIN)}>
            Đăng nhập
          </Button>
        ) : (
          <>
            <p>
              <Link to={ROUTES.TTS}>Thuyết minh Phố Ẩm Thực</Link>
            </p>
            <Divider />
            <p>
              <Link to="/account">Tài khoản</Link>
            </p>
            <Divider />
            <p>
              <Link to="/history">Lịch sử nghe</Link>
            </p>
            <Divider />
            {user?.role !== null && (
              <Restricted permission="/api/v1/users/fetch-all">
                <p>
                  <Link to={ROUTES.ADMIN.USER}>Trang quản trị</Link>
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
