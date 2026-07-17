export type UserRole = 'USER' | 'BUSINESS' | 'MODERATOR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'PENDING';

export interface CurrentUser {
  id: string;
  zaloId: string | null;
  phone: string | null;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const ADMIN_ROLES: UserRole[] = ['MODERATOR', 'ADMIN'];

export interface UserAdminQuery {
  page: number;
  limit: number;
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  USER: 'Người dùng',
  BUSINESS: 'Business',
  MODERATOR: 'Kiểm duyệt viên',
  ADMIN: 'Quản trị viên',
};

export const USER_ROLE_COLOR: Record<UserRole, string> = {
  USER: 'default',
  BUSINESS: 'purple',
  MODERATOR: 'blue',
  ADMIN: 'red',
};

export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: 'Đang hoạt động',
  BLOCKED: 'Đã khóa',
  PENDING: 'Chờ kích hoạt',
};

export const USER_STATUS_COLOR: Record<UserStatus, string> = {
  ACTIVE: 'green',
  BLOCKED: 'red',
  PENDING: 'gold',
};
