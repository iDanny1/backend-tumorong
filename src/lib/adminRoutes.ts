import { stockCountMenu } from './stockCount';

export const adminRoutes = [
  { path: '/don-hang', menu: 'Đơn hàng', roles: ['admin', 'sales'] },
  { path: '/bao-cao', menu: 'Báo cáo', roles: ['admin'] },
  { path: '/kho', menu: 'Quản lý kho', roles: ['admin', 'warehouse'] },
  { path: '/kho/kiem-kho', menu: stockCountMenu, roles: ['admin', 'warehouse'] },
  { path: '/san-pham', menu: 'Quản lý sản phẩm - Sản phẩm', roles: ['admin', 'sales', 'warehouse'] },
  { path: '/san-pham/danh-muc', menu: 'Quản lý sản phẩm - Danh mục', roles: ['admin', 'sales', 'warehouse'] },
  { path: '/kho/phieu-xuat', menu: 'Xuất phiếu', roles: ['admin', 'sales', 'warehouse'] },
  { path: '/hop-dong', menu: 'Hợp đồng', roles: ['admin', 'sales'] },
  { path: '/khach-hang', menu: 'Khách hàng - Tất cả', roles: ['admin', 'sales'] },
  { path: '/khach-hang/mua-si', menu: 'Khách hàng - Mua sỉ', roles: ['admin', 'sales'] },
  { path: '/chien-dich', menu: 'Chiến dịch - Danh sách', roles: ['admin', 'sales'] },
  { path: '/chien-dich/bai-viet', menu: 'Chiến dịch - Content', roles: ['admin', 'sales'] },
  { path: '/tin-tuc/xem-thu', menu: 'Tin tức - Preview', roles: ['admin', 'sales'] },
  { path: '/khuyen-mai', menu: 'Khuyến mãi', roles: ['admin', 'sales'] },
  { path: '/loyalty', menu: 'Loyalty', roles: ['admin'] },
  { path: '/van-chuyen', menu: 'Vận chuyển', roles: ['admin', 'sales'] },
  { path: '/affiliate', menu: 'Affiliate', roles: ['admin'] },
  { path: '/marketing', menu: 'Marketing', roles: ['admin'] },
  { path: '/cai-dat', menu: 'Cài đặt', roles: ['admin'] },
  { path: '/cai-dat/nhan-vien', menu: 'Cài đặt - Nhân viên', roles: ['admin'] },
];

export function routeForPath(path: string) {
  return adminRoutes.find(route => route.path === path.replace(/\/+$/, ''));
}

export function defaultRoute(role: string) {
  return role.toLowerCase() === 'warehouse' ? '/kho/kiem-kho' : '/don-hang';
}

export function loginDestination() {
  const next = new URLSearchParams(window.location.search).get('next');
  return next && routeForPath(next) ? next : null;
}
