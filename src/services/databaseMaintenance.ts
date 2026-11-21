import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { Category } from '../models/Category.js';
import { Article } from '../models/Article.js';
import { Voucher } from '../models/StoreVoucher.js';
import { User } from '../models/User.js';
import { createDefaultVouchers } from '../data/defaultVouchers.js';
import { hashStaffPassword } from '../security/passwords.js';

export async function seedData() {
  try {
    console.log('Checking database status...');

    // Seed Categories
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      console.log('Seeding categories...');
      await Category.insertMany([
        { name: 'Sâm Ngọc Linh', icon: 'https://img.icons8.com/color/144/natural-food.png', active: true },
        { name: 'Dược Liệu Quý', icon: 'https://img.icons8.com/color/144/pill.png', active: true }
      ]);
    }

    // Seed Products
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log('Seeding products...');
      await Product.insertMany([
        {
          name: "Sâm Ngọc Linh Tu Mơ Rông (Loại 1)",
          price: 15000000,
          description: "Sâm Ngọc Linh chuẩn vùng trồng Tu Mơ Rông, Kon Tum.",
          images: ["https://picsum.photos/seed/product1/600/600"],
          status: 'Còn hàng',
          stock: 50,
          isFeatured: true,
          active: true
        }
      ]);
    }

    // Seed Articles
    const articleCount = await Article.countDocuments();
    if (articleCount === 0) {
      console.log('Seeding dummy articles...');
      await Article.insertMany([
        {
          title: "Sâm Ngọc Linh - Báu vật của đại ngàn",
          slug: "sam-ngoc-linh-bau-vat-cua-dai-ngan",
          summary: "Tìm hiểu về nguồn gốc và giá trị quý giá của Sâm Ngọc Linh đối với sức khỏe con người.",
          content: "<h3>Sâm Ngọc Linh là gì?</h3><p>Sâm Ngọc Linh là loại sâm quý nhất thế giới, được tìm thấy tại vùng núi Ngọc Linh thuộc tỉnh Kon Tum và Quảng Nam...</p>",
          thumbnail: "https://picsum.photos/seed/sam1/800/500",
          category: "Kiến thức",
          author: "Quản trị viên",
          status: "published",
          views: 125,
          tags: ["Sâm Ngọc Linh", "Sức khỏe"],
          publishedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          title: "Hướng dẫn phân biệt sâm Ngọc Linh thật giả",
          slug: "huong-dan-phan-biet-sam-ngoc-linh-that-gia",
          summary: "Cách nhận biết sâm Ngọc Linh chuẩn vùng trồng Tu Mơ Rông để không mua nhầm hàng kém chất lượng.",
          content: "<h3>Đặc điểm nhận dạng</h3><p>Sâm Ngọc Linh thật có những đặc điểm về đốt sâm, mùi vị và màu sắc rất đặc trưng...</p>",
          thumbnail: "https://picsum.photos/seed/sam2/800/500",
          category: "Kiến thức",
          author: "Quản trị viên",
          status: "published",
          views: 89,
          tags: ["Phân biệt thật giả", "Mua sắm"],
          publishedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
      console.log('Articles seeded.');
    }

    // Seed Orders
    const orderCount = await Order.countDocuments();
    if (orderCount === 0) {
      console.log('Seeding dummy orders...');
      await Order.insertMany([
        {
          orderId: "ORD-001",
          customerName: "Nguyễn Văn A",
          customerPhone: "0901234567",
          customer: { name: "Nguyễn Văn A", phone: "0901234567", address: "123 Đường Lê Lợi, Quận 1, TP.HCM" },
          products: [{ id: "p1", name: "Sản phẩm thử nghiệm A", quantity: 2, price: 150000 }],
          total: 300000,
          paymentMethod: "COD",
          shippingUnit: "GHN",
          status: "Chờ xác nhận",
          paymentStatus: "Chưa thanh toán"
        },
        {
          orderId: "ORD-002",
          customerName: "Trần Thị B",
          customerPhone: "0912345678",
          customer: { name: "Trần Thị B", phone: "0912345678", address: "456 Đường Nguyễn Huệ, Quận Hải Châu, Đà Nẵng" },
          products: [{ id: "p2", name: "Sản phẩm thử nghiệm B", quantity: 1, price: 500000 }],
          total: 500000,
          paymentMethod: "ZaloPay",
          shippingUnit: "GHTK",
          status: "Đang giao",
          paymentStatus: "Đã thanh toán",
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ]);
      console.log('Orders seeded.');
    }

    // Seed Vouchers
    const voucherCount = await Voucher.countDocuments();
    if (voucherCount === 0) {
      console.log('Seeding vouchers...');
      await Voucher.insertMany(createDefaultVouchers());
      console.log('Vouchers seeded.');
    }

    console.log('✅ Database seeding complete.');
  } catch (err) {
    console.error('❌ Seeding error:');
  }
}

// ========================
// MIGRATE PLAIN-TEXT PASSWORDS → bcrypt hashes
// ========================
export async function migratePasswords() {
  try {
    const users = await User.find({}).select('+password');
    let migrated = 0;
    for (const u of users) {
      // Nếu password chưa phải bcrypt hash (không bắt đầu bằng $2)
      if (!u.password.startsWith('$2')) {
        u.password = await hashStaffPassword(u.password);
        await u.save();
        migrated++;
      }
    }
    if (migrated > 0) {
      console.log(`✅ Đã mã hóa ${migrated} mật khẩu cũ.`);
    }
  } catch (err) {
    console.error('❌ Migration error:');
  }
}
