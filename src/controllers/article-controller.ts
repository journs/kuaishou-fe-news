import { Request, Response } from "express";
import { ArticleService } from "../services/article-service.js";

export class ArticleController {
  private articleService = new ArticleService();

  async getArticles(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || undefined;
      const category = req.query.category as string || undefined;
      const refresh = req.query.refresh === "true";

      // 验证参数
      if (limit && (isNaN(limit) || limit <= 0)) {
        return res.status(400).json({
          success: false,
          error: "Invalid limit parameter. Must be a positive integer.",
        });
      }

      // 获取配置中的限制
      const config = this.articleService["config"];
      const maxLimit = config.api?.max_limit || 200;
      const defaultLimit = config.api?.default_limit || 50;

      const finalLimit = limit || (refresh ? undefined : defaultLimit);
      if (finalLimit && finalLimit > maxLimit) {
        return res.status(400).json({
          success: false,
          error: `Limit exceeds maximum allowed value of ${maxLimit}.`,
        });
      }

      const { articles, processInfo } = await this.articleService.getFilteredArticles({
        limit: finalLimit,
        category,
        refresh,
      });

      res.json({
        success: true,
        data: {
          articles,
          total: articles.length,
          processInfo,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch articles",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}