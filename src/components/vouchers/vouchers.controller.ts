import { Controller, Get, Post, Put, Delete, Body, Param, BadRequestException } from '@nestjs/common';
import { VouchersService } from './vouchers.service.ts';
import { Voucher } from './voucher.entity.ts';

@Controller('api/vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Get()
  async findAll() {
    return this.vouchersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.vouchersService.findOne(id);
  }

  @Post()
  async create(@Body() data: Partial<Voucher>) {
    return this.vouchersService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<Voucher>) {
    return this.vouchersService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.vouchersService.remove(id);
  }

  /**
   * Endpoint để kiểm tra mã giảm giá từ phía client
   * POST /api/vouchers/validate
   * Body: { code: string, orderTotal: number }
   */
  @Post('validate')
  async validate(@Body() body: { code: string; orderTotal: number }) {
    if (!body.code || body.orderTotal === undefined) {
      throw new BadRequestException('Thiếu thông tin mã hoặc tổng tiền đơn hàng');
    }
    return this.vouchersService.validateVoucher(body.code, body.orderTotal);
  }
}
