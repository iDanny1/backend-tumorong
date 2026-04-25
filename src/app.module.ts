import { Module } from '@nestjs/common';
import { VouchersModule } from './components/vouchers/vouchers.module.ts';

@Module({
  imports: [VouchersModule],
})
export class AppModule {}
