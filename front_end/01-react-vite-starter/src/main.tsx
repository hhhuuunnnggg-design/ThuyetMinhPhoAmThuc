import store from "@/redux/store";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Layout from "./layout";
import UsersPage from "./pages/admin/users";
import AboutPage from "./pages/client/about";
import LoginPage from "./pages/client/auth/login";
import RegisterPage from "./pages/client/auth/register";
import BookPage from "./pages/client/book";

import { AppProvider } from "@/components/context/app.context";
import { App } from "antd";
import HomePage from "./pages/client/home";
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
      {
        path: "/admin",
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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <App>
        <AppProvider>
          <RouterProvider router={router} />
        </AppProvider>
      </App>
    </Provider>
  </StrictMode>
);
