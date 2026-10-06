export function warehouseAddress(warehouse?: { address?: string; location?: string }) {
  return warehouse?.address?.trim() || warehouse?.location?.trim() || '';
}

export function warehouseInput(input: Record<string, unknown>) {
  const result = { ...input };
  if (input.address !== undefined || input.location !== undefined) {
    const value = input.address ?? input.location;
    if (typeof value !== 'string' || value.length > 1000) throw new Error('Địa chỉ kho phải là văn bản, tối đa 1.000 ký tự.');
    result.address = value.trim();
    result.location = value.trim();
  }
  if (input.name !== undefined) {
    if (typeof input.name !== 'string' || !input.name.trim()) throw new Error('Vui lòng nhập tên kho.');
    result.name = input.name.trim();
  }
  return result;
}
