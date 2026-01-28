import { ROUTES } from "@/constants";
import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";

// UI 403 dùng chung (Access Denied)
export const AccessDenied = () => {
  const navigate = useNavigate();
  return (
    <Result
      status="403"
      title="403"
      subTitle="Sorry, you are not authorized to access this page."
      extra={
        <Button type="primary" onClick={() => navigate(ROUTES.HOME)}>
          Back Home
        </Button>
      }
    />
  );
};

// Trang 403 (dùng khi mapping route trực tiếp nếu muốn)
const Error403 = () => <AccessDenied />;

export default Error403;

