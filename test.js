import Datastore from '@seald-io/nedb';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const productDB = new Datastore({ filename: path.join(__dirname, 'products.db'), autoload: true });

productDB.find({}).exec((err, docs) => {
  if (err) {
    console.error('Error:', err);
  } else {
    for (const doc of docs) {
      if (!doc.name || typeof doc.name !== 'string') {
        console.log('MISSING OR INVALID NAME:', doc);
      }
      if (!doc._id || typeof doc._id !== 'string') {
        console.log('MISSING OR INVALID ID:', doc);
      }
    }
    console.log('Done checking docs.');
  }
});
