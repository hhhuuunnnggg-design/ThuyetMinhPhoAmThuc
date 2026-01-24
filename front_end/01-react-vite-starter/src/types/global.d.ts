export { };

declare global {
  // Backend response structure
  interface IBackendRes<T> {
    error?: string | string[];
    message: string;
    statusCode: number | string;
    data?: T;
  }


  interface IModelPaginate<T> {
    meta: {
      page: number;
      pageSize: number;
      pages: number;
      total: number;
    };
    result: T[];
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
    avatar?: string;
    coverPhoto?: string;
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
      avatar?: string;
      coverPhoto?: string;
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
    avatar: string | null;
    coverPhoto: string | null;
    fullname: string;
    dateOfBirth: string;
    gender: string | null;
    work: string | null;
    education: string | null;
    currentCity: string | null;
    hometown: string | null;
    bio: string | null;
    createdAt: string;
    role: {
      id: number;
      name: string;
    } | null;
    isBlocked: boolean;
    isAdmin: boolean;
  }


}
