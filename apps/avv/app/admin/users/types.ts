export type AdminUser = {
  id: string;
  email: string;
  role: "admin";
  createdAt: string;
  updatedAt: string;
};

export type AdminUserFormValues = {
  email: string;
  password: string;
};

export type AdminUserUpdateValues = {
  email: string;
};
