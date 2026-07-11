import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tumorong';

async function restoreData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB for restoration');

    // Restore Categories
    const catPath = path.join(__dirname, 'categories.db');
    if (fs.existsSync(catPath)) {
      console.log('Restoring Categories...');
      await mongoose.connection.collection('categories').drop().catch(() => {});
      const lines = fs.readFileSync(catPath, 'utf-8').split('\n').filter(Boolean);
      for (const line of lines) {
        const obj = JSON.parse(line);
        delete obj._id; // Let Mongo generate new ObjectId
        await mongoose.connection.collection('categories').insertOne(obj);
      }
      console.log(`✅ Restored ${lines.length} categories.`);
    }

    // Restore Users
    const userPath = path.join(__dirname, 'users.db');
    if (fs.existsSync(userPath)) {
      console.log('Restoring Users...');
      await mongoose.connection.collection('users').drop().catch(() => {});
      const lines = fs.readFileSync(userPath, 'utf-8').split('\n').filter(Boolean);
      for (const line of lines) {
        const obj = JSON.parse(line);
        delete obj._id;
        await mongoose.connection.collection('users').insertOne(obj);
      }
      console.log(`✅ Restored ${lines.length} users.`);
    }

    // Restore Products
    const prodPath = path.join(__dirname, 'products.db');
    if (fs.existsSync(prodPath)) {
      console.log('Restoring Products...');
      await mongoose.connection.collection('products').drop().catch(() => {});
      const lines = fs.readFileSync(prodPath, 'utf-8').split('\n').filter(Boolean);
      for (const line of lines) {
        const obj = JSON.parse(line);
        delete obj._id;
        await mongoose.connection.collection('products').insertOne(obj);
      }
      console.log(`✅ Restored ${lines.length} products.`);
    }

    // Restore Orders
    const orderPath = path.join(__dirname, 'orders.db');
    if (fs.existsSync(orderPath)) {
      console.log('Restoring Orders...');
      await mongoose.connection.collection('orders').drop().catch(() => {});
      const lines = fs.readFileSync(orderPath, 'utf-8').split('\n').filter(Boolean);
      for (const line of lines) {
        const obj = JSON.parse(line);
        delete obj._id;
        await mongoose.connection.collection('orders').insertOne(obj);
      }
      console.log(`✅ Restored ${lines.length} orders.`);
    }

    // Restore News/Articles
    const newsPath = path.join(__dirname, 'news.db');
    if (fs.existsSync(newsPath)) {
      console.log('Restoring News/Articles...');
      await mongoose.connection.collection('articles').drop().catch(() => {});
      const lines = fs.readFileSync(newsPath, 'utf-8').split('\n').filter(Boolean);
      for (const line of lines) {
        const obj = JSON.parse(line);
        delete obj._id;
        await mongoose.connection.collection('articles').insertOne(obj);
      }
      console.log(`✅ Restored ${lines.length} articles.`);
    }

    console.log('🎉 All NeDB data restored to MongoDB successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Restore error:', err);
    process.exit(1);
  }
}

restoreData();
