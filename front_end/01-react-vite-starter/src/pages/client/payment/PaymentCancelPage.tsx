import { CloseCircleFilled, HomeOutlined } from "@ant-design/icons";
import { Button, Card, Result } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import ClientLayout from "@/components/layout/ClientLayout";
import { ROUTES } from "@/constants";

const PaymentCancelContent = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderCode = searchParams.get("orderCode");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Card
        style={{
          maxWidth: 480,
          width: "100%",
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          textAlign: "center",
        }}
      >
        <Result
          status="error"
          icon={<CloseCircleFilled style={{ color: "#ff4d4f", fontSize: 64 }} />}
          title="Thanh toán đã hủy"
          subTitle={
            orderCode
              ? `Đơn hàng ${orderCode} đã bị hủy. Bạn có thể thử lại thanh toán.`
              : "Giao dịch đã bị hủy. Bạn có thể thử lại thanh toán."
          }
          extra={[
            <Button
              key="home"
              type="primary"
              size="large"
              icon={<HomeOutlined />}
              onClick={() => navigate(ROUTES.HOME)}
              style={{ borderRadius: 8 }}
            >
              Về trang chủ
            </Button>,
          ]}
        />
      </Card>
    </div>
  );
};

const PaymentCancelPage = () => (
  <ClientLayout>
    <PaymentCancelContent />
  </ClientLayout>
);

export default PaymentCancelPage;
