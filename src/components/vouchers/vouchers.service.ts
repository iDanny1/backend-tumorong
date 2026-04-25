import { Injectable, OnModuleInit, BadRequestException, NotFoundException } from '@nestjs/common';
import Datastore from 'nedb-promises';
import { Voucher } from './voucher.entity.ts';
import * as path from 'path';

@Injectable()
export class VouchersService implements OnModuleInit {
  private db: Datastore<Voucher>;

  /**
   * Khởi tạo Datastore của NeDB trỏ tới file data/vouchers.db
   */
  async onModuleInit() {
    const dbPath = path.join(process.cwd(), 'data', 'vouchers.db');
    this.db = Datastore.create({
      filename: dbPath,
      autoload: true,
    });

    // Đảm bảo set index unique cho trường code
    await this.db.ensureIndex({ fieldName: 'code', unique: true });
    console.log('NeDB Vouchers database loaded and indexed.');

    // Seed dữ liệu mẫu nếu database trống
    const count = await this.db.count({});
    if (count === 0) {
      const sampleVouchers: Voucher[] = [
        {
          code: 'SAMNGOCLINH50',
          description: 'Giảm 50.000đ cho đơn hàng từ 500.000đ',
          type: 'fixed',
          discountAmount: 50000,
          minOrderValue: 500000,
          usageLimit: 100,
          usedCount: 0,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActive: true,
        },
        {
          code: 'GIAM10PT',
          description: 'Giảm 10% tối đa 100.000đ cho đơn từ 500.000đ',
          type: 'percentage',
          discountPercentage: 10,
          maxDiscountAmount: 100000,
          minOrderValue: 500000,
          usageLimit: 200,
          usedCount: 0,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActive: true,
        },
        {
          code: 'CHAOXUAN2026',
          description: 'Mừng xuân Bính Ngọ - Giảm 100.000đ cho đơn từ 1 triệu',
          type: 'fixed',
          discountAmount: 100000,
          minOrderValue: 1000000,
          usageLimit: 50,
          usedCount: 0,
          startDate: new Date(),
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          isActive: true,
        },
        {
          code: 'VIP20PT',
          description: 'Ưu đãi VIP - Giảm 20% tối đa 500.000đ',
          type: 'percentage',
          discountPercentage: 20,
          maxDiscountAmount: 500000,
          minOrderValue: 2000000,
          usageLimit: 20,
          usedCount: 0,
          startDate: new Date(),
          endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          isActive: true,
        }
      ];
      await this.db.insert(sampleVouchers);
      console.log('✅ Đã khởi tạo 4 mã khuyến mãi mẫu (Tiền mặt & Phần trăm).');
    }
  }

  /**
   * Lấy tất cả danh sách voucher
   */
  async findAll(): Promise<Voucher[]> {
    return this.db.find({});
  }

  /**
   * Tìm một voucher theo ID
   */
  async findOne(id: string): Promise<Voucher> {
    const voucher = await this.db.findOne({ _id: id });
    if (!voucher) {
      throw new NotFoundException(`Voucher với ID ${id} không tồn tại`);
    }
    return voucher;
  }

  /**
   * Tạo mới một voucher
   */
  async create(data: Partial<Voucher>): Promise<Voucher> {
    const newVoucher: Voucher = {
      code: data.code?.toUpperCase() || '', // Luôn viết hoa mã code
      description: data.description || '',
      type: data.type || 'fixed',
      discountAmount: data.discountAmount || 0,
      discountPercentage: data.discountPercentage || 0,
      maxDiscountAmount: data.maxDiscountAmount || 0,
      minOrderValue: data.minOrderValue || 0,
      usageLimit: data.usageLimit || 0,
      usedCount: 0, // Mặc định là 0
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      endDate: data.endDate ? new Date(data.endDate) : new Date(),
      isActive: data.isActive ?? true, // Mặc định là true
    };

    try {
      return await this.db.insert(newVoucher);
    } catch (error: any) {
      if (error.errorType === 'uniqueViolated') {
        throw new BadRequestException('Mã voucher này đã tồn tại trong hệ thống');
      }
      throw error;
    }
  }

  /**
   * Cập nhật thông tin voucher
   */
  async update(id: string, data: Partial<Voucher>): Promise<Voucher> {
    const existing = await this.findOne(id);
    const updatedData = { ...existing, ...data };
    
    // Nếu có đổi code thì viết hoa
    if (data.code) updatedData.code = data.code.toUpperCase();
    
    // Đảm bảo date là đối tượng Date
    if (data.startDate) updatedData.startDate = new Date(data.startDate);
    if (data.endDate) updatedData.endDate = new Date(data.endDate);
    
    await this.db.update({ _id: id }, { $set: updatedData });
    return this.findOne(id);
  }

  /**
   * Xóa voucher
   */
  async remove(id: string): Promise<{ deleted: number }> {
    const numRemoved = await this.db.remove({ _id: id }, {});
    if (numRemoved === 0) {
      throw new NotFoundException(`Không tìm thấy voucher với ID ${id} để xóa`);
    }
    return { deleted: numRemoved };
  }

  /**
   * Hàm đặc biệt validateVoucher(code: string, orderTotal: number)
   * Kiểm tra tính hợp lệ của mã giảm giá
   */
  async validateVoucher(code: string, orderTotal: number): Promise<Voucher> {
    const upperCode = code.toUpperCase();
    const voucher = await this.db.findOne({ code: upperCode });

    // 1. Kiểm tra tồn tại
    if (!voucher) {
      throw new BadRequestException('Mã không tồn tại');
    }

    // 2. Kiểm tra trạng thái hoạt động
    if (!voucher.isActive) {
      throw new BadRequestException('Mã giảm giá này hiện đang bị tạm dừng');
    }

    // 3. Kiểm tra thời gian hiệu lực
    const now = new Date();
    if (now < new Date(voucher.startDate)) {
      throw new BadRequestException('Mã giảm giá này chưa đến thời gian áp dụng');
    }
    if (now > new Date(voucher.endDate)) {
      throw new BadRequestException('Mã giảm giá này đã hết hạn sử dụng');
    }

    // 4. Kiểm tra giới hạn số lần sử dụng
    if (voucher.usedCount >= voucher.usageLimit) {
      throw new BadRequestException('Mã giảm giá này đã hết lượt sử dụng');
    }

    // 5. Kiểm tra giá trị đơn hàng tối thiểu
    if (orderTotal < voucher.minOrderValue) {
      throw new BadRequestException(`Đơn hàng chưa đạt giá trị tối thiểu (${voucher.minOrderValue.toLocaleString()}đ) để áp dụng mã này`);
    }

    // Nếu hợp lệ, trả về thông tin voucher
    return voucher;
  }
}
