import axios from "@/services/axios.customize";
import { Avatar, Button, Divider, List, Space, Typography } from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCurrentApp } from "../context/app.context";
import "./app.right.scss";
import meo_cute from "./avatar-anh-meo-cute-3.jpg";

const { Text, Title } = Typography;

interface FriendRequest {
  id: string;
  user: { id: string; fullname: string; avatar: string };
  mutualFriends: number;
  time: string;
}

interface Contact {
  id: string;
  fullname: string;
  avatar: string;
  isOnline: boolean;
  lastActive?: string;
}

interface Chat {
  id: string;
  name: string;
  avatar: string;
}

interface Birthday {
  user: { id: string; fullname: string };
}

const AppRight = ({ className }: { className?: string }) => {
  const { user } = useCurrentApp();
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [communityChats, setCommunityChats] = useState<Chat[]>([]);
  const [groupChats, setGroupChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);

  // Giả lập dữ liệu quảng cáo
  const ad = {
    title: "Horizons BBQ Night",
    image:
      "https://scontent.fsgn5-10.fna.fbcdn.net/v/t45.1600-4/506342248_3952169458380484_8679336545901452973_n.jpg?stp=c0.302.1196.1196a_cp0_dst-jpg_q75_s960x960_spS444_tt6",
    link: "https://phuquoc.crowneplaza.com/offer/horizons-bbq-night/",
  };

  // API calls
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Lấy lời mời kết bạn
        const friendRes = await axios.get("/api/v1/friend-requests");
        setFriendRequests(friendRes?.data?.result || []);

        // Lấy sinh nhật
        const birthdayRes = await axios.get("/api/v1/birthdays");
        setBirthdays(birthdayRes?.data?.result || []);

        // Lấy danh sách người liên hệ
        const contactRes = await axios.get("/api/v1/contacts");
        setContacts(contactRes?.data?.result || []);

        // Lấy đoạn chat cộng đồng
        const communityRes = await axios.get("/api/v1/community-chats");
        setCommunityChats(communityRes?.data?.result || []);

        // Lấy nhóm chat
        const groupRes = await axios.get("/api/v1/group-chats");
        setGroupChats(groupRes?.data?.result || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Xác nhận lời mời kết bạn
  const handleConfirmFriend = async (requestId: string) => {
    try {
      await axios.post(`/api/v1/friend-requests/${requestId}/confirm`);
      setFriendRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (error) {
      console.error("Error confirming friend request:", error);
    }
  };

  // Xóa lời mời kết bạn
  const handleDeleteFriend = async (requestId: string) => {
    try {
      await axios.delete(`/api/v1/friend-requests/${requestId}`);
      setFriendRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (error) {
      console.error("Error deleting friend request:", error);
    }
  };

  return (
    <div
      className={`app-right ${className}`}
      style={{
        background: "#f0f2f5",
        padding: "16px",
        width: "360px",
        height: "100vh",
        overflowY: "auto",
      }}
    >
      {/* Quảng cáo */}
      <Title level={4}>Được tài trợ</Title>
      <div className="ad-container">
        <a href={ad.link} target="_blank" rel="nofollow noreferrer">
          <img src={meo_cute} alt={ad.title} className="ad-image" />
          <Text strong>{ad.title}</Text>
          <Text type="secondary">phuquoc.crowneplaza.com</Text>
        </a>
      </div>
      <Divider />

      {/* Lời mời kết bạn */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Title level={4}>Lời mời kết bạn</Title>
        <Link to="/friends">Xem tất cả</Link>
      </div>
      <List
        loading={loading}
        dataSource={friendRequests}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button
                type="primary"
                onClick={() => handleConfirmFriend(item.id)}
              >
                Xác nhận
              </Button>,
              <Button onClick={() => handleDeleteFriend(item.id)}>Xóa</Button>,
            ]}
          >
            <List.Item.Meta
              avatar={<Avatar src={item.user.avatar} size={60} />}
              title={
                <Link to={`/profile/${item.user.id}`}>
                  {item.user.fullname}
                </Link>
              }
              description={
                <Space direction="vertical">
                  <Text>{item.time}</Text>
                  <Text>{item.mutualFriends} bạn chung</Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
      <Divider />

      {/* Sinh nhật */}
      <Title level={4}>Sinh nhật</Title>
      <List
        loading={loading}
        dataSource={birthdays}
        renderItem={(item) => (
          <List.Item>
            <Link to="/events/birthdays">
              Hôm nay là sinh nhật của <Text strong>{item.user.fullname}</Text>.
            </Link>
          </List.Item>
        )}
      />
      <Divider />

      {/* Người liên hệ */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Title level={4}>Người liên hệ</Title>
        <Button type="text" icon={<i className="search-icon" />} />
      </div>
      <List
        loading={loading}
        dataSource={contacts}
        renderItem={(item) => (
          <List.Item>
            <Link
              to={`/messages/t/${item.id}`}
              style={{ display: "flex", alignItems: "center", width: "100%" }}
            >
              <div style={{ position: "relative" }}>
                <Avatar src={item.avatar} size={36} />
                {item.isOnline && (
                  <div
                    className="online-indicator"
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      width: 10,
                      height: 10,
                      backgroundColor: "#31a24c",
                      borderRadius: "50%",
                      border: "2px solid #fff",
                    }}
                  />
                )}
              </div>
              <Text style={{ marginLeft: 12 }}>{item.fullname}</Text>
              {item.lastActive && (
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  {item.lastActive}
                </Text>
              )}
            </Link>
          </List.Item>
        )}
      />
      <Divider />

      {/* Đoạn chat cộng đồng */}
      <Title level={4}>Đoạn chat cộng đồng</Title>
      <List
        loading={loading}
        dataSource={communityChats}
        renderItem={(item) => (
          <List.Item>
            <Link
              to={`/messages/t/${item.id}`}
              style={{ display: "flex", alignItems: "center", width: "100%" }}
            >
              <Avatar src={item.avatar} size={36} />
              <Space direction="vertical" style={{ marginLeft: 12 }}>
                <Text strong>{item.name}</Text>
                <Text type="secondary">Gia Sư Hà Nội</Text>
              </Space>
            </Link>
          </List.Item>
        )}
      />
      <Divider />

      {/* Nhóm chat */}
      <Title level={4}>Nhóm chat</Title>
      <List
        loading={loading}
        dataSource={groupChats}
        renderItem={(item) => (
          <List.Item>
            <Link
              to={`/messages/t/${item.id}`}
              style={{ display: "flex", alignItems: "center", width: "100%" }}
            >
              <div style={{ position: "relative" }}>
                <Avatar src={item.avatar} size={36} />
                <div
                  className="online-indicator"
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 10,
                    height: 10,
                    backgroundColor: "#31a24c",
                    borderRadius: "50%",
                    border: "2px solid #fff",
                  }}
                />
              </div>
              <Text style={{ marginLeft: 12 }}>{item.name}</Text>
            </Link>
          </List.Item>
        )}
      />
      <Button type="text" style={{ width: "100%", textAlign: "left" }}>
        Tạo nhóm chat
      </Button>
    </div>
  );
};

export default AppRight;
