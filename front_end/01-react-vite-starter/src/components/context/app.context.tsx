import { setAuth } from "@/redux/slice/auth.slice";
import { RootState } from "@/redux/store";
import { createContext, useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

interface IAppContext {
  isAuthenticated: boolean;
  setIsAuthenticated: (v: boolean) => void;
  setUser: (v: IUser | null) => void;
  user: IUser | null;
  loading: boolean;
}

const CurrentAppContext = createContext<IAppContext | null>(null);

type TProps = {
  children: React.ReactNode;
};

export const AppProvider = (props: TProps) => {
  //Tạo Provider AppProvider
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  //➡️ Dùng để lưu giá trị hiện tại trong Context (đồng bộ với Redux).

  const dispatch = useDispatch();

  // Lấy Redux state:
  const reduxUser = useSelector((state: RootState) => state.auth.user);
  const reduxIsAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const reduxLoading = useSelector((state: RootState) => state.auth.loading);
  //➡️ Đây là nguồn dữ liệu trung tâm ban đầu, bạn dùng để đồng bộ vào context.

  //  Đồng bộ từ Redux → Context
  useEffect(() => {
   
    setUser(reduxUser);
    setIsAuthenticated(reduxIsAuthenticated);
    setLoading(reduxLoading);
  }, [reduxUser, reduxIsAuthenticated, reduxLoading]);
  //🔄 Khi Redux thay đổi, Context cũng tự động cập nhật.

  // Đồng bộ từ Context → Redux
  const handleSetUser = (newUser: IUser | null) => {
    setUser(newUser);
    // Also update Redux state
    dispatch(setAuth({ isAuthenticated: !!newUser, user: newUser }));
  };

  // Enhanced setIsAuthenticated function that also updates Redux
  const handleSetIsAuthenticated = (value: boolean) => {
    setIsAuthenticated(value);
    // Also update Redux state
    dispatch(setAuth({ isAuthenticated: value, user: value ? user : null }));
  };

  return (
    <CurrentAppContext.Provider
      value={{
        isAuthenticated,
        user,
        setIsAuthenticated: handleSetIsAuthenticated,
        setUser: handleSetUser,
        loading,
      }}
    >
      {props.children}
    </CurrentAppContext.Provider>
  );
};

export const useCurrentApp = () => {
  const currentAppContext = useContext(CurrentAppContext);

  if (!currentAppContext) {
    throw new Error(
      "useCurrentApp has to be used within <CurrentAppContext.Provider>"
    );
  }

  return currentAppContext;
};
