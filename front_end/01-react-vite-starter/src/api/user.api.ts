// api/user.api.ts
import axios from "@/api/axios";
import { API_ENDPOINTS } from "@/constants";

// Create user API
export const createUserAPI = (userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE" | "OTHER";
}) => {
  return axios.post<IBackendRes<any>>(API_ENDPOINTS.USERS.CREATE, userData);
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
  return axios.put<IBackendRes<any>>(API_ENDPOINTS.USERS.UPDATE(userId), userData);
};

// Delete user API
export const deleteUserAPI = (userId: number) => {
  return axios.delete<IBackendRes<any>>(API_ENDPOINTS.USERS.DELETE(userId));
};

// Change user activity (block/unblock) API
export const changeUserActivityAPI = (userId: number) => {
  return axios.put<IBackendRes<any>>(API_ENDPOINTS.USERS.CHANGE_ACTIVITY(userId));
};

// Admin create user API
export const adminCreateUserAPI = (userData: {
  email: string;
  password: string;
  roleId?: number;
}) => {
  return axios.post<IBackendRes<any>>(API_ENDPOINTS.USERS.ADMIN_CREATE, userData);
};

// Admin update user API
export const adminUpdateUserAPI = (
  userId: number,
  userData: {
    email: string;
    password?: string;
    roleId?: number;
  }
) => {
  return axios.put<IBackendRes<any>>(API_ENDPOINTS.USERS.ADMIN_UPDATE(userId), userData);
};
