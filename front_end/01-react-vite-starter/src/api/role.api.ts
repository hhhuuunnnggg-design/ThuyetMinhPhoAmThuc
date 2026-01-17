// api/role.api.ts
import axios from "@/api/axios";
import { API_ENDPOINTS } from "@/constants";

// Fetch all roles API
export const fetchAllRolesAPI = (params?: any) => {
  return axios.get<IBackendRes<any>>(API_ENDPOINTS.ROLES.FETCH_ALL, { params });
};

// Create role API
export const createRoleAPI = (roleData: {
  name: string;
  description: string;
  active: boolean;
  permissionIds: number[];
}) => {
  return axios.post<IBackendRes<any>>(API_ENDPOINTS.ROLES.CREATE, roleData);
};

// Update role API
export const updateRoleAPI = (
  roleId: number,
  roleData: {
    name: string;
    description: string;
    active: boolean;
    permissionIds: number[];
  }
) => {
  return axios.put<IBackendRes<any>>(API_ENDPOINTS.ROLES.UPDATE(roleId), roleData);
};

// Delete role API
export const deleteRoleAPI = (roleId: number) => {
  return axios.delete<IBackendRes<any>>(API_ENDPOINTS.ROLES.DELETE(roleId));
};
