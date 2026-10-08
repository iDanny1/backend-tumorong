import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { staffInput } from '../src/security/validation.js';

// Offline operator tool. No HTTP endpoint, no command-line password or secret output.
const args = process.argv.slice(2);
const username = args[args.indexOf('--username') + 1];
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const reset = args.includes('--reset');
try {
  if (!args.includes('--username') || !process.env.MONGODB_URI || !password) {
    throw new Error('Cần MONGODB_URI, BOOTSTRAP_ADMIN_PASSWORD và --username. --reset chỉ dùng khi đổi mật khẩu tài khoản hiện có.');
  }
  const input = staffInput.safeParse({ username, password, role: 'admin' });
  if (!input.success) throw new Error('Tên đăng nhập hoặc mật khẩu không hợp lệ: tối thiểu 12 ký tự, tối đa 72 byte UTF-8.');
  const hash = await bcrypt.hash(password, 12);
  delete process.env.BOOTSTRAP_ADMIN_PASSWORD;
  await mongoose.connect(process.env.MONGODB_URI);
  const users = mongoose.connection.collection('users');
  const existing = await users.findOne({ username: input.data.username });
  if (reset) {
    if (!existing) throw new Error('Không tìm thấy tài khoản cần đổi mật khẩu.');
    await users.updateOne({ _id: existing._id }, { $set: { password: hash } });
  } else {
    if (existing || await users.findOne({ role: 'admin' })) throw new Error('Đã có tài khoản quản trị. Dùng --reset để đổi mật khẩu; không tạo thêm.');
    await users.insertOne({ username: input.data.username, password: hash, name: 'Quản trị', role: 'admin', active: true, createdAt: new Date().toISOString() });
  }
  console.log('Đã cập nhật thông tin xác thực. Các phiên đăng nhập cũ sẽ mất hiệu lực.');
} catch (error) {
  // Only known operator messages, never database driver errors containing connection details.
  const allowed = ['Cần ', 'Tên đăng nhập ', 'Không tìm thấy ', 'Đã có '];
  const message = error instanceof Error && allowed.some(prefix => error.message.startsWith(prefix)) ? error.message : 'Không hoàn tất thao tác. Kiểm tra kết nối và quyền cơ sở dữ liệu.';
  console.error(message); process.exitCode = 1;
} finally { delete process.env.BOOTSTRAP_ADMIN_PASSWORD; await mongoose.disconnect(); }
