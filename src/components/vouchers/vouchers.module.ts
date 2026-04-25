import { Module } from '@nestjs/common';
import { VouchersController } from './vouchers.controller.ts';
import { VouchersService } from './vouchers.service.ts';

@Module({
  controllers: [VouchersController],
  providers: [VouchersService],
  exports: [VouchersService],
})
export class VouchersModule {}
