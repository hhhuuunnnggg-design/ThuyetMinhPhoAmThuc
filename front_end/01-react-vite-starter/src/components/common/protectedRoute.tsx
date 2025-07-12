import { RootState } from "@/redux/store";
import { message } from "antd";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

interface ProtectedRouteProps {
  permission: string;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  permission,
  children,
}) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const navigate = useNavigate();

  useEffect(() => {
    const hasPermission = user?.role.permissions.some(
      (p) => p.apiPath === permission
    );
    if (!hasPermission) {
      message.error("Bạn không có quyền truy cập trang này!");
      navigate("/");
    }
  }, [user, permission, navigate]);

  return user?.role.permissions.some((p) => p.apiPath === permission) ? (
    <>{children}</>
  ) : null;
};

export default ProtectedRoute;
