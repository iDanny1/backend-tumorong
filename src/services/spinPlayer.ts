import mongoose from 'mongoose';
import type { ISpinUser } from '../models/SpinUser.js';

export const PRODUCT_PRIZE_MIN_SPENT = 200_000;

// Chuẩn hóa số điện thoại VN (84xxx -> 0xxx).
export function normalizePhone(rawPhone: string): string {
  let phone = String(rawPhone || '').trim().replace(/[^0-9+]/g, '');
  if (phone.startsWith('+84')) {
    phone = '0' + phone.slice(3);
  } else if (phone.startsWith('84') && phone.length > 9) {
    phone = '0' + phone.slice(2);
  }
  return phone.replace(/[^0-9]/g, '');
}

export function isTestSpinUser(user?: Pick<ISpinUser, 'phone'> | null, phoneOrZaloId?: string): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  const testPhones = (process.env.TEST_PHONES || '').split(',').map(phone => phone.trim()).filter(Boolean);
  return Boolean(
    (user?.phone && testPhones.includes(user.phone)) ||
    (phoneOrZaloId && testPhones.includes(phoneOrZaloId))
  );
}

export async function getCustomerTotalSpent(phone: string): Promise<number> {
  try {
    const CustomerModel = (mongoose.models.Customer
      ?? mongoose.model('Customer', new mongoose.Schema({}, { strict: false }))) as mongoose.Model<{
        phone: string;
        totalSpent?: number;
      }>;
    const customer = await CustomerModel.findOne({ phone }).select('totalSpent').lean();
    return Number(customer?.totalSpent ?? 0);
  } catch {
    return 0;
  }
}
