import axios from "./axios";

export const getDeviceConfigsAPI = (
  page: number = 1,
  size: number = 10,
  sortBy: string = "createdAt",
  sortDir: string = "desc"
) => {
  return axios.get("/api/v1/admin/device-configs", {
    params: { page, size, sortBy, sortDir },
  });
};
