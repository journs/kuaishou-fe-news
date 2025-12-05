import express, { Express, Request, Response } from "express";
import cors from "cors";
import { ArticleController } from "./controllers/article-controller.js";
import { loadConfig } from "./config/config.js";

const app: Express = express();
const config = loadConfig();

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS配置
if (config.server?.cors) {
  app.use(cors());
}

// 路由
const articleController = new ArticleController();

app.get("/api/articles", articleController.getArticles.bind(articleController));

// 健康检查接口
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 根路径返回API信息
app.get("/", (req, res) => {
  res.json({
    name: "RSS 技术资讯推送工具 API",
    version: "1.0.0",
    endpoints: {
      articles: "GET /api/articles - 获取过滤后的文章",
      health: "GET /health - 健康检查",
    },
    query_params: {
      limit: "限制返回文章数量（可选）",
      category: "按分类筛选文章（可选）",
      refresh: "是否强制刷新缓存（可选，true/false）",
    },
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Not Found",
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// 全局错误处理
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    success: false,
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
  });
});

// 在非生产环境启动服务器
if (process.env.NODE_ENV !== "production") {
  const port = config.server?.port || 3000;
  const server = app.listen(port, () => {
    console.log("========================================");
    console.log("🚀 RSS 技术资讯推送工具 API 启动");
    console.log(`📡 服务器运行在: http://localhost:${port}`);
    console.log(`📚 API 文档: http://localhost:${port}/`);
    console.log("========================================");
  });

  // 优雅关闭
  process.on("SIGINT", () => {
    console.log("\n\n收到退出信号，正在停止服务器...");
    server.close(() => {
      console.log("✅ 服务器已停止");
      process.exit(0);
    });
  });

  process.on("SIGTERM", () => {
    console.log("\n\n收到终止信号，正在停止服务器...");
    server.close(() => {
      console.log("✅ 服务器已停止");
      process.exit(0);
    });
  });
}

// 导出app供Vercel使用
export default app;