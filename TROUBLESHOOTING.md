# FE-News 故障排除指南

## 配置文件加载失败问题

### 错误信息
```
错误：配置文件加载失败：/var/task/src/config/config.yaml
```

### 解决方案

#### 1. 路径问题
在 Vercel 环境中，文件路径可能与本地环境不同。我们已经更新了配置加载逻辑来自动检测多种可能的路径：

- `dist/config/config.yaml` (编译后路径)
- `/var/task/config/config.yaml` (Vercel 根目录)
- `/var/task/src/config/config.yaml` (Vercel 源码目录)

#### 2. 构建配置
确保 `vercel.json` 和 `vercel.config.js` 正确配置了 `includeFiles`：

```json
{
  "functions": {
    "api/index.ts": {
      "includeFiles": [
        "src/config/config.yaml",
        "src/config/feeds.opml", 
        "src/config/keywords.txt"
      ]
    }
  }
}
```

#### 3. 手动指定配置路径
如果自动检测失败，可以通过环境变量手动指定：

```bash
CONFIG_PATH=/var/task/config/config.yaml
```

#### 4. 验证配置
运行验证脚本检查配置文件：

```bash
npm run verify:config
```

### 环境变量配置

在 Vercel 项目设置中配置以下环境变量：

```bash
# 基础配置
NODE_ENV=production
VERCEL=1

# 可选配置
DINGTALK_WEBHOOK=your_webhook_url
DINGTALK_SECRET=your_secret
DEEPSEEK_API_KEY=your_api_key
AI_ENABLED=false
FILTER_ENABLED=true
```

### 常见问题

#### Q: 配置文件存在但仍然报错
A: 检查文件权限，确保文件可读。在 Vercel 中，确保 `includeFiles` 正确配置。

#### Q: YAML 格式错误
A: 使用在线 YAML 验证器检查语法，或运行：
```bash
npm run verify:config
```

#### Q: 本地正常但 Vercel 部署失败
A: 
1. 检查构建日志确认文件是否被包含
2. 确认 `vercel-build.json` 配置正确
3. 尝试设置 `CONFIG_PATH` 环境变量

### 调试步骤

1. **检查文件存在性**：
   ```bash
   curl https://your-domain.com/health
   ```

2. **查看构建日志**：
   在 Vercel Dashboard 查看构建日志，确认配置文件被正确包含。

3. **使用验证脚本**：
   ```bash
   npm run build
   npm run verify:config
   ```

4. **检查环境变量**：
   确保所有必需的环境变量都已配置。

### 联系支持

如果问题仍然存在，请提供：
1. 完整的错误日志
2. Vercel 构建日志
3. `vercel.json` 和 `vercel.config.js` 文件内容
4. 环境变量配置截图