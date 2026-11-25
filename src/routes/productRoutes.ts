import { Router, type Response } from 'express';
import mongoose from 'mongoose';
import Decimal from 'decimal.js-light';
import { Product, type IProduct } from '../models/Product.js';
import { normalizeLegacyCatalogFields, parseCatalog } from '../lib/productCatalog.js';
import { InventoryError, inventoryTransaction, lockWarehouse } from '../services/inventory.js';

const router = Router({ caseSensitive: true });
const current = { archived: { $ne: true } };

function serializeProduct(product: IProduct) {
  const stored = product.toObject();
  const fields = { ...stored };
  // Mongoose fills missing arrays with defaults when it reads an older record.
  for (const key of ['images', 'categoryIds', 'categoryNames']) {
    if (product.$isDefault(key)) delete fields[key];
  }
  return { ...stored, ...normalizeLegacyCatalogFields(fields) };
}

function failure(res: Response, error: any) {
  if (error instanceof InventoryError) return res.status(error.status).json({ error: error.message });
  if (error.code === 11000) return res.status(409).json({ error: 'SKU đã thuộc về sản phẩm khác.' });
  if (['ValidationError','CastError'].includes(error.name)) return res.status(400).json({ error: 'Thông tin sản phẩm không hợp lệ.' });
  return res.status(500).json({ error: 'Không thể xử lý yêu cầu. Vui lòng thử lại.' });
}
router.param('id', (_req,res,next,id) => mongoose.isObjectIdOrHexString(id) ? next() : res.status(400).json({error:'Mã sản phẩm không hợp lệ.'}));
router.get('/', async (req, res) => {
  try {
    const filter: Record<string, unknown> = { ...current };
    if (typeof req.query.categoryId === 'string') filter.categoryIds = req.query.categoryId;
    if (!req.adminUser) filter.active = { $ne: false };
    else if (req.query.active !== undefined) filter.active = req.query.active === 'true';
    const query = Product.find(filter, req.adminUser ? undefined : '-warehouseStock -__v -archived');
    if (req.query.page !== undefined || req.query.limit !== undefined) {
      const page = Number(req.query.page ?? 1), limit = Number(req.query.limit ?? 50);
      if (!Number.isSafeInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 200) return res.status(400).json({error:'Trang không hợp lệ.'});
      query.skip((page-1)*limit).limit(limit);
    }
    const products = await query.sort({ isFeatured: -1, createdAt: -1, _id: -1 });
    res.json(products.map(serializeProduct));
  } catch (error) { failure(res, error); }
});

router.post('/', async (req, res) => {
  let data;
  try { data = parseCatalog(req.body, true); } catch (error) { return res.status(400).json({error: (error as Error).message}); }
  try { res.status(201).json(await Product.create({...data, stock: 0})); } catch (error) { failure(res,error); }
});
router.put('/:id', async (req, res) => {
  let data;
  try { data = parseCatalog(req.body); } catch (error) { return res.status(400).json({error: (error as Error).message}); }
  try {
    const updated = await Product.findOneAndUpdate({_id:req.params.id,...current}, {$set:data}, {runValidators:true,new:true});
    if (!updated) return res.status(404).json({error:'Không tìm thấy sản phẩm.'});
    res.json(updated);
  } catch (error) { failure(res,error); }
});
router.delete('/:id', async (req, res) => {
  try {
    const archived = await Product.findOneAndUpdate({_id:req.params.id,...current,stock:{$not:{$gt:0}},$expr:{$allElementsTrue:[{$map:{input:{$objectToArray:{$ifNull:['$warehouseStock',{}]}},as:'wh',in:{$eq:['$$wh.v',0]}}}]}}, {$set:{archived:true,active:false}});
    if (!archived) {
      if (!await Product.exists({_id:req.params.id,...current})) return res.status(404).json({error:'Không tìm thấy sản phẩm.'});
      return res.status(409).json({error:'Sản phẩm còn tồn kho. Hãy ẩn khỏi cửa hàng hoặc lập phiếu xuất trước khi lưu trữ.'});
    }
    res.json({success:true});
  } catch (error) { failure(res,error); }
});
router.patch('/:id/stock', async (req,res) => {
  try {
    const { warehouseId, quantity, expectedUnallocated } = req.body;
    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(expectedUnallocated)) return res.status(400).json({error:'Cần số lượng phân bổ và tồn chưa phân bổ hiện tại.'});
    await inventoryTransaction(async session => {
      const id = await lockWarehouse(session,warehouseId);
      const product = await Product.findOne({_id:req.params.id,...current},null,{session}).lean();
      if (!product) throw new InventoryError(404,'Không tìm thấy sản phẩm.');
      const balances = product.warehouseStock || {};
      const available = Object.values(balances).reduce<Decimal>((sum,v) => sum.minus(Number(v)),new Decimal(product.stock ?? 0));
      if (!available.eq(expectedUnallocated) || available.lt(quantity)) throw new InventoryError(409,'Tồn chưa phân bổ đã thay đổi. Hãy tải lại danh sách.');
      const next = new Decimal(balances[id] || 0).plus(quantity);
      if (!next.eq(next.toNumber())) throw new InventoryError(400,'Số lượng vượt độ chính xác.');
      await Product.updateOne({_id:product._id},{$set:{warehouseStock:{...balances,[id]:next.toNumber()}}},{session});
    });
    res.json({success:true});
  } catch(error) { failure(res,error); }
});
export default router;
