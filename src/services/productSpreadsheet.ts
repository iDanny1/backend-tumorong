import { Product } from '../models/Product.js';
import { parseCatalog, catalogFields } from '../lib/productCatalog.js';
import { InventoryError, inventoryTransaction } from './inventory.js';
import mongoose from 'mongoose';

const headers: Record<string,string> = { name:'Tên', price:'Giá', description:'Mô tả', status:'Trạng thái', isFeatured:'Nổi bật', sku:'SKU', unit:'Đơn vị', packaging:'Quy cách' };
const lists = ['images','categoryIds','categoryNames'];
const flags = ['isFeatured','active','isConsultant','allowBooking'];
export function productRow(product: Record<string,any>) {
  const row: Record<string,unknown> = {ID:String(product._id), 'Tồn kho':product.stock ?? 0, 'Tồn theo kho':JSON.stringify(product.warehouseStock ?? {})};
  for (const key of Object.keys(catalogFields.shape)) {
    const value = product[key];
    if (value != null) row[headers[key] || key] = lists.includes(key) ? JSON.stringify(value) : flags.includes(key) ? (value ? 'Có' : 'Không') : value;
  }
  return row;
}
export async function importCatalog(rows: Record<string,unknown>[]) {
  if (!rows.length || rows.length > 5000) throw new InventoryError(400,'File cần có từ 1 đến 5.000 sản phẩm.');
  const prepared = rows.map((row,i) => {
    try {
      const input: Record<string,unknown> = {};
      for (const key of Object.keys(catalogFields.shape)) {
        const value = row[headers[key] || key];
        if (value === undefined) continue;
        if (flags.includes(key) && !['Có','Không',true,false].includes(value as any)) throw Error('Giá trị Có/Không không hợp lệ.');
        input[key] = lists.includes(key) ? JSON.parse(String(value)) : flags.includes(key) ? value === 'Có' || value === true : value;
      }
      const data = parseCatalog(input,true), id = String(row.ID ?? '').trim();
      if (id && !mongoose.isObjectIdOrHexString(id)) throw Error('ID không hợp lệ.');
      if (!id && !data.sku) throw Error('Cần SKU hoặc ID để nhận diện sản phẩm khi nhập lại.');
      return {id,data,row:i+2,balance:row['Tồn kho']};
    } catch (err) { throw new InventoryError(400,'Dòng '+(i+2)+': '+(err as Error).message); }
  });
  return inventoryTransaction(async session => {
    const seen = new Set<string>();
    let inserted=0, updated=0;
    for (const {id,data,row,balance} of prepared) {
      const existing = await Product.findOne(id ? {_id:id} : {sku:data.sku},null,{session}).collation({locale:'en',strength:2});
      if ((id && !existing) || existing?.archived) throw new InventoryError(409,'Dòng '+row+': sản phẩm đã lưu trữ hoặc ID không tồn tại.');
      if (!existing && balance != null && Number(balance) !== 0) throw new InventoryError(400,'Dòng '+row+': dùng phiếu nhập để ghi nhận tồn đầu kỳ.');
      const record = existing || new Product({stock:0});
      const key = String(record._id);
      if (seen.has(key)) throw new InventoryError(409,'Dòng '+row+': sản phẩm xuất hiện hai lần.');
      seen.add(key); record.set(data); await record.save({session});
      if (existing) updated++; else inserted++;
    }
    return {inserted,updated};
  });
}
