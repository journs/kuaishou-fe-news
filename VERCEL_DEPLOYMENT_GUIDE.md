# RSS 技术资讯推送工具 - Vercel 部署指南

## 🚀 快速部署

### 前置要求

1. Node.js >= 18
2. pnpm 包管理器

### 部署步骤

#### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

#### 2. 登录 Vercel

```bash
vercel login
```

#### 3. 初始化并部署

```bash
# 进入项目目录
cd FE-News

# 初始化 Vercel 项目
vercel init

# 部署到预览环境
vercel

# 部署到生产环境
vercel --prod
```

### 环境变量配置

在 Vercel 项目设置中配置以下环境变量（可选）：

- `NODE_ENV=production` - 生产环境标识
- `DINGTALK_WEBHOOK` - 钉钉 Webhook 地址（如果需要推送功能）
- `DINGTALK_SECRET` - 钉钉密钥（如果需要推送功能）
- `DEEPSEEK_API_KEY` - DeepSeek API 密钥（如果启用 AI 筛选）

### API 端点

部署成功后，你的 API 将可通过以下端点访问：

- `https://your-project-name.vercel.app/api/articles` - 获取文章列表
- `https://your-project-name.vercel.app/` - API 文档
- `https://your-project-name.vercel.app/health` - 健康检查

### 查询参数

- `limit` - 限制返回文章数量
- `category` - 按分类筛选
- `refresh` - 是否强制刷新缓存（true/false）

### 示例

```bash
# 获取所有文章
curl https://your-project-name.vercel.app/api/articles

# 获取前5篇文章
curl https://your-project-name.vercel.app/api/articles?limit=5

# 获取特定分类的文章
curl https://your-project-name.vercel.app/api/articles?category=前端

# 强制刷新缓存
curl https://your-project-name.vercel.app/api/articles?refresh=true
```

## 📝 注意事项

1. **文件路径**: Vercel 环境中，配置文件路径为 `config/config.yaml`
2. **缓存**: Vercel 的函数执行环境是临时的，缓存可能不会持久化
3. **请求限制**: Vercel 免费版有请求次数限制
4. **执行时间**: Serverless 函数有执行时间限制（通常 15 秒）

## 🔧 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
npm run dev:server

# 构建
npm run build

# 启动生产服务器
npm run start:server
```