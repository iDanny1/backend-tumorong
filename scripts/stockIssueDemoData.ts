import type { Customer, Product } from '../src/types';

export const demoProducts: Product[] = [
  { _id: 'demo-black', name: 'Rượu Sâm Ngọc Linh Atuagin Black', sku: 'AT-BLACK', price: 600000, unit: 'Chai', stock: 120, active: true },
  { _id: 'demo-tea', name: 'Trà Ô Long Sâm Ngọc Linh', sku: 'TRA-OL', price: 250000, unit: 'Hộp', stock: 60, active: true },
  { _id: 'demo-coffee', name: 'Cà Phê Sâm Ngọc Linh', sku: 'CF-SAM', price: 180000, unit: 'Hộp', stock: 80, active: true },
  { _id: 'demo-hidden', name: 'Rượu mới đang ẩn trên cửa hàng', sku: 'RUOU-MOI', price: 300000, unit: 'Chai', stock: 40, active: false },
].map(p => ({ ...p, barcode: '', categoryIds: [], categoryNames: [], images: [], status: 'Còn hàng', type: 'Vật lý', platform: 'Cửa hàng' }));

export const demoCustomer: Customer = {
  _id: 'demo-customer', name: 'CÔNG TY TNHH NHÀ HÀNG CAFE NAM PHƯƠNG LẦU', phone: '',
  address: 'Số 19 -19B, Nguyễn Thị Diệu, Phường Xuân Hòa, TP. Hồ Chí Minh',
  ordersCount: 0, totalSpent: 0, remainingPoints: 0, totalPoints: 0, tags: [],
  createdAt: '2026-09-24T08:00:00Z', lastAccess: '2026-09-24T08:00:00Z', type: 'wholesale',
};
