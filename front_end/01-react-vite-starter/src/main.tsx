import store from "@/redux/store";
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Provider, useDispatch } from "react-redux";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";

import Layout from "./layout";
import UsersPage from "./pages/admin/users";
import AboutPage from "./pages/client/about";
import LoginPage from "./pages/client/auth/login";
import RegisterPage from "./pages/client/auth/register";
import BookPage from "./pages/client/book";
// import ProtectedRoute from "./components/common/protectedRoute";

import { AppProvider, useCurrentApp } from "@/components/context/app.context";
import { App } from "antd";
import ProtectedRoute from "./components/common/protectedRoute";
import HomePage from "./pages/client/home";
import { fetchAccountThunk } from "./redux/slice/auth.slice";
import "./styles/global.scss";

const AppWrapper = () => {
  const dispatch = useDispatch();
  const { setIsAuthenticated, setUser } = useCurrentApp();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      dispatch(fetchAccountThunk()).then((result) => {
        if (fetchAccountThunk.fulfilled.match(result)) {
          setIsAuthenticated(true);
          setUser(result.payload.user);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      });
    }
  }, [dispatch, setIsAuthenticated, setUser]);

  return <RouterProvider router={router} />;
};
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
      {
        path: "/admin",
        element: (
          <ProtectedRoute permission="/api/v1/users/fetch-all">
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <UsersPage />,
          },
        ],
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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <App>
        <AppProvider>
          <AppWrapper />
          {/* <RouterProvider router={router} /> */}
        </AppProvider>
      </App>
    </Provider>
  </StrictMode>
);
