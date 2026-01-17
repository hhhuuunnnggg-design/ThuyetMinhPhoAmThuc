// api/axios.ts
import axios from "axios";
import { config } from "@/config";
import { API_ENDPOINTS, ROUTES, STORAGE_KEYS } from "@/constants";

// Tạo instance axios
const instance = axios.create({
  baseURL: config.api.baseURL,
  withCredentials: true, // ⚡ Bắt buộc để gửi cookie refresh_token
  timeout: config.api.timeout,
});

// =========================
// Request Interceptor
// =========================
instance.interceptors.request.use(
  function (config) {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

// =========================
// Response Interceptor
// =========================
instance.interceptors.response.use(
  function (response) {
    return response.data; // Trả về response.data
  },
  async function (error) {
    console.log("error lỗi lần 1", error);
    const originalRequest = error.config;

    // Kiểm tra nếu lỗi 401 và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log("gọi API refresh token");
        // Gọi API refresh token
        const refreshResponse = await axios.get(
          `${config.api.baseURL}${API_ENDPOINTS.AUTH.REFRESH}`,
          {
            withCredentials: true, // ⚡ Gửi cookie refresh_token
          }
        );

        console.log("refreshResponse: ", refreshResponse);

        // Lấy access token mới từ response
        const newAccessToken = refreshResponse.data.data.access_token;
        console.log("newAccessToken: ", newAccessToken);

        if (newAccessToken) {
          // Lưu token mới vào localStorage
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);

          // Gắn lại token mới vào header của request cũ
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

          // Retry request cũ
          return instance(originalRequest);
        } else {
          throw new Error("No access token in refresh response");
        }
      } catch (refreshError) {
        console.error("Refresh token failed:", refreshError);

        // Nếu refresh token thất bại → logout
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        window.location.href = ROUTES.LOGIN;

        return Promise.reject(refreshError);
      }
    }

    // Trả về lỗi nếu không phải 401
    if (error && error.response && error.response.data) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
);

export default instance;
