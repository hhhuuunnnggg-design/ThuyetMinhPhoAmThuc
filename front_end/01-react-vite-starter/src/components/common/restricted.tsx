import { useCurrentApp } from "@/components/context/app.context";

interface RestrictedProps {
  permission: string;
  method?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
// cái này dùng để ẩn các api mà user(admin) không có quyền truy cập
const Restricted: React.FC<RestrictedProps> = ({
  permission,
  method,
  children,
  fallback,
}) => {
  const { user, isAuthenticated, loading } = useCurrentApp();

  // Wait for loading to complete
  if (loading) {
    return null;
  }

  const hasPermission =
    (isAuthenticated &&
      user?.role?.permissions?.some((p) => {
        const pathMatch = p.apiPath === permission;
        const methodMatch = method ? p.method === method : true;
        return pathMatch && methodMatch;
      })) ||
    false;

  if (!hasPermission) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

export default Restricted;
