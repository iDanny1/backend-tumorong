import { Router } from 'express';
import { Customer } from '../models/Customer.js';
import { validateBody, customerInput } from '../security/validation.js';

const router = Router({ caseSensitive: true });

router.get('/', async (req, res) => {
  try {
    const docs = await Customer.find({}).sort({ createdAt: -1 });
    if (req.adminUser?.role === 'warehouse') {
      return res.json(docs.map(c => ({ _id: c._id, name: c.name, phone: c.phone, phoneRaw: c.phoneRaw,
        contactName: c.contactName, address: c.address, departmentAddress: c.departmentAddress,
        deliveryAddress: c.deliveryAddress, type: c.type, ordersCount: 0, totalSpent: 0, remainingPoints: 0, totalPoints: 0, tags: [] })));
    }
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: 'Không thể xử lý yêu cầu. Vui lòng thử lại.' });
  }
});

router.post('/', validateBody(customerInput.required({ name: true })), async (req, res) => {
  try {
    const newCustomer = await Customer.create(req.body);
    res.status(201).json(newCustomer);
  } catch (err) {
    res.status(500).json({ error: 'Không thể xử lý yêu cầu. Vui lòng thử lại.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const query = Customer.findById(req.params.id);
    if (req.adminUser?.role === 'warehouse') query.select('_id name phone address deliveryAddress type');
    const doc = await query;
    if (!doc) return res.status(404).json({ message: "Không tìm thấy khách hàng" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: 'Không thể xử lý yêu cầu. Vui lòng thử lại.' });
  }
});

router.put('/:id', validateBody(customerInput), async (req, res) => {
  try {
    if (req.adminUser?.role === 'warehouse' && Object.keys(req.body).some(key => key !== 'address')) return res.status(403).json({ message: 'Nhân viên kho chỉ được cập nhật địa chỉ giao hàng.' });
    if (req.body.address !== undefined && (typeof req.body.address !== 'string' || req.body.address.length > 1000)) {
      return res.status(400).json({ message: 'Địa chỉ khách hàng phải là văn bản, tối đa 1.000 ký tự.' });
    }
    if (typeof req.body.address === 'string') req.body.address = req.body.address.trim();
    const query = Customer.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (req.adminUser?.role === 'warehouse') query.select('_id name phone address deliveryAddress type');
    const updated = await query;
    if (!updated) return res.status(404).json({ message: "Không tìm thấy khách hàng" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Không thể xử lý yêu cầu. Vui lòng thử lại.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Customer.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Không tìm thấy khách hàng" });
    res.json({ message: "Xóa thành công" });
  } catch (err) {
    res.status(500).json({ error: 'Không thể xử lý yêu cầu. Vui lòng thử lại.' });
  }
});

export default router;
