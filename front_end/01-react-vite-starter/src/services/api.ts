import axios from "@/services/axios.customize";
import type { Dayjs } from "dayjs";

// Login API
export const loginAPI = (email: string, password: string) => {
  const urlBackend = "/api/v1/auth/login";
  return axios.post<IBackendRes<ILogin>>(urlBackend, { email, password });
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
  const urlBackend = "/api/v1/auth/register";
  return axios.post<IBackendRes<IRegister>>(urlBackend, userData);
};

// Fetch account API
export const fetchAccountAPI = () => {
  const urlBackend = "/api/v1/auth/account";
  return axios.get<IBackendRes<IFetchAccount>>(urlBackend);
};

// Create user API
export const createUserAPI = (userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE" | "OTHER";
}) => {
  const urlBackend = "/api/v1/users/add-user";
  return axios.post<IBackendRes<any>>(urlBackend, userData);
};

// Logout API
export const logoutAPI = () => {
  const urlBackend = "/api/v1/auth/logout";
  return axios.post<IBackendRes<any>>(urlBackend);
};
