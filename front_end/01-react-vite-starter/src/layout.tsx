import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useCurrentApp } from "./components/context/app.context";
// import { fetchAccountAPI } from "services/api";
import AppHeader from "./components/layout/app.header";
import { fetchAccountAPI } from "./services/api";

function Layout() {
  const { setUser } = useCurrentApp();

  useEffect(() => {
    const fetchAccount = async () => {
      const res = await fetchAccountAPI();
      if (res.data) {
        setUser(res.data.user);
      }
      console.log("check res>>>", res);
    };

    fetchAccount();
  }, []);
  return (
    <div>
      <AppHeader />
      <Outlet />
    </div>
  );
}

export default Layout;
