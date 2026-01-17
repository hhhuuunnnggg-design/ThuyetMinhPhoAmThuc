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

export const AppProvider = ({ children }: TProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const dispatch = useDispatch();

  const reduxUser = useSelector((state: RootState) => state.auth.user);
  const reduxIsAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const reduxLoading = useSelector((state: RootState) => state.auth.loading);

  useEffect(() => {
    setUser(reduxUser);
    setIsAuthenticated(reduxIsAuthenticated);
    setLoading(reduxLoading);
  }, [reduxUser, reduxIsAuthenticated, reduxLoading]);

  const handleSetUser = (newUser: IUser | null) => {
    setUser(newUser);
    dispatch(setAuth({ isAuthenticated: !!newUser, user: newUser }));
  };

  const handleSetIsAuthenticated = (value: boolean) => {
    setIsAuthenticated(value);
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
      {children}
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
