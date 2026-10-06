import 'dotenv/config';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import mongoose from 'mongoose';
import * as xlsx from 'xlsx';
import { Customer, prepareCustomerIndexes } from '../src/models/Customer.js';
import { customerFromRow, importCustomerRows } from '../src/lib/customerImport.js';

const file = process.argv[2];
if (!file) throw new Error('Usage: npm run customers:import -- <file.xlsx> [--dry-run]');
const workbook = xlsx.read(readFileSync(file), { type: 'buffer' });
const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]], { raw: false, defval: '' });
if (process.argv.includes('--dry-run')) {
  const customers = rows.map(customerFromRow).filter(Boolean);
  console.log(JSON.stringify({ rows: rows.length, valid: customers.length, missingPhone: customers.filter(c => !c!.phone).length, uniqueProfiles: new Set(customers.map(c => c!.importKey)).size }));
} else {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tumorong', { serverSelectionTimeoutMS: 15000 });
    const collection = mongoose.connection.db!.collection('customers');
    const backupDir = 'data/customer-import-backups';
    mkdirSync(backupDir, { recursive: true });
    const backupPath = `${backupDir}/${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    writeFileSync(backupPath, mongoose.mongo.BSON.EJSON.stringify({
      database: mongoose.connection.name,
      indexes: await collection.indexes(),
      customers: await collection.find({}).toArray(),
    }, { relaxed: false }), { flag: 'wx' });
    await prepareCustomerIndexes();
    const before = await Customer.countDocuments();
    const result = await importCustomerRows(rows, Customer);
    const keys = rows.map(customerFromRow).filter(Boolean).map(c => c!.importKey);
    const verified = await Customer.countDocuments({ importKey: { $in: keys } });
    console.log(JSON.stringify({ ...result, before, after: await Customer.countDocuments(), verified, backupPath }, null, 2));
    if (verified !== new Set(keys).size) throw new Error('Import verification failed');
  } catch (error: any) {
    console.error(`Customer import failed (${error.name || 'Error'}).`);
    process.exitCode = 1;
  } finally { await mongoose.disconnect(); }
}
