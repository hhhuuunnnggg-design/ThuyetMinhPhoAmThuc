export const ALL_PERMISSIONS = {
  PERMISSIONS: {
    CREATE: {
      method: "POST",
      apiPath: "/api/v1/permissions",
      module: "PERMISSIONS",
    },
  },

  USERS: {
    GET_PAGINATE: {
      method: "GET",
      apiPath: "/api/v1/users/fetch-all",
      module: "USERS",
    },
    CREATE: {
      method: "POST",
      apiPath: "/api/v1/users/add-user",
      module: "USERS",
    },
    UPDATE: { method: "PUT", apiPath: "/api/v1/users/{id}", module: "USERS" },
    DELETE: {
      method: "DELETE",
      apiPath: "/api/v1/users/{id}",
      module: "USERS",
    },
  },
};

export const ALL_MODULES = {
  COMPANIES: "COMPANIES",
  USERS: "USERS",
};
