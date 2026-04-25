export interface OrderProduct {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  orderId?: string;
  customerName?: string;
  customerPhone?: string;
  customerAvatar?: string;
  customer?: {
    name: string;
    phone: string;
    address?: string;
  };
  products?: OrderProduct[];
  totalAmount?: number;
  discountApplied?: number;
  voucherCode?: string;
  total: number;
  paymentMethod?: string;
  shippingUnit?: string;
  store?: string;
  status: string;
  paymentStatus?: string;
  platform?: string;
  order_code?: string;
  createdAt: string;
}

export interface Customer {
  _id: string;
  name: string;
  phone: string;
  avatar?: string;
  ordersCount: number;
  totalSpent: number;
  remainingPoints: number;
  totalPoints: number;
  tags: string[];
  createdAt: string;
  lastAccess: string;
  referrer?: string;
  type: 'retail' | 'wholesale';
}

export interface User {
  username: string;
  name: string;
  role: string;
  avatar: string;
}

export interface Category {
  _id: string;
  name: string;
  icon: string;
  images?: string[];
  active?: boolean;
  description?: string;
}

export interface Warehouse {
  _id: string;
  name: string;
  location?: string;
  orderCount: number;
  createdAt: string;
}

export interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  sku?: string;
  barcode?: string;
  description?: string;
  categoryIds: string[];
  categoryNames: string[];
  images: string[];
  status: string;
  stock: number;
  warehouseStock?: { [warehouseId: string]: number };
  unit?: string;
  type: string;
  platform: string;
  active: boolean;
  views?: number;
  isConsultant?: boolean;
  allowBooking?: boolean;
  brand?: string;
  displayOrder?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  isFeatured?: boolean;
  createdAt?: string;
}

export interface Article {
  _id?: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  thumbnail: string;
  category: string;
  author: string;
  status: 'draft' | 'published';
  views: number;
  tags: string[];
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  _id?: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive' | 'scheduled';
  type: string;
  budget?: number;
  channels: string[];
  createdAt: string;
}
