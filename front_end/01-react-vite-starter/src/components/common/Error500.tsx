import { Button, Result, Typography } from "antd";
import { Link, useLocation, useRouteError } from "react-router-dom";

function normalizeErrorMessage(error: unknown): string {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

const Error500 = () => {
  const error = useRouteError();
  const location = useLocation();

  const message = normalizeErrorMessage(error);

  return (
    <Result
      status="500"
      title="500"
      subTitle="Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau."
      extra={
        <Link to="/">
          <Button type="primary">Về trang chủ</Button>
        </Link>
      }
    >
      <Typography.Paragraph style={{ marginBottom: 0 }}>
        <Typography.Text strong>Path:</Typography.Text>{" "}
        <Typography.Text code>{location.pathname}</Typography.Text>
      </Typography.Paragraph>
      <Typography.Paragraph style={{ marginBottom: 0 }}>
        <Typography.Text strong>Detail:</Typography.Text>{" "}
        <Typography.Text code>{message}</Typography.Text>
      </Typography.Paragraph>
    </Result>
  );
};

export default Error500;
