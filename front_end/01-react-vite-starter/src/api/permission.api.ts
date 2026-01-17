// api/permission.api.ts
import axios from "@/api/axios";
import { API_ENDPOINTS } from "@/constants";

// Create permission API
export const createPermissionAPI = (permissionData: {
  name: string;
  apiPath: string;
  method: string;
  module: string;
}) => {
  return axios.post<IBackendRes<any>>(API_ENDPOINTS.PERMISSIONS.CREATE, permissionData);
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
  return axios.put<IBackendRes<any>>(API_ENDPOINTS.PERMISSIONS.UPDATE(permissionId), permissionData);
};

// Delete permission API
export const deletePermissionAPI = (permissionId: number) => {
  return axios.delete<IBackendRes<any>>(API_ENDPOINTS.PERMISSIONS.DELETE(permissionId));
};

// Fetch all permissions API
export const fetchAllPermissionsAPI = (params?: any) => {
  return axios.get<IBackendRes<any>>(API_ENDPOINTS.PERMISSIONS.FETCH_ALL, { params });
};

// Fetch all methods (alias for fetchAllPermissionsAPI)
export const fetchAllMethod = () => {
  return axios.get<IBackendRes<any>>(API_ENDPOINTS.PERMISSIONS.FETCH_ALL);
};
