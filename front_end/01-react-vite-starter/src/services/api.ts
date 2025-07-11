import axios from "@/services/axios.customize";
import type { Dayjs } from "dayjs";

export const loginAPI = (email: string, password: string) => {
  const urlBackend = "/api/v1/auth/login";
  return axios.post<IBackendRes<ILogin>>(urlBackend, { email, password });
};
//phần test ở posman
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
  const urlBackend = "/api/v1/auth/register";
  return axios.post<IBackendRes<IRegister>>(urlBackend, userData);
};

export const fetchAccountAPI = () => {
  const urlBackend = "/api/v1/auth/account";
  return axios.get<IBackendRes<IFetchAccount>>(urlBackend);
};
