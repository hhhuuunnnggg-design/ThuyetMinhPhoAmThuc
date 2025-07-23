//import ChatBox from "@/components/common/ChatBox";
import Restricted from "@/components/common/restricted";
import { useCurrentApp } from "@/components/context/app.context";
import { logout } from "@/redux/slice/auth.slice";
import {
  fetchChatbotHistoryAPI,
  logoutAPI,
  sendChatbotMessageAPI,
} from "@/services/api";
import {
  AccountBookTwoTone,
  ApiTwoTone,
  CloudTwoTone,
  MessageTwoTone,
  NotificationTwoTone,
  OpenAIFilled,
  VideoCameraTwoTone,
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
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import "./app.header.scss";

const fakeUserA = {
  id: 1,
  fullname: "Nguyễn Văn A",
  avatar: "https://randomuser.me/api/portraits/men/32.jpg",
};
const fakeUserB = {
  id: 2,
  fullname: "Trần Thị B",
  avatar: "https://randomuser.me/api/portraits/women/44.jpg",
};

const fakeMessages = [
  { id: 1, sender: fakeUserA, content: "Chào bạn!", time: "10:00" },
  {
    id: 2,
    sender: fakeUserB,
    content: "Chào bạn, bạn khỏe không?",
    time: "10:01",
  },
  {
    id: 3,
    sender: fakeUserA,
    content: "Mình khỏe, cảm ơn bạn!",
    time: "10:02",
  },
];

export function ChatBox({ onClose }: { onClose: () => void }) {
  const { user } = useCurrentApp();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Lấy lịch sử chat khi mở chatbox
  useEffect(() => {
    if (!user?.id) return;
    setLoadingHistory(true);
    fetchChatbotHistoryAPI(user.id)
      .then((res) => {
        // API trả về: { data: { data: [ { ... } ] } }
        const data = res?.data?.data || [];
        // Chuẩn hóa về dạng [{sender, content, time}]
        const mapped = data.map((msg: any) => ({
          id: msg.id,
          sender: {
            id: msg.isBot ? 0 : user.id,
            fullname: msg.isBot ? "Chatbot" : user.fullname,
            avatar: msg.isBot
              ? "https://cdn-icons-png.flaticon.com/512/4712/4712037.png"
              : user.avatar,
          },
          content: msg.content,
          time:
            msg.timestamp?.slice(11, 16) || msg.createdAt?.slice(11, 16) || "",
        }));
        setMessages(mapped);
      })
      .catch(() => message.error("Không thể tải lịch sử chat"))
      .finally(() => setLoadingHistory(false));
    // eslint-disable-next-line
  }, [user?.id]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user?.id) return;
    setLoading(true);
    // Thêm tin nhắn user vào UI ngay
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: {
          id: user.id,
          fullname: user.fullname,
          avatar: user.avatar,
        },
        content: input,
        time: new Date().toLocaleTimeString().slice(0, 5),
      },
    ]);
    try {
      const res = await sendChatbotMessageAPI(user.id, input.trim());
      // API trả về: { data: { data: { ... } } }
      const botMsg = res?.data?.data;
      if (botMsg) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: {
              id: 0,
              fullname: "Chatbot",
              avatar: "https://cdn-icons-png.flaticon.com/512/4712/4712037.png",
            },
            content: botMsg.content || "Bot đã trả lời.",
            time: new Date().toLocaleTimeString().slice(0, 5),
          },
        ]);
      }
    } catch (err) {
      message.error("Gửi tin nhắn thất bại!");
    } finally {
      setInput("");
      setLoading(false);
    }
  };
  return (
    <div
      style={{
        position: "fixed",
        bottom: "80px",
        right: "16px",
        width: "350px",
        height: "500px",
        backgroundColor: "#fff",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        display: "flex",
        flexDirection: "column",
        zIndex: 1001,
        border: "1px solid #e1e5e9",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid #e1e5e9",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#f8f9fa",
          borderTopLeftRadius: "12px",
          borderTopRightRadius: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <Avatar
            src="https://cdn-icons-png.flaticon.com/512/4712/4712037.png"
            size={32}
          />
          <span style={{ marginLeft: "8px", fontWeight: "bold" }}>
            Chatbot AI
          </span>
        </div>
        <Button
          type="text"
          size="small"
          onClick={onClose}
          style={{ padding: "4px" }}
        >
          ✕
        </Button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {loadingHistory ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            Đang tải lịch sử chat...
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: "flex",
                justifyContent: msg.sender.id === 0 ? "flex-start" : "flex-end",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  maxWidth: "70%",
                  padding: "8px 12px",
                  borderRadius: "18px",
                  backgroundColor: msg.sender.id === 0 ? "#f0f2f5" : "#0084ff",
                  color: msg.sender.id === 0 ? "#000" : "#fff",
                  wordWrap: "break-word",
                }}
              >
                <div style={{ fontSize: "14px" }}>{msg.content}</div>
                <div
                  style={{
                    fontSize: "11px",
                    opacity: 0.7,
                    marginTop: "4px",
                    textAlign: "right",
                  }}
                >
                  {msg.time}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "16px",
          borderTop: "1px solid #e1e5e9",
          display: "flex",
          gap: "8px",
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder="Nhập tin nhắn..."
          style={{
            flex: 1,
            padding: "8px 12px",
            border: "1px solid #e1e5e9",
            borderRadius: "20px",
            outline: "none",
          }}
          disabled={loading}
        />
        <Button
          type="primary"
          onClick={handleSend}
          loading={loading}
          disabled={!input.trim()}
          style={{ borderRadius: "50%", width: "36px", height: "36px" }}
        >
          ➤
        </Button>
      </div>
    </div>
  );
}
const AppHeader = () => {
  const [openDrawer, setOpenDrawer] = useState(false);
  const { user, isAuthenticated, loading, setUser, setIsAuthenticated } =
    useCurrentApp();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showChat, setShowChat] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutAPI();
      dispatch(logout());
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
      //<AccountBookTwoTone />
      //<HomeTwoTone />
      icon: <AccountBookTwoTone />, // thêm fontSize nếu cần
      key: "home",
      onClick: () => navigate("/"),
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
    }, // sửa key
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
              <Link to="/" className="logo">
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
                // style={{ backgroundColor: "#f0f2f5" }}
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
      {isAuthenticated && (
        <Button
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "fixed",
            bottom: "16px",
            right: "16px",
            background: "#fff",
            width: "48px",
            height: "48px",
            borderRadius: "9999px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            zIndex: 1000,
          }}
          onClick={() => setShowChat(true)}
        >
          <OpenAIFilled style={{ fontSize: 24 }} />
        </Button>
      )}
      {showChat && <ChatBox onClose={() => setShowChat(false)} />}
    </>
  );
};

export default AppHeader;
