#!/bin/bash

# FE-News Vercel 部署脚本

echo "🚀 FE-News Vercel 部署脚本"
echo "================================"

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ 未找到 Vercel CLI，请先安装：npm install -g vercel"
    exit 1
fi

# 构建项目
echo "📦 构建项目..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
fi

echo "✅ 构建成功"

# 验证配置
echo "🔍 验证配置..."
npm run verify:config

if [ $? -ne 0 ]; then
    echo "⚠️  配置验证失败，但继续部署"
fi

# 部署到 Vercel
echo "🌐 部署到 Vercel..."
vercel

echo "================================"
echo "✅ 部署完成！"
echo ""
echo "部署后的检查步骤："
echo "1. 访问 /health 接口检查配置文件加载状态"
echo "2. 访问 /api/articles 接口测试文章获取功能"
echo "3. 查看 Vercel Dashboard 的日志确认无错误"