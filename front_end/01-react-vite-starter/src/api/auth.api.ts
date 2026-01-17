// api/auth.api.ts
import axios from "@/api/axios";
import { API_ENDPOINTS } from "@/constants";
import type { Dayjs } from "dayjs";

// Login API
export const loginAPI = (email: string, password: string) => {
  return axios
    .post<IBackendRes<ILogin>>(API_ENDPOINTS.AUTH.LOGIN, { email, password })
    .then((res) => {
      return res;
    });
};

// Register API
export const registerAPI = (userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Dayjs | null;
  gender?: "MALE" | "FEMALE" | "OTHER";
  work?: string;
  education?: string;
  current_city?: string;
  hometown?: string;
  bio?: string;
}) => {
  return axios.post<IBackendRes<IRegister>>(API_ENDPOINTS.AUTH.REGISTER, userData);
};

// Fetch account API
export const fetchAccountAPI = () => {
  return axios.get<IBackendRes<IFetchAccount>>(API_ENDPOINTS.AUTH.ACCOUNT).then((res) => {
    return res;
  });
};

// Logout API
export const logoutAPI = () => {
  return axios.post<IBackendRes<any>>(API_ENDPOINTS.AUTH.LOGOUT);
};
