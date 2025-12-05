#!/usr/bin/env node
/**
 * 钉钉机器人即时通知脚本
 * 立即抓取 RSS 文章并推送到钉钉（不受定时任务限制）
 */

import { runTask } from '../src/index.js';

async function main() {
  console.log('========================================');
  console.log('📨 立即推送技术资讯');
  console.log('========================================\n');

  try {
    await runTask();
    
    console.log('\n========================================');
    console.log('✅ 推送完成');
    console.log('========================================\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ 推送失败:', error instanceof Error ? error.message : String(error));
    console.log('\n请检查配置文件和网络连接。\n');
    process.exit(1);
  }
}

// 运行
main();
