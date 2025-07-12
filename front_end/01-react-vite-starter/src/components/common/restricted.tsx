import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";

interface RestrictedProps {
  permission: string;
  children: React.ReactNode;
}

const Restricted: React.FC<RestrictedProps> = ({ permission, children }) => {
  const user = useSelector((state: RootState) => state.auth.user);

  const hasPermission =
    user?.role.permissions.some((p) => p.apiPath === permission) || false;

  return hasPermission ? <>{children}</> : null;
};

export default Restricted;
