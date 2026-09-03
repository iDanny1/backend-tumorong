import 'dotenv/config';
import mongoose, { Schema } from 'mongoose';

async function check() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const spinUserSchema = new Schema({}, { strict: false, collection: 'spin_users' });
  const SpinUser = mongoose.model('SpinUserCheck', spinUserSchema);
  const users = await SpinUser.find({}).sort({ updatedAt: -1 }).limit(20).lean();
  console.log('--- DANH SÁCH SPIN USERS GẦN NHẤT ---');
  users.forEach((u: any) => {
    console.log(`zaloId: ${u.zaloId} | spinsLeft: ${u.spinsLeft} | name: ${u.name || ''} | phone: ${u.phone || ''} | isTestUser: ${u.isTestUser}`);
  });
  await mongoose.disconnect();
}
check().catch(console.error);
