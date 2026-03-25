// config/index.ts
// Application configuration

export const config = {
  api: {
    baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:8080",
    timeout: 30000,
  },
  app: {
    name: "Thuyết Minh Ẩm Thực",
    version: "1.0.0",
  },
  payos: {
    successUrl: import.meta.env.VITE_PAYMENT_SUCCESS_URL || "http://localhost:3000/payment/success",
    cancelUrl: import.meta.env.VITE_PAYMENT_CANCEL_URL || "http://localhost:3000/payment/cancel",
  },
} as const;
