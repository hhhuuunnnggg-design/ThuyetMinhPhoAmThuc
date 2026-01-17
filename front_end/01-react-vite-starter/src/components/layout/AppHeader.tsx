//import ChatBox from "@/components/common/ChatBox";
import { logoutAPI } from "@/api";
import Restricted from "@/components/common/restricted";
import { useCurrentApp } from "@/components/context/app.context";
import { ROUTES, STORAGE_KEYS } from "@/constants";
import { logout } from "@/redux/slice/auth.slice";
import {
  AccountBookTwoTone,
  ApiTwoTone,
  CloudTwoTone,
  MessageTwoTone,
  NotificationTwoTone,
  VideoCameraTwoTone
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Divider,
  Drawer,
  Dropdown,
  message,
  Space,
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

  const navIcons = [
    {
      icon: (
        <Badge count={2} size="small">
          <MessageTwoTone />
        </Badge>
      ),
      key: "messages",
      onClick: () => console.log("Messages"),
    },
    {
      icon: (
        <Badge count={5} size="small">
          <NotificationTwoTone />
        </Badge>
      ),
      key: "notifications",
      onClick: () => console.log("Notifications"),
    },
  ];
  const navIcons1 = [
    {
      icon: <AccountBookTwoTone />,
      key: "home",
      onClick: () => navigate(ROUTES.HOME),
    },
    {
      icon: <VideoCameraTwoTone />,
      key: "video",
      onClick: () => console.log("Video"),
    },
    {
      icon: <ApiTwoTone />,
      key: "group",
      onClick: () => console.log("group"),
    },
    {
      icon: <CloudTwoTone />,
      key: "feed",
      onClick: () => console.log("feed"),
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
                <div style={{ display: "flex", alignItems: "center" }}>
                  <img
                    style={{ width: "40px", height: "40px" }}
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/1024px-Facebook_Logo_%282019%29.png"
                    alt=""
                  />
                </div>
              </Link>

              <input
                className="input-search"
                type="text"
                placeholder="Tìm kiếm trên Facebook"
              />
            </div>
            <div className="page-header__center">
              {navIcons1.map((item, index) => (
                <div
                  key={`${item.key}-${index}`}
                  className="nav-item"
                  onClick={item.onClick}
                  style={{ margin: "40px" }}
                >
                  {item.icon}
                </div>
              ))}
            </div>
            <nav className="page-header__nav">
              {navIcons.map((item, index) => (
                <div
                  key={`${item.key}-${index}`}
                  className="nav-item"
                  onClick={item.onClick}
                >
                  {item.icon}
                </div>
              ))}
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

                    <div style={{ color: "black" }}>{user?.fullname}</div>
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
        {!isAuthenticated ? (
          <Button type="primary" onClick={() => navigate(ROUTES.LOGIN)}>
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
