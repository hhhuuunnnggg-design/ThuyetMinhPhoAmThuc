import { Avatar, Button, Divider, List, Typography } from "antd";
import { Link } from "react-router-dom";
import { useCurrentApp } from "../context/app.context";
import "./app.left.scss";
import da_luu from "./img_left/da_luu.png";
import friend from "./img_left/friend.png";
import ki_niem from "./img_left/ki_niem.png";
import marketplace from "./img_left/maket.png";
import nhom from "./img_left/nhom.png";
import video from "./img_left/video.png";
const { Text } = Typography;

interface MenuItem {
  label: string;
  icon: string | JSX.Element;
  link: string;
  external?: boolean;
}

interface GroupItem {
  label: string;
  icon: string;
  link: string;
}

const AppLeft = ({ className }: { className?: string }) => {
  const { user } = useCurrentApp();

  // Danh sách menu chính
  const menuItems: MenuItem[] = [
    {
      label: user?.fullname || "Nguyễn Hùng",
      icon:
        user?.avatar ||
        "https://scontent.fsgn5-15.fna.fbcdn.net/v/t1.30497-1/453178253_471506465671661_2781666950760530985_n.png?stp=cp0_dst-png_s40x40&_nc_cat=1&ccb=1-7&_nc_sid=207b4a&_nc_ohc=O8hM-CTineUQ7kNvwG2Hex-&_nc_oc=AdmjqWTX6ujXFS7NgFyugvWiMD8kfyubl9ntYShwZn1ktZKcilF6MZvtvJxbajmpZjToUhLG8aYPVi3iV0-_yE0d&_nc_zt=24&_nc_ht=scontent.fsgn5-15.fna&oh=00_AfSqI34HDHvg4FwKvQIUEhjhlghId3CT4Eub6gBPkdiO_A&oe=68A6DEBA",
      link: `/profile/${user?.id || "nguyen.hung.556587"}`,
    },
    {
      label: "Meta AI",
      icon: "https://static.xx.fbcdn.net/rsrc.php/v4/yX/r/w5I9ktz_3Ib.png",
      link: "https://www.meta.ai/",
      external: true,
    },
    {
      label: "Bạn bè",
      icon: friend,
      link: "/friends",
    },
    {
      label: "Kỷ niệm",
      icon: ki_niem,
      link: "/onthisday",
    },
    {
      label: "Đã lưu",
      icon: da_luu,
      link: "/saved",
    },
    {
      label: "Nhóm",
      icon: nhom,
      link: "/groups",
    },
    {
      label: "Video",
      icon: video,
      link: "/watch",
    },
    {
      label: "Marketplace",
      icon: marketplace,
      link: "/marketplace",
    },
  ];

  // Danh sách lối tắt nhóm
  const groupItems: GroupItem[] = [
    {
      label: "Pass Đồ Sinh Viên Giá Rẻ TP.HCM",
      icon: "https://scontent.fsgn5-15.fna.fbcdn.net/v/t39.30808-6/447843169_122043041345420024_8407522355823862737_n.png?stp=cp0_dst-png_s50x50&_nc_cat=1&ccb=1-7&_nc_sid=9bae5a&_nc_ohc=OCw7AixAzOQQ7kNvwEOopzG&_nc_oc=AdmH1xKfEKx0aKB-W_YBcdT9EsEkEpuQS7VKNqodGAi7mN8ZQnDYk0efpxRxOZa_BKcoCn2x_SEvUx6UkKe6ryq0&_nc_zt=23&_nc_ht=scontent.fsgn5-15.fna&_nc_gid=rqbUH5WJisfgdfPoUhpnZQ&oh=00_AfSucxE9Xzxbp83_RS28WSajV2gjx6eKQcDVx0hlaSFqRw&oe=688553CC",
      link: "/groups/457345977993363",
    },
    {
      label: "DCT1225",
      icon: "https://scontent.fsgn5-15.fna.fbcdn.net/v/t39.30808-6/447843169_122043041345420024_8407522355823862737_n.png?stp=cp0_dst-png_s50x50&_nc_cat=1&ccb=1-7&_nc_sid=9bae5a&_nc_ohc=OCw7AixAzOQQ7kNvwEOopzG&_nc_oc=AdmH1xKfEKx0aKB-W_YBcdT9EsEkEpuQS7VKNqodGAi7mN8ZQnDYk0efpxRxOZa_BKcoCn2x_SEvUx6UkKe6ryq0&_nc_zt=23&_nc_ht=scontent.fsgn5-15.fna&_nc_gid=rqbUH5WJisfgdfPoUhpnZQ&oh=00_AfSucxE9Xzxbp83_RS28WSajV2gjx6eKQcDVx0hlaSFqRw&oe=688553CC",
      link: "/groups/5673129169415387",
    },
    {
      label: "Hóng Hớt Đường Phố",
      icon: "https://scontent.fsgn5-15.fna.fbcdn.net/v/t39.30808-6/447843169_122043041345420024_8407522355823862737_n.png?stp=cp0_dst-png_s50x50&_nc_cat=1&ccb=1-7&_nc_sid=9bae5a&_nc_ohc=OCw7AixAzOQQ7kNvwEOopzG&_nc_oc=AdmH1xKfEKx0aKB-W_YBcdT9EsEkEpuQS7VKNqodGAi7mN8ZQnDYk0efpxRxOZa_BKcoCn2x_SEvUx6UkKe6ryq0&_nc_zt=23&_nc_ht=scontent.fsgn5-15.fna&_nc_gid=rqbUH5WJisfgdfPoUhpnZQ&oh=00_AfSucxE9Xzxbp83_RS28WSajV2gjx6eKQcDVx0hlaSFqRw&oe=688553CC",
      link: "/groups/231618002322443",
    },
    {
      label:
        "AI Code Community - Cursor, Replit, Bolt, Lovable - Share Apps & Get Help",
      icon: "https://scontent.fsgn5-15.fna.fbcdn.net/v/t39.30808-6/447843169_122043041345420024_8407522355823862737_n.png?stp=cp0_dst-png_s50x50&_nc_cat=1&ccb=1-7&_nc_sid=9bae5a&_nc_ohc=OCw7AixAzOQQ7kNvwEOopzG&_nc_oc=AdmH1xKfEKx0aKB-W_YBcdT9EsEkEpuQS7VKNqodGAi7mN8ZQnDYk0efpxRxOZa_BKcoCn2x_SEvUx6UkKe6ryq0&_nc_zt=23&_nc_ht=scontent.fsgn5-15.fna&_nc_gid=rqbUH5WJisfgdfPoUhpnZQ&oh=00_AfSucxE9Xzxbp83_RS28WSajV2gjx6eKQcDVx0hlaSFqRw&oe=688553CC",
      link: "/groups/554882150595782",
    },
    {
      label: "Nhóm Học OCP Java",
      icon: "https://scontent.fsgn5-15.fna.fbcdn.net/v/t39.30808-6/447843169_122043041345420024_8407522355823862737_n.png?stp=cp0_dst-png_s50x50&_nc_cat=1&ccb=1-7&_nc_sid=9bae5a&_nc_ohc=OCw7AixAzOQQ7kNvwEOopzG&_nc_oc=AdmH1xKfEKx0aKB-W_YBcdT9EsEkEpuQS7VKNqodGAi7mN8ZQnDYk0efpxRxOZa_BKcoCn2x_SEvUx6UkKe6ryq0&_nc_zt=23&_nc_ht=scontent.fsgn5-15.fna&_nc_gid=rqbUH5WJisfgdfPoUhpnZQ&oh=00_AfSucxE9Xzxbp83_RS28WSajV2gjx6eKQcDVx0hlaSFqRw&oe=688553CC",
      link: "/groups/709580695145831",
    },
  ];

  // Footer links
  const footerLinks = [
    { label: "Quyền riêng tư", link: "/privacy/policy" },
    { label: "Điều khoản", link: "/policies" },
    { label: "Quảng cáo", link: "/business" },
    { label: "Lựa chọn quảng cáo", link: "/help/568137493302217" },
    { label: "Cookie", link: "/policies/cookies" },
    { label: "Xem thêm", link: "#" },
  ];

  return (
    <div
      className={`app-left ${className}`}
      style={{
        background: "#f0f2f5",
        padding: "16px",
        height: "100vh",
        overflowY: "auto",
      }}
    >
      <List
        // header={
        //   <Typography.Title level={3}>Menu trên Facebook</Typography.Title>
        // }
        dataSource={menuItems}
        renderItem={(item) => (
          <List.Item style={{ padding: "8px 0" }}>
            {item.external ? (
              <a
                href={item.link}
                target="_blank"
                rel="nofollow noreferrer"
                style={{ display: "flex", alignItems: "center", width: "100%" }}
              >
                {typeof item.icon === "string" ? (
                  <Avatar
                    src={item.icon}
                    size={36}
                    shape={item.label === user?.fullname ? "circle" : "square"}
                  />
                ) : (
                  <span
                    style={{ display: "inline-block", width: 36, height: 36 }}
                  >
                    {item.icon}
                  </span>
                )}
                <Text style={{ marginLeft: 12, fontSize: 16, fontWeight: 500 }}>
                  {item.label}
                </Text>
              </a>
            ) : (
              <Link
                to={item.link}
                style={{ display: "flex", alignItems: "center", width: "100%" }}
              >
                {typeof item.icon === "string" ? (
                  <Avatar
                    src={item.icon}
                    size={36}
                    shape={item.label === user?.fullname ? "circle" : "square"}
                  />
                ) : (
                  <span
                    style={{ display: "inline-block", width: 36, height: 36 }}
                  >
                    {item.icon}
                  </span>
                )}
                <Text style={{ marginLeft: 12, fontSize: 16, fontWeight: 500 }}>
                  {item.label}
                </Text>
              </Link>
            )}
          </List.Item>
        )}
      />
      <Divider />
      <List
        header={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography.Title level={4}>Lối tắt của bạn</Typography.Title>
            <Button type="text">Chỉnh sửa</Button>
          </div>
        }
        dataSource={groupItems}
        renderItem={(item) => (
          <List.Item style={{ padding: "8px 0" }}>
            <Link
              to={item.link}
              style={{ display: "flex", alignItems: "center", width: "100%" }}
            >
              <Avatar
                src={item.icon}
                size={36}
                shape="square"
                style={{ borderRadius: 8 }}
              />
              <Text style={{ marginLeft: 12, fontSize: 16, fontWeight: 500 }}>
                {item.label}
              </Text>
            </Link>
          </List.Item>
        )}
      />
      <Divider />
      <div style={{ padding: "0 8px" }}>
        {footerLinks.map((link, index) => (
          <span key={link.label}>
            <Link to={link.link} style={{ fontSize: 14, color: "#65676b" }}>
              {link.label}
            </Link>
            {index < footerLinks.length - 1 && <span> · </span>}
          </span>
        ))}
        <div style={{ marginTop: 8, fontSize: 14, color: "#65676b" }}>
          Meta © 2025
        </div>
      </div>
    </div>
  );
};

export default AppLeft;
