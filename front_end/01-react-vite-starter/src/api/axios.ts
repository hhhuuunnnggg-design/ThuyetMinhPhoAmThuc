// api/axios.ts
import { config } from "@/config";
import { API_ENDPOINTS, ROUTES, STORAGE_KEYS } from "@/constants";
import { logger } from "@/utils/logger";
import axios from "axios";

const instance = axios.create({
  baseURL: config.api.baseURL,
  withCredentials: true,
  timeout: config.api.timeout,
});

instance.interceptors.request.use(
  (requestConfig) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      requestConfig.headers["Authorization"] = `Bearer ${token}`;
    }
    return requestConfig;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        logger.debug("Refreshing access token");
        const refreshResponse = await axios.get(
          `${config.api.baseURL}${API_ENDPOINTS.AUTH.REFRESH}`,
          {
            withCredentials: true,
          }
        );

        const newAccessToken = refreshResponse.data.data.access_token;

        if (newAccessToken) {
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
          return instance(originalRequest);
        }

        throw new Error("No access token in refresh response");
      } catch (refreshError) {
        logger.error("Refresh token failed:", refreshError);
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        window.location.href = ROUTES.LOGIN;
        return Promise.reject(refreshError);
      }
    }

    if (error?.response?.data) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
);

export default instance;
