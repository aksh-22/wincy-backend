export enum Permission {
  CREATE_INVOICE = 'CREATE_INVOICE',
  GET_INVOICES = 'GET_INVOICES',
  GIVE_PERMISSION = 'GIVE_PERMISSION',
  BASIC_USER = 'BASIC_USER',
  ADMIN_USER = 'ADMIN_USER',
}

export const permissionArray = [
  Permission.CREATE_INVOICE,
  Permission.GET_INVOICES,
  Permission.GIVE_PERMISSION,
  Permission.ADMIN_USER,
  Permission.BASIC_USER,
];
