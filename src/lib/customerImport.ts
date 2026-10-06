import { createHash } from 'node:crypto';

const text = (value: unknown) => String(value ?? '').trim();
const canonical = (value: string) => value.normalize('NFC').replace(/\s+/g, ' ').toLocaleLowerCase('vi');

export function customerFromRow(row: Record<string, unknown>) {
  const name = text(row['Họ và tên khách'] ?? row['Tên']);
  if (!name) return null;
  const phoneRaw = text(row['Thông tin liên hệ gốc']) || text(row['Số điện thoại']);
  // Keep annotated contacts and irregular numbers in their original form too.
  const parts = phoneRaw.match(/^([+\d\s.()]+)\s*(?:[-–—]\s*(.*))?$/);
  const phone = parts ? parts[1].replace(/[\s.()]/g, '') : phoneRaw;
  const contactName = parts?.[2]?.trim() || '';
  const departmentAddress = text(row['Địa chỉ (bộ phận)']);
  const deliveryAddress = text(row['Địa điểm giao hàng']);
  const address = text(row['Địa chỉ khách hàng'] ?? row['Địa chỉ']) || departmentAddress || deliveryAddress;
  const key = [name, phone, address, deliveryAddress].map(canonical);
  return {
    name, phone, phoneRaw, contactName, address, departmentAddress, deliveryAddress,
    email: text(row['Email']),
    type: row['Loại khách'] === 'Sỉ' ? 'wholesale' : 'retail',
    ordersCount: Number(row['Tổng đơn']) || 0,
    totalSpent: Number(row['Tổng chi tiêu']) || 0,
    importKey: createHash('sha256').update(JSON.stringify(key)).digest('hex'),
  };
}

export async function importCustomerRows(rows: Record<string, unknown>[], model: any) {
  const result = { inserted: 0, existing: 0, skipped: 0, missingPhone: 0, warnings: [] as { row: number; message: string }[] };
  for (const [index, row] of rows.entries()) {
    const customer = customerFromRow(row);
    if (!customer) { result.skipped++; continue; }
    if (!customer.phone) result.missingPhone++;
    else if (!/^(0\d{9}|\+84\d{9}|84\d{9})$/.test(customer.phone)) {
      result.warnings.push({ row: index + 2, message: 'Số điện thoại cần kiểm tra; đã giữ nguyên số trong file.' });
    }
    // Do not overwrite existing profiles, spending or points.
    const existing = await model.findOne({ $or: [
      { importKey: customer.importKey },
      { importKey: { $exists: false }, name: customer.name, phone: customer.phone, address: customer.address,
        ...(customer.deliveryAddress ? { $or: [{ deliveryAddress: customer.deliveryAddress }, { deliveryAddress: { $exists: false } }, { deliveryAddress: '' }] } : {}) },
    ] });
    if (existing) {
      const additions: Record<string, string> = {};
      for (const field of ['importKey', 'phoneRaw', 'contactName', 'departmentAddress', 'deliveryAddress'] as const) {
        if (!existing[field] && customer[field]) additions[field] = customer[field];
      }
      if (Object.keys(additions).length) await model.updateOne({ _id: existing._id }, { $set: additions });
      result.existing++;
    } else {
      try { await model.create(customer); result.inserted++; }
      catch (error: any) {
        if (error.code === 11000 && error.keyPattern?.importKey) result.existing++;
        else throw error;
      }
    }
  }
  return result;
}
