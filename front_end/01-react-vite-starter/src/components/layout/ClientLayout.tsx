import { ROUTES } from "@/constants";
import { useCurrentApp } from "@/components/context/app.context";
import { Outlet, useLocation } from "react-router-dom";
import AppHeader from "./AppHeader";

function ClientLayout() {
  const location = useLocation();
  const { user, isAuthenticated } = useCurrentApp();

  const isAuthPage =
    location.pathname === ROUTES.LOGIN || location.pathname === ROUTES.REGISTER;

  // Kiểm tra xem có phải trang admin không
  const isAdminPage = location.pathname.startsWith(ROUTES.ADMIN.BASE);

  // Kiểm tra user có quyền truy cập admin không
  const hasAdminAccess =
    user?.role && user.role.permissions && user.role.permissions.length > 0;

  // Ẩn header nếu:
  // 1. Là trang auth (login/register)
  // 2. Hoặc là trang admin nhưng user không có quyền
  const shouldHideHeader = isAuthPage || (isAdminPage && !hasAdminAccess);

  return (
    <div>
      {!shouldHideHeader && <AppHeader />}
      <Outlet />
    </div>
  );
}

export default ClientLayout;
