import {Router} from 'express';
import mongoose, {Schema} from 'mongoose';
import {isDeepStrictEqual} from 'node:util';
import {z} from 'zod';
import {contractTemplates} from '../components/contracts/contractTemplates.js';
import {contractText, formatContractValues, hasPlaceholder, renderContractText, validateContractField, type ContractTemplate} from '../components/contracts/contractTypes.js';

const clause = z.object({
  id: z.string().min(1).max(120), title: z.string().trim(), paragraphs: z.array(z.string().trim().min(1)),
});
const child = clause.extend({children: z.array(z.never()).length(0)}).refine(c => c.title || c.paragraphs.length);
const input = z.object({
  revision: z.number().int().nonnegative(), templateId: z.string(),
  values: z.record(z.string(), z.string()),
  articles: z.array(clause.extend({title: z.string().trim().min(1), children: z.array(child)})),
});
const SavedContract = mongoose.model('SavedContract', new Schema({
  _id: String, revision: { type: Number, required: true }, template: Schema.Types.Mixed,
  values: Schema.Types.Mixed, articles: Schema.Types.Mixed,
}, {timestamps: true, minimize: false}));
const router = Router();

function cleanSavedPartyLines(template: ContractTemplate): ContractTemplate {
  const a = template.parties.a.map(line => {
    if (line.startsWith('Địa chỉ trụ sở:')) {
      return line.replace(/\s*\(ghi đúng theo GCN\s+ĐKDN hiện hành\)\s*$/iu, '').trimEnd();
    }
    if (line.startsWith('Tài khoản ngân hàng:')) {
      return line.replace(/NN&PTNT Việt Nam\s*\(Agribank\)/iu, 'Agribank')
        .replace(/TMCP Sài Gòn Thương Tín\s*\(Sacombank\)/iu, 'Sacombank');
    }
    return line;
  });
  const b = template.parties.b.map(line => line === 'Tài khoản ngân hàng: [[partnerAccount]] tại Ngân hàng [[partnerBank]]'
    ? 'Tài khoản ngân hàng: [[partnerAccount]] tại [[partnerBank]]' : line);
  return {...template, parties: {a, b}};
}

router.get('/', async (req, res) => {
  const offset = Number(req.query.offset ?? 0);
  if (!Number.isSafeInteger(offset) || offset < 0) return res.sendStatus(400);
  try {
    const rows = await SavedContract.find({}, '_id revision template.name values.contractNumber values.partnerName updatedAt')
      .sort({updatedAt: -1, _id: 1}).skip(offset).limit(31).lean();
    res.json({items: rows.slice(0, 30), hasMore: rows.length > 30});
  } catch { res.status(500).json({message: 'Chưa tải được danh sách hợp đồng.'}); }
});

router.get('/:id', async (req, res) => {
  try {
    const doc = await SavedContract.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({message: 'Không tìm thấy hợp đồng.'});
    res.json({...doc, template: cleanSavedPartyLines(doc.template)});
  } catch { res.status(500).json({message: 'Chưa mở được hợp đồng.'}); }
});

router.delete('/:id', async (req, res) => {
  const revision = Number(req.query.revision);
  if (!z.uuid().safeParse(req.params.id).success || !Number.isSafeInteger(revision) || revision < 1) {
    return res.status(400).json({message: 'Mã hoặc phiên bản hợp đồng không hợp lệ.'});
  }
  try {
    const removed = await SavedContract.deleteOne({_id: req.params.id, revision});
    if (!removed.deletedCount && await SavedContract.exists({_id: req.params.id})) {
      return res.status(409).json({message: 'Hợp đồng vừa thay đổi. Mở lại để kiểm tra trước khi xóa.'});
    }
    res.json({deleted: true});
  } catch { res.status(500).json({message: 'Chưa xóa được hợp đồng. Vui lòng thử lại.'}); }
});

router.put('/:id', async (req, res) => {
  const parsed = input.safeParse(req.body);
  if (!z.uuid().safeParse(req.params.id).success || !parsed.success) {
    return res.status(400).json({message: 'Dữ liệu hợp đồng không hợp lệ.'});
  }
  const {revision, templateId, values, articles} = parsed.data;
  try {
    const existing = await SavedContract.findById(req.params.id).lean();
    const template: ContractTemplate | undefined = existing ? cleanSavedPartyLines(existing.template) : contractTemplates.find(t => t.id === templateId);
    if (!template || template.id !== templateId || template.fields.some(f => validateContractField(f, values[f.key]))) {
      return res.status(400).json({message: 'Vui lòng điền đủ thông tin theo mẫu hợp đồng.'});
    }
    const cleanValues = Object.fromEntries(template.fields.map(f => [f.key, values[f.key].trim()]));
    const display = formatContractValues(template, cleanValues);
    const ids = articles.flatMap(a => [a.id, ...a.children.map(c => c.id)]);
    if (new Set(ids).size !== ids.length || contractText(template, articles).some(t => hasPlaceholder(renderContractText(t, display, articles)))) {
      return res.status(400).json({message: 'Kiểm tra các điều khoản và dẫn chiếu trước khi lưu.'});
    }
    if (existing && isDeepStrictEqual(existing.template.parties, template.parties) && isDeepStrictEqual(existing.values, cleanValues) && isDeepStrictEqual(existing.articles, articles)) {
      return res.json({revision: existing.revision});
    }
    if (!existing && revision === 0) {
      await SavedContract.create({_id: req.params.id, revision: 1, template: {...template, articles: []}, values: cleanValues, articles});
      return res.status(201).json({revision: 1});
    }
    const result = await SavedContract.updateOne({_id: req.params.id, revision},
      {$set: {'template.parties': template.parties, values: cleanValues, articles}, $inc: {revision: 1}});
    if (result.modifiedCount) return res.json({revision: revision + 1});
    res.status(409).json({message: 'Hợp đồng đã thay đổi. Mở lại bản đã lưu để cập nhật.'});
  } catch (error) {
    if ((error as {code?: number}).code === 11000) return res.status(409).json({message: 'Hợp đồng vừa được lưu. Vui lòng thử lại.'});
    res.status(500).json({message: 'Chưa lưu được hợp đồng. Vui lòng thử lại.'});
  }
});
export default router;
