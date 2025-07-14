import axios from "@/services/axios.customize";
import type { Dayjs } from "dayjs";

// Login API
export const loginAPI = (email: string, password: string) => {
  const urlBackend = "/api/v1/auth/login";
  console.log("Calling login API with:", { email, password });
  return axios
    .post<IBackendRes<ILogin>>(urlBackend, { email, password })
    .then((res) => {
      console.log("Raw login API response:", res);
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
  const urlBackend = "/api/v1/auth/register";
  return axios.post<IBackendRes<IRegister>>(urlBackend, userData);
};

// Fetch account API
export const fetchAccountAPI = () => {
  const urlBackend = "/api/v1/auth/account";
  console.log("Calling fetchAccount API");
  return axios.get<IBackendRes<IFetchAccount>>(urlBackend).then((res) => {
    console.log("Raw fetchAccount API response:", res);
    return res;
  });
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

// Update user API
export const updateUserAPI = (
  userId: number,
  userData: {
    email: string;
    firstName: string;
    lastName: string;
    gender: "MALE" | "FEMALE" | "OTHER";
  }
) => {
  const urlBackend = `/api/v1/users/${userId}`;
  return axios.put<IBackendRes<any>>(urlBackend, userData);
};

// Delete user API
export const deleteUserAPI = (userId: number) => {
  const urlBackend = `/api/v1/users/${userId}`;
  return axios.delete<IBackendRes<any>>(urlBackend);
};

// Create role API
export const createRoleAPI = (roleData: {
  name: string;
  description: string;
  active: boolean;
  permissions: { id: number }[];
}) => {
  const urlBackend = "/api/v1/roles/create";
  return axios.post<IBackendRes<any>>(urlBackend, roleData);
};

// Update role API
export const updateRoleAPI = (
  roleId: number,
  roleData: {
    name: string;
    description: string;
    active: boolean;
    permissions: { id: number }[];
  }
) => {
  const urlBackend = `/api/v1/roles/${roleId}`;
  return axios.put<IBackendRes<any>>(urlBackend, roleData);
};

// Delete role API
export const deleteRoleAPI = (roleId: number) => {
  const urlBackend = `/api/v1/roles/${roleId}`;
  return axios.delete<IBackendRes<any>>(urlBackend);
};

// Fetch permissions API
export const fetchPermissionsAPI = () => {
  const urlBackend = "/api/v1/permissions";
  return axios.get<IBackendRes<any>>(urlBackend);
};

// Logout API
export const logoutAPI = () => {
  const urlBackend = "/api/v1/auth/logout";
  return axios.post<IBackendRes<any>>(urlBackend);
};
