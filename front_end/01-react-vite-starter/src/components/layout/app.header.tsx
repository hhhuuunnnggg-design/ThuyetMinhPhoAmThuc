import Restricted from "@/components/common/restricted";
import { useCurrentApp } from "@/components/context/app.context";
import { logout } from "@/redux/slice/auth.slice";
import { logoutAPI } from "@/services/api";
import { Button, message } from "antd";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

const AppHeader = () => {
  const { user, isAuthenticated, loading } = useCurrentApp();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutAPI();
      dispatch(logout());
      localStorage.removeItem("access_token");
      message.success("Đăng xuất thành công!");
      navigate("/login");
    } catch (error: any) {
      message.error(error.mesage || "Đăng xuất thất bại!");
    }
  };

  return (
    <div style={{ padding: 16, borderBottom: "1px solid #e8e8e8" }}>
      <h2>App Header</h2>
      {!loading && isAuthenticated && user && (
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <p>Xin chào, {user.fullname}</p>
          <Restricted permission="/api/v1/users/fetch-all">
            <Link to="/admin/user">
              <Button type="primary">Quản trị</Button>
            </Link>
          </Restricted>
          <Button onClick={handleLogout}>Đăng xuất</Button>
        </div>
      )}
    </div>
  );
};

export default AppHeader;
