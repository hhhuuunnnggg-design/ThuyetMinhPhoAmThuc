export {};

declare global {
  // Backend response structure
  interface IBackendRes<T> {
    error?: string | string[];
    mesage: string;
    statusCode: number | string;
    data?: T;
  }

  interface IModelPaginate<T> {
    meta: {
      current: number;
      pageSize: number;
      pages: number;
      total: number;
    };
    results: T[];
  }

  // Permission interface
  interface IPermission {
    id: number;
    name: string;
    apiPath: string;
    method: string;
    module: string;
    createdAt: string;
    updatedAt: string | null;
    createdBy: string;
    updatedBy: string | null;
  }

  // Role interface
  interface IRole {
    id: number;
    name: string;
    description: string;
    active: boolean;
    createdAt: string;
    updatedAt: string | null;
    createdBy: string;
    updatedBy: string | null;
    permissions: IPermission[];
  }

  // User interface
  interface IUser {
    id: number;
    email: string;
    fullname: string;
    role: IRole;
  }

  // Data types
  interface ILogin {
    access_token: string;
    user: {
      id: number;
      email: string;
      fullname: string;
      is_admin: boolean;
      role: IRole;
    };
  }

  interface IRegister {
    id: number;
    email: string;
    gender: string;
    fullName: string;
    createdAt: string;
  }

  interface IFetchAccount {
    user: IUser;
  }

  // User data for admin table
  interface IUserData {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    gender: string;
    createdAt: string;
  }
}
