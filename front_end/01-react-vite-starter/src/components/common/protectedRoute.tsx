import { useCurrentApp } from "@/components/context/app.context";
import { ROUTES } from "@/constants";
import { Button, message, Result } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface ProtectedRouteProps {
  permission: string;
  children: React.ReactNode;
}

interface AdminRouteProps {
  children: React.ReactNode;
}

const AccessDenied = () => {
  const navigate = useNavigate();
  return (
    <Result
      status="403"
      title="403"
      subTitle="Sorry, you are not authorized to access this page."
      extra={
        <Button type="primary" onClick={() => navigate(ROUTES.HOME)}>
          Back Home
        </Button>
      }
    />
  );
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  permission,
  children,
}) => {
  const { user, isAuthenticated, loading } = useCurrentApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!isAuthenticated || !user) {
      message.error("Bạn chưa đăng nhập!");
      navigate(ROUTES.LOGIN);
      return;
    }

    // Kiểm tra role và permissions nhưng không redirect
    if (!user.role) {
      message.error(
        "Bạn không có quyền truy cập trang này! Tài khoản không có vai trò."
      );
      return;
    }

    if (!user.role.permissions || user.role.permissions.length === 0) {
      message.error(
        "Bạn không có quyền truy cập trang này! Tài khoản không có quyền hạn."
      );
      return;
    }

    const hasPermission = user.role.permissions.some(
      (p) => p.apiPath === permission
    );

    if (!hasPermission) {
      message.error("Bạn không có quyền truy cập trang này!");
    }
  }, [user, isAuthenticated, loading, permission, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // Kiểm tra quyền truy cập và render component tương ứng
  if (
    !user.role ||
    !user.role.permissions ||
    user.role.permissions.length === 0
  ) {
    return <AccessDenied />;
  }

  const hasPermission = user.role.permissions.some(
    (p) => p.apiPath === permission
  );

  return hasPermission ? <>{children}</> : <AccessDenied />;
};

// Component cho route admin - chỉ yêu cầu đăng nhập và có role
const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isAuthenticated, loading } = useCurrentApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!isAuthenticated || !user) {
      message.error("Bạn chưa đăng nhập!");
      navigate(ROUTES.LOGIN);
      return;
    }

    if (!user.role) {
      message.error("Bạn không có quyền truy cập trang quản trị!");
      return;
    }
  }, [user, isAuthenticated, loading, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !user || !user.role) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
export { AdminRoute };

