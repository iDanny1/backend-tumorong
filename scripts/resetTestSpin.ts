/**
 * resetTestSpin.ts — Xóa dữ liệu SpinUser để test lại từ đầu
 * Chạy: npx tsx scripts/resetTestSpin.ts [SĐT1] [SĐT2]
 *
 * Ví dụ:
 *   npx tsx scripts/resetTestSpin.ts 0974543740
 *   npx tsx scripts/resetTestSpin.ts 0974543740 0912345678
 */
import "dotenv/config";
import mongoose from "mongoose";
import { SpinUser } from "../src/models/SpinUser.js";

const MONGO_URI = process.env.MONGODB_URI || "";
if (!MONGO_URI) { console.error("Thiếu MONGODB_URI trong .env"); process.exit(1); }

const args = process.argv.slice(2);
const testPhones = args.length > 0
  ? args
  : (process.env.TEST_PHONES || "0974543740").split(",").map(p => p.trim());

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Kết nối MongoDB thành công\n");

  for (const phone of testPhones) {
    const normalized = phone.replace(/^(\+84|84)/, "0").replace(/[^0-9]/g, "");
    const result = await SpinUser.deleteMany({
      $or: [{ phone: normalized }, { phone }],
    });
    if (result.deletedCount > 0) {
      console.log(`Đã xóa ${result.deletedCount} bản ghi cho SĐT: ${normalized}`);
    } else {
      console.log(`Không tìm thấy bản ghi nào cho SĐT: ${normalized}`);
    }
  }

  await mongoose.disconnect();
  console.log("\nHoàn thành. Bạn có thể test lại từ đầu.");
}

run().catch(err => { console.error("Lỗi:", err); process.exit(1); });
