#!/bin/bash

# RSS 技术资讯推送工具 - Vercel 部署脚本

echo "🚀 开始部署 RSS 技术资讯推送工具到 Vercel..."

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ 未找到 Vercel CLI，请先安装：npm install -g vercel"
    exit 1
fi

# 检查是否已登录
if ! vercel whoami &> /dev/null; then
    echo "🔐 请先登录 Vercel 账号..."
    vercel login
fi

echo "📦 安装依赖..."
pnpm install

echo "🔨 构建项目..."
npm run build

echo "☁️  开始部署到 Vercel..."
vercel

echo "✅ 部署完成！"
echo ""
echo "📖 查看部署状态: vercel dashboard"
echo "🌐 查看日志: vercel logs"
echo ""
echo "💡 提示："
echo "   - 使用 'vercel --prod' 部署到生产环境"
echo "   - 在 Vercel 项目设置中配置环境变量"
echo "   - 访问 https://your-project-name.vercel.app/api/articles 测试 API"