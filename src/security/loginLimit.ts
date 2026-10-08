import { createHash } from 'node:crypto';
import mongoose, { Schema } from 'mongoose';
import type { Request, Response, NextFunction } from 'express';

const schema = new Schema({ _id: String, count: Number, expiresAt: Date });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const Bucket = mongoose.model('SecurityLoginBucket', schema);

// Counts are shared across Render instances and survive restarts. Window is in
// the unique key, so asynchronous TTL deletion cannot reset a live window.
export function loginLimiter(model: any = Bucket, now: () => number = Date.now) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const windowMs = 15 * 60 * 1000;
    const timestamp = now();
    const window = Math.floor(timestamp / windowMs);
    const keys = [{ key: `ip:${req.ip}`, max: 100 }, { key: `account:${String(req.body?.username || '').toLowerCase()}`, max: 10 }];
    try {
      for (const entry of keys) {
        const _id = createHash('sha256').update(`${window}:${entry.key}`).digest('hex');
        const update = { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((window + 2) * windowMs) } };
        let result;
        try { result = await model.findOneAndUpdate({ _id }, update, { upsert: true, new: true }); }
        catch (error: any) { if (error.code !== 11000) throw error; result = await model.findOneAndUpdate({ _id }, update, { new: true }); }
        if (!result || result.count > entry.max) {
          res.setHeader('Retry-After', String(Math.ceil(((window + 1) * windowMs - timestamp) / 1000)));
          return res.status(429).json({ message: 'Đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau.' });
        }
      }
      next();
    } catch { res.status(503).json({ message: 'Chưa kiểm tra được đăng nhập. Vui lòng thử lại.' }); }
  };
}
