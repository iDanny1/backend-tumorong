/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OrderManagement } from './components/orders/OrderManagement';
import { ProductManagement } from './components/products/ProductManagement';
import { CategoryManagement } from './components/products/CategoryManagement';
import WarehouseManagement from './components/warehouses/WarehouseManagement';
import { OrderDetail } from './components/orders/OrderDetail';
import { ProductModal } from './components/products/ProductModal';
import { CategoryModal } from './components/products/CategoryModal';
import { ProductEditPage } from './components/products/ProductEditPage';
import { CustomerManagement } from './components/customers/CustomerManagement';
import { CustomerDetail } from './components/customers/CustomerDetail';
import { VoucherManagement } from './components/vouchers/VoucherManagement';
import { StaffManagement } from './components/settings/StaffManagement';
import { ArticleManagement } from './components/content/ArticleManagement';
import { NewsPublicUI } from './components/content/NewsPublicUI';
import { CampaignManagement } from './components/marketing/CampaignManagement';
import { ShippingManagement } from './components/shipping/ShippingManagement';
import { Login } from './components/auth/Login';
import { CustomerUI } from './components/CustomerUI';
import { Order, User, Category, Product, Customer } from './types';

export default function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [visitCount, setVisitCount] = useState<number>(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([
    {
      _id: '1',
      name: 'Phạm Minh',
      phone: '0385306910',
      ordersCount: 0,
      totalSpent: 0,
      remainingPoints: 0,
      totalPoints: 0,
      tags: [],
      createdAt: '2026-03-21T09:06:55Z',
      lastAccess: '2026-03-21T17:22:37Z',
      type: 'retail'
    },
    {
      _id: '2',
      name: 'Phi Hùng',
      phone: '0974543740',
      ordersCount: 0,
      totalSpent: 0,
      remainingPoints: 0,
      totalPoints: 0,
      tags: [],
      createdAt: '2026-03-11T09:26:34Z',
      lastAccess: '2026-03-19T10:09:18Z',
      type: 'wholesale'
    },
    {
      _id: '3',
      name: 'Loan Cong',
      phone: '0966478175',
      ordersCount: 0,
      totalSpent: 0,
      remainingPoints: 0,
      totalPoints: 0,
      tags: [],
      createdAt: '2026-02-28T12:33:21Z',
      lastAccess: '2026-02-28T12:34:26Z',
      type: 'retail'
    },
    {
      _id: '4',
      name: 'Tran Thanh Tuyen',
      phone: '0866226077',
      ordersCount: 0,
      totalSpent: 0,
      remainingPoints: 0,
      totalPoints: 0,
      tags: [],
      createdAt: '2025-10-25T21:32:51Z',
      lastAccess: '2026-02-02T12:20:36Z',
      type: 'wholesale'
    },
    {
      _id: '5',
      name: 'Móm',
      phone: '0325226279',
      ordersCount: 0,
      totalSpent: 0,
      remainingPoints: 0,
      totalPoints: 0,
      tags: [],
      createdAt: '2025-10-11T14:44:46Z',
      lastAccess: '2025-10-11T14:44:46Z',
      type: 'retail'
    }
  ]);
  const [activeMenu, setActiveMenu] = useState('Đơn hàng');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewMode, setViewMode] = useState<'admin' | 'customer'>('admin');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 0,
    categoryIds: [] as string[],
    categoryNames: [] as string[],
    description: '',
    images: [] as string[],
    status: 'Còn hàng',
    stock: 10000,
    type: 'Vật lý',
    platform: 'Mini App',
    active: true,
    isFeatured: false
  });
  const [newCategory, setNewCategory] = useState({
    _id: '' as string,
    name: '',
    icon: 'https://img.icons8.com/color/144/new-product.png',
    images: [] as string[],
    description: '',
    active: true
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('admin_user');
    if (savedUser && savedUser !== 'null') {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser && typeof parsedUser === 'object') {
          setUser(parsedUser);
          setIsLoggedIn(true);
        } else {
          localStorage.removeItem('admin_user');
        }
      } catch (e) {
        localStorage.removeItem('admin_user');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchOrders();
      fetchProducts();
      fetchCategories();

      // Poll for new orders every 30 seconds
      const interval = setInterval(fetchOrders, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchOrders = async (retries = 3) => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
      if (retries > 0) {
        console.log(`Retrying fetch orders... (${retries} attempts left)`);
        setTimeout(() => fetchOrders(retries - 1), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      let data = await res.json();
      // Đảm bảo sắp xếp: Nêu bật trước, sau đó đến ngày tạo mới nhất
      const sortedData = [...data].sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
      setProducts(sortedData);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setIsLoggedIn(true);
        localStorage.setItem('admin_user', JSON.stringify(userData));
        setActiveMenu(userData.role === 'warehouse' ? 'Quản lý kho' : 'Đơn hàng');
      } else {
        const error = await res.json();
        alert(error.message || 'Tài khoản hoặc mật khẩu không đúng!');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ!');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('admin_user');
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.images || newProduct.images.length === 0) {
      alert('Vui lòng tải lên ít nhất 1 hình ảnh');
      return;
    }
    try {
      const productToSave = {
        ...newProduct,
        price: Number(newProduct.price)
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productToSave)
      });
      if (res.ok) {
        setShowProductModal(false);
        setNewProduct({
          name: '',
          price: 0,
          categoryIds: [],
          categoryNames: [],
          description: '',
          images: [],
          status: 'Còn hàng',
          stock: 10000,
          type: 'Vật lý',
          platform: 'Mini App',
          active: true,
          isFeatured: false
        });
        fetchProducts();
      }
    } catch (err) {
      alert('Lỗi khi thêm sản phẩm');
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    try {
      const res = await fetch(`/api/products/${updatedProduct._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct)
      });
      if (res.ok) {
        setEditingProduct(null);
        fetchProducts();
      }
    } catch (err) {
      alert('Lỗi khi cập nhật sản phẩm');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch (err) {
      alert('Lỗi khi xóa sản phẩm');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = isEditingCategory ? 'PUT' : 'POST';
      const url = isEditingCategory ? `/api/categories/${newCategory._id}` : '/api/categories';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
      });
      if (res.ok) {
        setShowCategoryModal(false);
        setIsEditingCategory(false);
        setNewCategory({
          name: '',
          icon: 'https://img.icons8.com/color/144/new-product.png',
          images: [],
          description: '',
          active: true
        } as any);
        fetchCategories();
      }
    } catch (err) {
      alert('Lỗi khi lưu danh mục');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchCategories();
      }
    } catch (err) {
      alert('Lỗi khi xóa danh mục');
    }
  };

  const handleToggleCategory = async (category: Category) => {
    try {
      const res = await fetch(`/api/categories/${category._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: category.active === false })
      });
      if (res.ok) {
        fetchCategories();
      }
    } catch (err) {
      alert('Lỗi khi cập nhật trạng thái danh mục');
    }
  };

  const updateOrderStatus = async (orderId: string, updates: string | Partial<Order>) => {
    try {
      const updateData = typeof updates === 'string' ? { status: updates } : updates;
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (res.ok) {
        setShowOrderModal(false);
        fetchOrders();
        // Cập nhật lại selectedOrder để UI phản hồi ngay lập tức
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, ...updateData } : null);
          // Thông báo thành công
          alert('Cập nhật đơn hàng thành công!');
        }
      }
    } catch (err) {
      alert('Lỗi khi cập nhật trạng thái đơn hàng');
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSelectedOrder(null);
        fetchOrders();
        alert('Đã xóa đơn hàng thành công!');
      }
    } catch (err) {
      alert('Lỗi khi xóa đơn hàng');
    }
  };

  const trackProductView = async (productId: string) => {
    try {
      const product = products.find(p => p._id === productId);
      if (product) {
        await fetch(`/api/products/${productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ views: (product.views || 0) + 1 })
        });
        fetchProducts();
      }
    } catch (err) {
      console.error('Error tracking view:', err);
    }
  };

  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    setCustomers(prev => prev.map(c => c._id === updatedCustomer._id ? updatedCustomer : c));
    if (selectedCustomer?._id === updatedCustomer._id) {
      setSelectedCustomer(updatedCustomer);
    }
  };

  const handleUpdateProductStock = async (productId: string, warehouseStock: { [key: string]: number }, totalStock: number) => {
    try {
      const res = await fetch(`/api/products/${productId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warehouseStock, stock: totalStock })
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch (err) {
      console.error("Error updating product stock:", err);
    }
  };

  const renderContent = () => {
    if (activeMenu === 'Đơn hàng') {
      if (selectedOrder) {
        return (
          <OrderDetail 
            order={selectedOrder} 
            onBack={() => setSelectedOrder(null)} 
            onUpdate={updateOrderStatus}
            onDelete={deleteOrder}
          />
        );
      }
      return (
        <OrderManagement 
          orders={orders}
          loading={loading}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onRefresh={fetchOrders}
          onSelectOrder={setSelectedOrder}
          onDeleteOrder={deleteOrder}
        />
      );
    }

    if (activeMenu === 'Quản lý sản phẩm' || activeMenu === 'Quản lý sản phẩm - Sản phẩm') {
      return (
        <ProductManagement 
          products={products}
          searchQuery={searchQuery}
          onAddProduct={() => setShowProductModal(true)}
          onEditProduct={setEditingProduct}
          onDeleteProduct={handleDeleteProduct}
          onRefresh={fetchProducts}
        />
      );
    }

    if (activeMenu === 'Quản lý sản phẩm - Danh mục' || activeMenu === 'Danh mục') {
      return (
        <CategoryManagement 
          categories={categories}
          searchQuery={searchQuery}
          onAddCategory={() => {
            setIsEditingCategory(false);
            setNewCategory({ name: '', icon: 'https://img.icons8.com/color/144/new-product.png', images: [], description: '', active: true } as any);
            setShowCategoryModal(true);
          }}
          onEditCategory={(cat) => {
            setIsEditingCategory(true);
            setNewCategory(cat as any);
            setShowCategoryModal(true);
          }}
          onDeleteCategory={handleDeleteCategory}
          onToggleCategory={handleToggleCategory}
        />
      );
    }

    if (activeMenu === 'Quản lý kho' || activeMenu === 'Kho hàng') {
      return (
        <WarehouseManagement 
          products={products} 
          onUpdateProductStock={handleUpdateProductStock} 
        />
      );
    }

    if (activeMenu === 'Khuyến mãi') {
      return <VoucherManagement />;
    }

    if (activeMenu === 'Chiến dịch - Danh sách') {
      return <CampaignManagement />;
    }

    if (activeMenu === 'Chiến dịch - Content') {
      return <ArticleManagement />;
    }

    if (activeMenu === 'Tin tức - Preview') {
      return <NewsPublicUI />;
    }

    if (activeMenu === 'Cài đặt - Nhân viên') {
      return <StaffManagement />;
    }

    if (activeMenu === 'Vận chuyển') {
      return <ShippingManagement />;
    }

    if (activeMenu.startsWith('Khách hàng')) {
      if (selectedCustomer) {
        return (
          <CustomerDetail 
            customer={selectedCustomer} 
            onBack={() => setSelectedCustomer(null)} 
            onUpdate={handleUpdateCustomer}
          />
        );
      }
      return (
        <CustomerManagement 
          customers={customers}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          initialTab={activeMenu === 'Khách hàng - Mua sỉ' ? 'wholesale' : 'all'}
          onSelectCustomer={setSelectedCustomer}
        />
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <LayoutDashboard className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-lg font-medium">Tính năng {activeMenu} đang được phát triển</p>
      </div>
    );
  };

  if (!isLoggedIn) {
    return (
      <Login 
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        onLogin={handleLogin}
      />
    );
  }

  if (viewMode === 'customer') {
    const activeCategoryIds = categories.filter(c => c.active !== false).map(c => c._id);
    const filteredProducts = products.filter(p => 
      (p.categoryIds && p.categoryIds.some(id => activeCategoryIds.includes(id)))
    );
    
    return (
      <CustomerUI 
        products={filteredProducts}
        onProductClick={trackProductView}
        onBackToAdmin={() => setViewMode('admin')}
      />
    );
  }

  if (editingProduct) {
    return (
      <ProductEditPage 
        product={editingProduct}
        categories={categories}
        onSave={handleUpdateProduct}
        onCancel={() => setEditingProduct(null)}
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        user={user}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col overflow-hidden w-full">
        <Header 
          user={user}
          orders={orders}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          onLogout={handleLogout}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onMenuClick={() => setSidebarOpen(true)}
          onSelectOrder={(order) => {
            setSelectedOrder(order);
            setShowNotifications(false);
            setActiveMenu('Đơn hàng');
            setActiveTab('Chờ xác nhận');
          }}
          onViewAllOrders={() => {
            setActiveMenu('Đơn hàng');
            setShowNotifications(false);
          }}
        />

        <div className={`flex-1 overflow-y-auto p-4 md:p-6 ${activeMenu !== 'Đơn hàng' ? 'pt-2 md:pt-3' : ''}`}>
          {renderContent()}
        </div>
      </main>

      {/* Modals */}
      {showProductModal && (
        <ProductModal 
          onClose={() => setShowProductModal(false)}
          onSubmit={handleAddProduct}
          newProduct={newProduct}
          setNewProduct={setNewProduct}
          categories={categories}
        />
      )}

      {showCategoryModal && (
        <CategoryModal 
          onClose={() => {
            setShowCategoryModal(false);
            setIsEditingCategory(false);
          }}
          onSubmit={handleAddCategory}
          newCategory={newCategory}
          setNewCategory={setNewCategory}
          isEditing={isEditingCategory}
        />
      )}
    </div>
  );
}
