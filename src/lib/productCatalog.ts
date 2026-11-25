import { z } from 'zod';

const text = z.string().trim().max(500);
const amount = z.number().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const catalogFields = z.object({
  name: text.min(1), price: amount, originalPrice: amount, sku: text.max(120), barcode: text,
  description: z.string().max(200000), images: z.array(z.string()).max(10),
  categoryIds: z.array(text), categoryNames: z.array(text), status: text,
  unit: text, packaging: text, type: text, platform: text, brand: text,
  active: z.boolean(), isFeatured: z.boolean(), isConsultant: z.boolean(), allowBooking: z.boolean(),
  weight: amount, width: amount, length: amount, height: amount, displayOrder: z.number().int(), views: amount.int(),
}).partial().strict();

function legacyList(value: unknown) {
  if (typeof value === 'string') return value.trim() ? [value] : [];
  return value ?? undefined;
}

export function normalizeLegacyCatalogFields(product: Record<string, unknown>) {
  const { image, categoryId, categoryName, ...fields } = product;
  const images = legacyList(image);
  const categoryIds = legacyList(categoryId);
  const categoryNames = legacyList(categoryName);
  if (fields.images === undefined && images !== undefined) fields.images = images;
  if (fields.categoryIds === undefined && categoryIds !== undefined) fields.categoryIds = categoryIds;
  if (fields.categoryNames === undefined && categoryNames !== undefined) fields.categoryNames = categoryNames;
  return fields;
}

export function parseCatalog(body: any, creating = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw Error('Thông tin sản phẩm không hợp lệ.');
  const { _id, __v, createdAt, archived, salePrice, ...fields } = body;
  const result = catalogFields.safeParse(normalizeLegacyCatalogFields(fields));
  if (!result.success) throw Error('Trường không hợp lệ: ' + result.error.issues.map(i => i.path.join('.') || i.message).join(', '));
  if (creating && !result.data.name) throw Error('Vui lòng nhập tên sản phẩm.');
  return result.data;
}
