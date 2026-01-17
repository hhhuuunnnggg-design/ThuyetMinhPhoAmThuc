import store from "@/redux/store";
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Provider, useDispatch } from "react-redux";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Layout from "./layout";

import LoginPage from "./pages/client/auth/login";
import RegisterPage from "./pages/client/auth/register";
import BookPage from "./pages/client/book";
// import ProtectedRoute from "./components/common/protectedRoute";

import { AppProvider } from "@/components/context/app.context";
import { App, ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import LayoutAdmin from "./components/admin/Layout/layout.admin";
import { AdminRoute } from "./components/common/protectedRoute";
import AppCenter from "./components/layout/app.center";
import AppLeft from "./components/layout/app.left";
import AppRight from "./components/layout/app.right";
// import PermissionPage from "./pages/admin/permission";
import PermissionPage from "./components/admin/Permission/PermissionTable";

// import RolePage from "./pages/admin/role";
import RolePage from "./components/admin/Role/RoleTable";

import UsersPage from "./components/admin/User/UserTable";
import ErrorPage from "./components/common/ErrorPageRoute";
import { fetchAccountThunk } from "./redux/slice/auth.slice";
import "./styles/global.scss";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: (
          <div className="main-layout-flex">
            <AppLeft className="app-left" />
            <AppCenter className="app-center" />
            <AppRight className="app-right" />
          </div>
        ),
      },
      {
        path: "/book",
        element: <BookPage />,
      },
    ],
  },
  {
    path: "/admin",
    element: (
      <AdminRoute>
        <LayoutAdmin />
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
    path: "/login",
    element: <LoginPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/register",
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
    const token = localStorage.getItem("access_token");
  

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
            localStorage.removeItem("access_token");
          }
        });
    } else {
      
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
