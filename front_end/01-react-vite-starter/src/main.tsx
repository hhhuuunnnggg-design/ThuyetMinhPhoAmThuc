import store from "@/redux/store";
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Provider, useDispatch } from "react-redux";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import ClientLayout from "@/components/layout/ClientLayout";

import LoginPage from "./pages/client/auth/login";
import RegisterPage from "./pages/client/auth/register";
import BookPage from "./pages/client/book";

import AdminLayout from "@/components/admin/Layout/AdminLayout";
import { AppProvider } from "@/components/context/app.context";
import { App, ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import { AdminRoute } from "./components/common/protectedRoute";

// import PermissionPage from "./pages/admin/permission";
import PermissionPage from "./components/admin/Permission/PermissionTable";

// import RolePage from "./pages/admin/role";
import RolePage from "./components/admin/Role/RoleTable";

import { ROUTES, STORAGE_KEYS } from "@/constants";
import { fetchAccountThunk } from "@/redux/slice/auth.slice";
import UsersPage from "./components/admin/User/UserTable";
import ErrorPage from "./components/common/ErrorPageRoute";
import "./styles/global.scss";

const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <ClientLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/book",
        element: <BookPage />,
      },
    ],
  },
  {
    path: ROUTES.ADMIN.BASE,
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        path: "user",
        element: <UsersPage />,
      },
      {
        path: "role",
        element: <RolePage />,
      },
      {
        path: "permission",
        element: <PermissionPage />,
      },
    ],
  },
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: ROUTES.REGISTER,
    element: <RegisterPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "*",
    element: <ErrorPage />,
  },
]);

const AppWrapper = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

    if (token) {
      dispatch(fetchAccountThunk() as any)
        .then((result: any) => {
          if (fetchAccountThunk.fulfilled.match(result)) {
            // Check if user has role, if not redirect to home
            if (!result.payload.user.role) {
              console.log("AppWrapper - User has no role, redirecting to home");
              // Context will automatically sync with Redux state
            }
          } else {
            console.log(
              "AppWrapper - Fetch account failed, but keeping token for now"
            );
            // Context will automatically sync with Redux state
          }
        })
        .catch((error: any) => {
          console.log("AppWrapper - Fetch account error:", error);
          // Context will automatically sync with Redux state
          // Only remove token on specific errors
          if (error?.response?.status === 401) {
            localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          }
        });
    }
  }, [dispatch]);

  return <RouterProvider router={router} />;
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <App>
        <AppProvider>
          <ConfigProvider locale={viVN}>
            <AppWrapper />
          </ConfigProvider>
        </AppProvider>
      </App>
    </Provider>
  </StrictMode>
);
