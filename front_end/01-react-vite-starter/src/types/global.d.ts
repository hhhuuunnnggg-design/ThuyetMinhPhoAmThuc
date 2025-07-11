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
      email: string;
      phone: string;
      fullName: string;
      role: string;
      avatar: string;
      id: string;
    };
  }

  interface IRegister {
    _id: string;
    email: string;
    fullName: string;
  }

  interface IRegister {
    id: number;
    email: string;
    gender: string;
    fullName: string;
    createdAt: string;
  }
}
