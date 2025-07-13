import { useCurrentApp } from "@/components/context/app.context";
import { message } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface ProtectedRouteProps {
  permission: string;
  children: React.ReactNode;
}

// Component hiển thị khi không có quyền truy cập
const AccessDenied = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        textAlign: "center",
        padding: "20px",
      }}
    >
      <div style={{ fontSize: "48px", marginBottom: "20px" }}>🚫</div>
      <h1 style={{ color: "#ff4d4f", marginBottom: "10px" }}>
        Truy cập bị từ chối
      </h1>
      <p style={{ fontSize: "18px", color: "#666", marginBottom: "20px" }}>
        Bạn không có quyền truy cập trang này!
      </p>
      <p style={{ fontSize: "16px", color: "#999" }}>
        Tài khoản không có vai trò hoặc không đủ quyền hạn.
      </p>
    </div>
  );
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  permission,
  children,
}) => {
  const { user, isAuthenticated, loading } = useCurrentApp();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("ProtectedRoute - User:", user);
    console.log("ProtectedRoute - IsAuthenticated:", isAuthenticated);
    console.log("ProtectedRoute - Loading:", loading);
    console.log("ProtectedRoute - Permission required:", permission);

    // Wait for loading to complete
    if (loading) {
      console.log("ProtectedRoute - Still loading, waiting...");
      return;
    }

    if (!isAuthenticated || !user) {
      console.log("ProtectedRoute - Not authenticated or no user");
      message.error("Bạn chưa đăng nhập!");
      navigate("/login");
      return;
    }

    // Kiểm tra role và permissions nhưng không redirect
    if (!user.role) {
      console.log("ProtectedRoute - User has no role");
      message.error(
        "Bạn không có quyền truy cập trang này! Tài khoản không có vai trò."
      );
      return;
    }

    if (!user.role.permissions || user.role.permissions.length === 0) {
      console.log("ProtectedRoute - User role has no permissions");
      message.error(
        "Bạn không có quyền truy cập trang này! Tài khoản không có quyền hạn."
      );
      return;
    }

    const hasPermission = user.role.permissions.some(
      (p) => p.apiPath === permission
    );

    console.log("ProtectedRoute - User permissions:", user.role.permissions);
    console.log("ProtectedRoute - Has permission:", hasPermission);

    if (!hasPermission) {
      message.error("Bạn không có quyền truy cập trang này!");
    }
  }, [user, isAuthenticated, loading, permission, navigate]);

  // Show loading or wait for authentication check
  if (loading) {
    console.log("ProtectedRoute - Rendering loading state");
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    console.log("ProtectedRoute - Rendering null (not authenticated)");
    return null;
  }

  // Kiểm tra quyền truy cập và render component tương ứng
  if (
    !user.role ||
    !user.role.permissions ||
    user.role.permissions.length === 0
  ) {
    console.log(
      "ProtectedRoute - Rendering AccessDenied (no role/permissions)"
    );
    return <AccessDenied />;
  }

  const hasPermission = user.role.permissions.some(
    (p) => p.apiPath === permission
  );
  console.log("ProtectedRoute - Rendering children:", hasPermission);

  return hasPermission ? <>{children}</> : <AccessDenied />;
};

export default ProtectedRoute;
