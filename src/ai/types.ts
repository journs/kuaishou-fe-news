import type { Article } from "../fetchers/rss-fetcher.js";

/**
 * AI 筛选配置
 */
export interface AIFilterConfig {
  enabled: boolean;
  api_key: string;
  api_url: string;
  model: string;
  prompt: string;
  max_tokens: number;
  temperature: number;
  keywords_path?: string; // 关键词文件路径（可选）
}

/**
 * AI 筛选请求中的文章数据
 */
export interface AIArticleInput {
  title: string;
  summary?: string;
  feedName: string;
  category?: string;
  link: string;
}

/**
 * AI 返回的筛选结果（标准化格式）
 */
export interface AIFilterResponse {
  selectedArticles: {
    link: string; // 用于匹配原始文章
    reason?: string; // 可选：筛选原因
  }[];
  summary?: string; // 可选：筛选总结
}

/**
 * 将 Article 转换为 AIArticleInput
 */
export function articleToAIInput(article: Article): AIArticleInput {
  return {
    title: article.title,
    summary: article.summary,
    feedName: article.feedName,
    category: article.category,
    link: article.link,
  };
}

