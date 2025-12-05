#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 模拟 Vercel 环境
process.env.VERCEL = '1';
process.env.NODE_ENV = 'production';

console.log('🔍 配置文件验证脚本');
console.log('================================');

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 计算可能的配置文件路径
const possiblePaths = [
  path.join(__dirname, 'config/config.yaml'),
  path.join(__dirname, '../config/config.yaml'),
  path.join(__dirname, '../../config/config.yaml'),
  '/var/task/config/config.yaml',
  '/var/task/src/config/config.yaml'
];

console.log('📁 检查配置文件路径:');
possiblePaths.forEach((p, i) => {
  const exists = fs.existsSync(p);
  const size = exists ? fs.statSync(p).size : 0;
  console.log(`  ${i + 1}. ${p} ${exists ? '✅ 存在' : '❌ 不存在'} ${size > 0 ? `(大小: ${size} bytes)` : ''}`);
});

console.log('\n📁 检查其他配置文件:');
const otherFiles = [
  'config/feeds.opml',
  'config/keywords.txt'
];

otherFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  const exists = fs.existsSync(fullPath);
  const size = exists ? fs.statSync(fullPath).size : 0;
  console.log(`  - ${file} ${exists ? '✅ 存在' : '❌ 不存在'} ${size > 0 ? `(大小: ${size} bytes)` : ''}`);
});

// 尝试加载配置
try {
  console.log('\n⚙️  尝试加载配置文件...');
  
  // 动态导入配置模块
  const { loadConfig } = await import('../src/config/config.js');
  
  const config = loadConfig();
  
  console.log('✅ 配置文件加载成功!');
  console.log('📋 配置信息:');
  console.log(`  - RSS 最大文章数: ${config.rss.max_articles_per_feed}`);
  console.log(`  - 请求超时: ${config.rss.request_timeout}ms`);
  console.log(`  - 关键词过滤: ${config.filter.enabled ? '启用' : '禁用'}`);
  console.log(`  - AI 筛选: ${config.ai.enabled ? '启用' : '禁用'}`);
  console.log(`  - 钉钉推送: ${config.dingtalk.webhook ? '配置' : '未配置'}`);
  
} catch (error) {
  console.error('❌ 配置文件加载失败:', error.message);
  console.error('💡 请检查:');
  console.error('  1. 配置文件是否存在于正确路径');
  console.error('  2. 文件权限是否正确');
  console.error('  3. YAML 格式是否正确');
}

console.log('\n================================');
console.log('验证完成!');