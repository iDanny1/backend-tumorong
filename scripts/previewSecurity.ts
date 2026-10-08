import express from 'express';
import session from 'express-session';
import path from 'node:path';
import { installAdminSecurity, signInAdmin, staffProfile } from '../src/security/admin.js';
import { securityConfig } from '../src/security/config.js';

// Local UI verification only: no real database, tokens, external writes or dotenv.
if (process.env.NODE_ENV === 'production' || !process.env.SECURITY_PREVIEW_PASSWORD) throw Error('Chỉ dùng bản xem thử trên localhost với SECURITY_PREVIEW_PASSWORD.');
const app = express(); app.set('case sensitive routing',true); app.use(express.json());
const user = { _id: 'fixture-admin', username: 'preview', name: 'Kiểm thử bảo mật', password: 'fixture-hash', role: 'admin', active: true };
const config = securityConfig({ NODE_ENV:'test', ADMIN_ALLOWED_ORIGINS:'http://127.0.0.1:8082' });
installAdminSecurity(app,{findById: () => ({ select: async () => user })},config,new session.MemoryStore());
app.post('/api/login',async (req,res) => {
  if(req.body.username !== 'preview' || req.body.password !== process.env.SECURITY_PREVIEW_PASSWORD) return res.status(401).json({message:'Sai thông tin xem thử.'});
  await signInAdmin(req,user); res.json(staffProfile(user));
});
app.get('/api/staff',(_req,res) => res.json([staffProfile(user)]));
app.get('/api/*',(_req,res) => res.json([]));
app.all('/api/*',(_req,res) => res.json({success:true}));
app.use(express.static(path.resolve('dist')));
app.get('*',(_req,res) => res.sendFile(path.resolve('dist/index.html')));
app.listen(8082,'127.0.0.1',() => console.log('Local security UI fixture: http://127.0.0.1:8082'));
