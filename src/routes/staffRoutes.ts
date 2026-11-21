import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { signInAdmin, staffProfile } from '../security/admin.js';
import { validateBody, loginInput, staffInput, staffUpdateInput } from '../security/validation.js';
import { loginLimiter } from '../security/loginLimit.js';
import { hashStaffPassword } from '../security/passwords.js';

const router = Router({ caseSensitive: true });

router.get('/staff', async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json(users.map(staffProfile));
  } catch (err) {
    console.error('CRITICAL: Error fetching staff:');
    res.status(500).json({ error: 'Lỗi tải danh sách nhân viên' });
  }
});

router.post('/staff', validateBody(staffInput), async (req, res) => {
  try {
    const { username, password, name, role, email, phone, active } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Thiếu thông tin tài khoản hoặc mật khẩu' });
    }
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
    }
    // Chỉ cho phép 1 tài khoản admin duy nhất
    if (role === 'admin') {
      const adminExists = await User.findOne({ role: 'admin' });
      if (adminExists) {
        return res.status(400).json({ error: 'Đã có tài khoản Admin trong hệ thống. Chỉ được phép 1 tài khoản Admin duy nhất.' });
      }
    }
    const hashedPassword = await hashStaffPassword(password);
    const newUser = await User.create({
      username, password: hashedPassword, name, role, email, phone,
      active: active !== undefined ? active : true,
      createdAt: new Date().toISOString()
    });
    res.status(201).json(staffProfile(newUser));
  } catch (err) {
    console.error('Error creating staff:');
    res.status(500).json({ error: 'Lỗi khi tạo nhân viên' });
  }
});

router.put('/staff/:id', validateBody(staffUpdateInput), async (req, res) => {
  try {
    const { password, name, role, email, phone, active } = req.body;
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'Không tìm thấy nhân viên.' });
    if (target.role === 'admin' && ((role !== undefined && role !== 'admin') || active === false)) return res.status(400).json({ message: 'Không thể hạ quyền hoặc khóa tài khoản quản trị cuối cùng.' });
    const updateData: any = {};
    for (const [key, value] of Object.entries({ name, role, email, phone, active })) if (value !== undefined) updateData[key] = value;
    // Nếu đang đổi role sang admin, kiểm tra không có admin nào khác
    if (role === 'admin') {
      const existingAdmin = await User.findOne({ role: 'admin', _id: { $ne: req.params.id } });
      if (existingAdmin) {
        return res.status(400).json({ error: 'Đã có tài khoản Admin trong hệ thống. Chỉ được phép 1 tài khoản Admin duy nhất.' });
      }
    }
    if (password && password.trim() !== '') {
      updateData.password = await hashStaffPassword(password);
    }
    await User.findByIdAndUpdate(req.params.id, { $set: updateData });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi cập nhật nhân viên' });
  }
});

router.delete('/staff/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    if (user.role === 'admin') return res.status(400).json({ error: 'Không thể xóa tài khoản Admin hệ thống' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi xóa nhân viên' });
  }
});

// --- AUTH ---
router.post('/login', validateBody(loginInput), loginLimiter(), async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập tài khoản và mật khẩu' });
  }
  try {
    const user = await User.findOne({ username, active: true }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu' });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu' });
    }
    // Trả về thông tin user nhưng không trả password
    await signInAdmin(req, user);
    res.json(staffProfile(user));
  } catch (err) {
    res.status(500).json({ error: 'Lỗi cơ sở dữ liệu hệ thống' });
  }
});

export default router;
