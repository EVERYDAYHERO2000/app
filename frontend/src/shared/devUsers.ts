export const DEV_USER_ID_STORAGE_KEY = 'devUserId';

export const DEV_USERS = {
  client: {
    role: 'CLIENT',
    label: 'Пользователь',
    id: '11111111-1111-1111-1111-111111111101',
  },
  driver: {
    role: 'DRIVER',
    label: 'Водитель',
    id: '11111111-1111-1111-1111-111111111103',
  },
  admin: {
    role: 'ADMIN',
    label: 'Админ',
    id: '11111111-1111-1111-1111-111111111102',
  },
} as const;

export type DevUserKey = keyof typeof DEV_USERS;

