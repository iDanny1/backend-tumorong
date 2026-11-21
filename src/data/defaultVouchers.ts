export function createDefaultVouchers() {
  return [
    {
      code: 'TUMORONG100K',
      description: 'Giảm 100.000đ cho đơn từ 500.000đ',
      type: 'fixed',
      discountAmount: 100000,
      minOrderValue: 500000,
      usageLimit: 100,
      usedCount: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      code: 'SAMNGOCLINH10',
      description: 'Giảm 10% tối đa 200.000đ cho đơn từ 1.000.000đ',
      type: 'percentage',
      discountPercentage: 10,
      maxDiscountAmount: 200000,
      minOrderValue: 1000000,
      usageLimit: 100,
      usedCount: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ];
}
