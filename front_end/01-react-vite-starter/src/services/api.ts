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

// Change user activity (block/unblock) API
export const changeUserActivityAPI = (userId: number) => {
  const urlBackend = `/api/v1/users/changeActivity/${userId}`;
  return axios.put<IBackendRes<any>>(urlBackend);
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

// Logout API
export const logoutAPI = () => {
  const urlBackend = "/api/v1/auth/logout";
  return axios.post<IBackendRes<any>>(urlBackend);
};

// Create permission API
export const createPermissionAPI = (permissionData: {
  name: string;
  apiPath: string;
  method: string;
  module: string;
}) => {
  const urlBackend = "/api/v1/permissions/create";
  return axios.post<IBackendRes<any>>(urlBackend, permissionData);
};

// Update permission API
export const updatePermissionAPI = (
  permissionId: number,
  permissionData: {
    name: string;
    apiPath: string;
    method: string;
    module: string;
  }
) => {
  const urlBackend = `/api/v1/permissions/${permissionId}`;
  return axios.put<IBackendRes<any>>(urlBackend, permissionData);
};

// Delete permission API
export const deletePermissionAPI = (permissionId: number) => {
  const urlBackend = `/api/v1/permissions/${permissionId}`;
  return axios.delete<IBackendRes<any>>(urlBackend);
};

// Fetch all permissions API
export const fetchAllPermissionsAPI = (params?: any) => {
  const urlBackend = "/api/v1/permissions/fetch-all";
  return axios.get<IBackendRes<any>>(urlBackend, { params });
};

// Fetch all posts API
export const fetchAllPostsAPI = (params?: any) => {
  const urlBackend = "/api/v1/posts/fetch-all";
  return axios.get<any>(urlBackend, { params });
};

// Delete post API
export const deletePostAPI = (postId: number) => {
  const urlBackend = `/api/v1/posts/${postId}`;
  return axios.delete<any>(urlBackend);
};

// Create post API (with file upload)
export const createPostAPI = (data: {
  content: string;
  userId: number;
  file?: File;
}) => {
  const formData = new FormData();
  formData.append("content", data.content);
  formData.append("userId", String(data.userId));
  if (data.file) formData.append("file", data.file);
  return axios.post<any>("/api/v1/posts/create", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// Lấy comment theo postId
export const fetchCommentsByPostAPI = (postId: number) => {
  return axios.get(`/api/v1/comments`, { params: { postId } });
};

// Gửi comment mới
export const createCommentAPI = (
  postId: number,
  userId: number,
  content: string
) => {
  return axios.post(`/api/v1/comments/create`, null, {
    params: { postId, userId, content },
  });
};

// Gửi tin nhắn và nhận phản hồi từ bot
export const sendChatbotMessageAPI = (userId: number, message: string) => {
  return axios.post("/api/v1/chatbot/send-message", { userId, message });
};

// Lấy lịch sử chat của user
export const fetchChatbotHistoryAPI = (userId: number) => {
  return axios.get(`/api/v1/chatbot/history/${userId}`);
};

export const fetchAllMethod = () => {
  const urlBackend = "/api/v1/permissions/fetch-all";
  return axios.get<IBackendRes<any>>(urlBackend);
};
