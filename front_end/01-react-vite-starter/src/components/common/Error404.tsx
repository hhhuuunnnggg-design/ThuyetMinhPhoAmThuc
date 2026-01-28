import { Button, Result } from "antd";
import { Link, useLocation, useRouteError } from "react-router-dom";

const Error404 = () => {
  const error = useRouteError();
  const location = useLocation();

  const segments = location.pathname.split("/").filter(Boolean);
  console.log("segments", segments);
  console.log("location ", location);

  let backPath = "/";
  if (segments.length > 0) {
    const first = decodeURIComponent(segments[0]); // giải mã cho chắc
    if (first === "admin" || first === "user") {
      backPath = `/${first}`;
    }
  }

  // Luôn render 404 UI; nếu có route error thì vẫn ưu tiên thông báo 404 để tránh trắng màn hình
  return (
    <div style={{ color: "red", marginTop: 100 }}>
      <Result
        status="404"
        title="404"
        subTitle={`Sorry, the page ${location.pathname} does not exist.`}
        extra={
          <Link to={backPath}>
            <Button type="primary">Back Home</Button>
          </Link>
        }
      />
      {/* giữ lại error để debug nhanh nếu cần */}
      {error ? <pre style={{ opacity: 0.4 }}>{String(error)}</pre> : null}
    </div>
  );
};

export default Error404;
