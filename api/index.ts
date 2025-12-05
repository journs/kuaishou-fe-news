// Vercel 适配器
import { createServer } from 'http';
import app from '../src/server.js';

// 创建 HTTP 服务器
const server = createServer(app);

// 导出处理函数供 Vercel 使用
export default (req, res) => {
  server.emit('request', req, res);
};