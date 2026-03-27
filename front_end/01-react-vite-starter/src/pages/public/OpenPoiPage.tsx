import { Card, Typography } from "antd";
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";

/**
 * Trang mở khi quét QR địa điểm bằng camera điện thoại (không qua app).
 * QR chứa URL dạng /open-poi?qr=<mã POI> — trình duyệt hiển thị hướng dẫn mở app.
 */
const OpenPoiPage = () => {
  const [params] = useSearchParams();
  const qr = useMemo(() => (params.get("qr") || "").trim(), [params]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#f8fafc" }}>
      <Card style={{ maxWidth: 480, width: "100%" }} title="Địa điểm — Vinh Khánh">
        <Typography.Paragraph>
          Đây là <strong>mã QR định danh địa điểm</strong> (không phải mã thanh toán ngân hàng).
        </Typography.Paragraph>
        {qr ? (
          <>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Mã POI:
            </Typography.Text>
            <Typography.Paragraph copyable={{ text: qr }} style={{ wordBreak: "break-all", fontFamily: "monospace", fontSize: 13 }}>
              {qr}
            </Typography.Paragraph>
          </>
        ) : (
          <Typography.Text type="danger">Thiếu tham số ?qr= trên URL.</Typography.Text>
        )}
        <Typography.Paragraph style={{ marginTop: 16 }}>
          Để nghe thuyết minh: mở <strong>ứng dụng Vinh Khánh</strong> → dùng chức năng quét QR trong app.
        </Typography.Paragraph>
        <Link to="/">← Về trang chủ web</Link>
      </Card>
    </div>
  );
};

export default OpenPoiPage;
