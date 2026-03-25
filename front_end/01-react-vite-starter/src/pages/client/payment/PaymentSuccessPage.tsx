import { CheckCircleFilled, HomeOutlined, ShopOutlined } from "@ant-design/icons";
import { Button, Card, Result, Spin } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getPaymentAPI } from "@/api/app.api";
import ClientLayout from "@/components/layout/ClientLayout";
import { ROUTES } from "@/constants";

const PaymentSuccessContent = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const paymentId = searchParams.get("paymentId");
  const orderCode = searchParams.get("orderCode");

  useEffect(() => {
    const fetchPayment = async () => {
      if (!paymentId) {
        setLoading(false);
        return;
      }
      try {
        const res: any = await getPaymentAPI(Number(paymentId));
        setPaymentData(res?.data?.data ?? res?.data ?? null);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchPayment();
  }, [paymentId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #52c41a 0%, #73d13d 100%)",
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
          status="success"
          icon={<CheckCircleFilled style={{ color: "#52c41a", fontSize: 64 }} />}
          title="Thanh toán thành công!"
          subTitle={
            paymentData
              ? `Món: ${paymentData.poiName || "—"} — ${formatCurrency(paymentData.amount || 0)}`
              : orderCode
              ? `Mã đơn: ${orderCode}`
              : "Cảm ơn bạn đã thanh toán."
          }
          extra={[
            loading ? (
              <Spin key="spin" />
            ) : (
              <div key="info" style={{ marginBottom: 24 }}>
                {paymentData && (
                  <>
                    <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>
                      Mã giao dịch PayOS
                    </div>
                    <div style={{ fontFamily: "monospace", color: "#1677ff" }}>
                      {paymentData.payosTransactionId || "—"}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                      Thanh toán lúc:{" "}
                      {paymentData.paidAt
                        ? new Date(paymentData.paidAt).toLocaleString("vi-VN")
                        : "—"}
                    </div>
                  </>
                )}
              </div>
            ),
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
            <Button
              key="pois"
              size="large"
              icon={<ShopOutlined />}
              onClick={() => navigate(ROUTES.ADMIN.POIS)}
              style={{ borderRadius: 8 }}
            >
              Quản lý POI
            </Button>,
          ]}
        />
      </Card>
    </div>
  );
};

const PaymentSuccessPage = () => (
  <ClientLayout>
    <PaymentSuccessContent />
  </ClientLayout>
);

export default PaymentSuccessPage;
