# RSS 技术资讯推送工具

一款前端技术资讯推送工具，从 RSS 订阅源抓取最新文章，通过关键词过滤和 AI 智能筛选后推送到钉钉。

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置钉钉机器人

复制 `.env.example` 为 `.env` 并填写钉钉机器人配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```bash
DINGTALK_WEBHOOK=https://oapi.dingtalk.com/robot/send?access_token=xxx
DINGTALK_SECRET=SECxxx
```

**测试配置**：

```bash
pnpm test:notify
```

### 3. 配置订阅源（可选）

订阅源配置文件位于 `config/feeds.opml`，已包含常见的前端技术订阅源。

### 4. 配置关键词过滤（可选）

关键词配置文件位于 `config/keywords.txt`，可根据需要修改。

### 5. 配置 AI 筛选（可选）

AI 筛选功能可以帮助你从大量文章中自动挑选最有价值的内容。

在 `.env` 文件中添加：

```bash
# 启用 AI 筛选
AI_ENABLED=true

# DeepSeek API Key（访问 https://platform.deepseek.com/ 获取）
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**测试 AI 筛选**：

```bash
pnpm test:ai
```

**详细配置说明**：参见 [AI 筛选功能使用指南](docs/AI_FILTER_GUIDE.md)

### 6. 运行

```bash
# 测试钉钉机器人配置
pnpm test:notify

# 测试 AI 筛选功能
pnpm test:ai

# 开发模式（单次执行）
pnpm dev

# 生产模式（定时任务）
pnpm build
pnpm start
```

## 📁 项目结构

```
rss-tech-notifier/
├── src/
│   ├── index.ts                 # 程序入口
│   ├── config/
│   │   └── config.ts            # 配置管理
│   ├── parsers/
│   │   └── opml-parser.ts       # OPML 解析器
│   ├── fetchers/
│   │   └── rss-fetcher.ts       # RSS 抓取器
│   ├── filters/
│   │   ├── types.ts             # 类型定义
│   │   ├── keyword-parser.ts    # 关键词解析器
│   │   └── article-filter.ts    # 文章过滤器
│   ├── ai/                      # AI 筛选模块
│   │   ├── types.ts             # AI 类型定义
│   │   └── ai-filter.ts         # AI 筛选器
│   ├── cache/
│   │   └── article-cache.ts     # 文章缓存
│   ├── notifiers/
│   │   └── dingtalk.ts          # 钉钉推送
│   └── scheduler/
│       └── scheduler.ts         # 定时任务
├── config/
│   ├── config.yaml              # 配置文件
│   ├── feeds.opml               # 订阅源
│   └── keywords.txt             # 关键词配置
├── docs/
│   └── AI_FILTER_GUIDE.md       # AI 筛选功能使用指南
├── data/
│   └── cache.json               # 缓存数据（自动生成）
└── .env                         # 环境变量
```

## 🤖 AI 筛选功能

AI 筛选功能使用 DeepSeek API 对文章进行智能分析，帮助你从大量文章中自动挑选最有价值的内容。

### 工作流程

```
RSS 抓取 → 去重 → 关键词过滤 → AI 筛选 → 推送到钉钉
```

### 快速配置

1. 获取 DeepSeek API Key：访问 [https://platform.deepseek.com/](https://platform.deepseek.com/)
2. 在 `.env` 中配置：
   ```bash
   AI_ENABLED=true
   DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
3. 自定义筛选规则（可选）：编辑 `config/config.yaml` 中的 `ai.prompt`
