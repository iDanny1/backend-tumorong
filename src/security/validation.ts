import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

export const loginInput = z.object({ username: z.string().trim().min(1).max(80), password: z.string().min(1).max(128) }).strict();
export const staffInput = z.object({ username: z.string().trim().min(1).max(80),
  password: z.string().min(12).max(128).refine(value => Buffer.byteLength(value, 'utf8') <= 72, 'Mật khẩu tối đa 72 byte.'),
  name: z.string().trim().max(150).optional(), role: z.enum(['admin', 'sales', 'warehouse']),
  email: z.string().trim().max(254).optional(), phone: z.string().trim().max(40).optional(), active: z.boolean().optional() }).strict();
export const staffUpdateInput = staffInput.omit({ username: true }).partial()
  .extend({ username: z.string().trim().min(1).max(80).optional(), password: staffInput.shape.password.or(z.literal('')).optional() });
export const customerInput = z.object({ name: z.string().trim().min(1).max(200).optional(), phone: z.string().trim().max(80).optional(),
  email: z.string().trim().max(254).optional(), address: z.string().trim().max(1000).optional(),
  deliveryAddress: z.string().trim().max(1000).optional(), departmentAddress: z.string().trim().max(1000).optional(),
  contactName: z.string().trim().max(200).optional(), phoneRaw: z.string().trim().max(200).optional(),
  type: z.enum(['retail', 'wholesale']).optional(), tags: z.array(z.string().trim().max(80)).max(30).optional() }).strict();

export function validateBody(schema: z.ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: 'Dữ liệu gửi lên không hợp lệ.',
      fields: result.error.issues.map(issue => issue.path.join('.')) });
    req.body = result.data; next();
  };
}
