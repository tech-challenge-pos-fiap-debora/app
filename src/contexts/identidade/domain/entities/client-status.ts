export enum ClientStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export function isClientActive(status: string): boolean {
  return status === ClientStatus.ACTIVE;
}
