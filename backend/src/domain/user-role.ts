export const USER_ROLE = {
  CLIENT: 'CLIENT',
  ADMIN: 'ADMIN',
  DRIVER: 'DRIVER',
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export function isUserRole(role: string): role is UserRole {
  return role === USER_ROLE.CLIENT || role === USER_ROLE.ADMIN || role === USER_ROLE.DRIVER;
}
