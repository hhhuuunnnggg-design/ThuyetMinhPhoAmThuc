export {};

// output type
declare global {
  // dạng trả về của data type
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

  //các data type
  interface ILogin {
    access_token: string;
    user: {
      id: number;
      email: string;
      fullname: string;
      is_admin: boolean;
    };
  }

  interface IRegister {
    id: number;
    email: string;
    gender: string;
    fullName: string;
    createdAt: string;
  }

  interface IUser {
    id: number;
    email: string;
    fullname: string;
    is_admin: boolean;
  }
  interface IFetchAccount {
    user: IUser;
  }
}
