import bcrypt from 'bcryptjs';

export function hashStaffPassword(password: string) {
  return bcrypt.hash(password, 10);
}
