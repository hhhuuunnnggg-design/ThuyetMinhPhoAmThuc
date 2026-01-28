import { AccessDenied } from "@/components/common/Error403";
import { useCurrentApp } from "@/components/context/app.context";
import { ROUTES } from "@/constants";
import { message } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface AdminRouteProps {
  children: React.ReactNode;
}

// Guard cho route admin - yêu cầu đăng nhập và có role
const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isAuthenticated, loading } = useCurrentApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated || !user) {
      message.error("Bạn chưa đăng nhập!");
      navigate(ROUTES.LOGIN);
      return;
    }

    if (!user.role) {
      message.error("Bạn không có quyền truy cập trang quản trị!");
    }
  }, [user, isAuthenticated, loading, navigate]);

  if (loading) return <div>Loading...</div>;

  // Chưa đăng nhập thì `useEffect` sẽ điều hướng về login; render null để tránh flash UI
  if (!isAuthenticated || !user) return null;

  // Có đăng nhập nhưng không có role => hiển thị 403
  if (!user.role) return <AccessDenied />;

  return <>{children}</>;
};

export default AdminRoute;
