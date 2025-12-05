# Vercel 部署检查清单

## ✅ 部署前准备

- [ ] 安装 pnpm
- [ ] 安装 Vercel CLI
- [ ] 登录 Vercel 账号
- [ ] 项目可以正常构建 (`npm run build`)
- [ ] 本地测试 API 正常工作

## ✅ 配置文件

- [ ] `vercel.json` - Vercel 配置
- [ ] `tsconfig.json` - TypeScript 配置
- [ ] `src/server.ts` - 服务器入口文件
- [ ] `src/config/config.ts` - 配置加载
- [ ] `src/services/article-service.ts` - 文章服务
- [ ] `src/controllers/article-controller.ts` - API 控制器

## ✅ 部署步骤

1. **首次部署**
   ```bash
   ./deploy.sh
   ```

2. **或者手动部署**
   ```bash
   # 登录
   vercel login
   
   # 初始化项目
   vercel init
   
   # 部署预览环境
   vercel
   
   # 部署生产环境
   vercel --prod
   ```

3. **配置环境变量**（可选）
   - `NODE_ENV=production`
   - `DINGTALK_WEBHOOK=...`
   - `DINGTALK_SECRET=...`
   - `DEEPSEEK_API_KEY=...`

## ✅ 部署后验证

- [ ] API 可以访问：`https://your-project.vercel.app/api/articles`
- [ ] 健康检查正常：`https://your-project.vercel.app/health`
- [ ] API 文档可访问：`https://your-project.vercel.app/`
- [ ] 查询参数工作正常
- [ ] 错误处理正常

## ✅ GitHub Actions 自动部署（可选）

1. 在 Vercel 项目设置中获取：
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

2. 在 GitHub 项目设置中添加 Secrets：
   ```
   VERCEL_TOKEN=your_token
   VERCEL_ORG_ID=your_org_id
   VERCEL_PROJECT_ID=your_project_id
   ```

3. 推送代码到 main 分支，自动触发部署

## 🚨 注意事项

- Vercel 免费版有请求次数限制
- Serverless 函数有执行时间限制（15秒）
- 缓存不会持久化（临时存储）
- 确保 OPML 文件和配置文件在部署包中

## 🆘 故障排除

**构建失败：**
- 检查 TypeScript 编译错误
- 确认所有依赖已安装
- 检查 Node.js 版本兼容性

**API 无法访问：**
- 检查 Vercel 日志
- 验证环境变量配置
- 确认文件路径正确

**性能问题：**
- 考虑启用缓存（Redis）
- 优化 RSS 抓取逻辑
- 设置合理的超时时间