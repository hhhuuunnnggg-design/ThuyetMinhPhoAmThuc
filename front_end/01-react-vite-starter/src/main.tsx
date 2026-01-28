import store from "@/redux/store";
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Provider, useDispatch } from "react-redux";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import ClientLayout from "@/components/layout/ClientLayout";

import LoginPage from "./pages/client/auth/login";
import RegisterPage from "./pages/client/auth/register";
import BookPage from "./pages/client/book";
import TTSPage from "./pages/client/tts";

import AdminLayout from "@/components/admin/Layout/AdminLayout";
import { AppProvider } from "@/components/context/app.context";
import { App, ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import PermissionPage from "./components/admin/Permission/PermissionTable";
import RolePage from "./components/admin/Role/RoleTable";
import TTSAudioPage from "./components/admin/TTSAudio/TTSAudioTable";
import { AdminRoute } from "./components/common/Error403";

import { ROUTES, STORAGE_KEYS } from "@/constants";
import { fetchAccountThunk } from "@/redux/slice/auth.slice";
import { logger } from "@/utils/logger";
import UsersPage from "./components/admin/User/UserTable";
import Error404 from "./components/common/Error404";
import Error500 from "./components/common/Error500";
import "./styles/global.scss";

const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <ClientLayout />,
    errorElement: <Error500 />,
    children: [
      {
        path: "/book",
        element: <BookPage />,
      },
      {
        path: ROUTES.TTS,
        element: <TTSPage />,
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
    errorElement: <Error500 />,
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
      {
        path: "tts-audio",
        element: <TTSAudioPage />,
      },
    ],
  },
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
    errorElement: <Error500 />,
  },
  {
    path: ROUTES.REGISTER,
    element: <RegisterPage />,
    errorElement: <Error500 />,
  },
  {
    path: "*",
    element: <Error404 />,
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
            if (!result.payload.user.role) {
              logger.debug("User has no role");
            }
          } else {
            logger.warn("Fetch account failed, but keeping token");
          }
        })
        .catch((error: any) => {
          logger.error("Fetch account error:", error);
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
