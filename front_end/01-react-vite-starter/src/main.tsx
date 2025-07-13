import store from "@/redux/store";
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Provider, useDispatch } from "react-redux";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Layout from "./layout";
import AboutPage from "./pages/client/about";
import LoginPage from "./pages/client/auth/login";
import RegisterPage from "./pages/client/auth/register";
import BookPage from "./pages/client/book";
// import ProtectedRoute from "./components/common/protectedRoute";

import { AppProvider } from "@/components/context/app.context";
import { App, ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import ProtectedRoute from "./components/common/protectedRoute";
import LayoutAdmin from "./components/layout/layout.admin";
import UsersPage from "./pages/admin/users";
import HomePage from "./pages/client/home";
import { fetchAccountThunk } from "./redux/slice/auth.slice";
import "./styles/global.scss";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "/book",
        element: <BookPage />,
      },
      {
        path: "/about",
        element: <AboutPage />,
      },
    ],
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute permission="/api/v1/users/fetch-all">
        <LayoutAdmin />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "user",
        element: <UsersPage />,
      },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
]);

const AppWrapper = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    console.log("AppWrapper - Token found:", token);

    if (token) {
      console.log("AppWrapper - Fetching account...");
      dispatch(fetchAccountThunk() as any)
        .then((result: any) => {
          console.log("AppWrapper - Fetch account result:", result);
          if (fetchAccountThunk.fulfilled.match(result)) {
            console.log(
              "AppWrapper - Setting authenticated user:",
              result.payload.user
            );
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
      console.log("AppWrapper - No token found");
      // Context will automatically sync with Redux state
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
