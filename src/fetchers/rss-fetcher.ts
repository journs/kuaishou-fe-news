import Parser from "rss-parser";
import type { RSSFeed } from "../parsers/opml-parser.js";

export interface Article {
  title: string;
  link: string;
  published: string;
  summary?: string;
  feedName: string;
  category?: string;
  reason?: string; // AI 筛选理由
}

export class RSSFetcher {
  private parser: Parser;
  private requestTimeout: number;
  private maxArticleAgeDays: number;

  constructor(requestTimeout: number = 10000, maxArticleAgeDays: number = 7) {
    this.parser = new Parser({
      timeout: requestTimeout,
    });
    this.requestTimeout = requestTimeout;
    this.maxArticleAgeDays = maxArticleAgeDays;
  }

  /**
   * 抓取单个 RSS 源
   * @param feed RSS 订阅源
   * @param maxArticles 最大文章数
   * @returns 文章列表
   */
  async fetchFeed(feed: RSSFeed, maxArticles: number): Promise<Article[]> {
    try {
      const rssFeed = await this.parser.parseURL(feed.url);
      const articles: Article[] = [];

      const items = rssFeed.items.slice(0, maxArticles);

      // 获取指定天数前的时间
      const oldestDate = new Date();
      oldestDate.setDate(oldestDate.getDate() - this.maxArticleAgeDays);
      
      for (const item of items) {
        if (!item.link) continue;

        // 检查发布时间是否在指定时间内
        const publishedDate = new Date(item.pubDate || item.isoDate || new Date().toISOString());
        if (publishedDate < oldestDate) {
          continue; // 跳过超过指定时间的文章
        }

        articles.push({
          title: item.title || "Untitled",
          link: item.link,
          published: item.pubDate || item.isoDate || new Date().toISOString(),
          summary: item.contentSnippet || item.content,
          feedName: feed.name,
          category: feed.category,
        });
      }

      return articles;
    } catch (error) {
      console.error(
        `抓取失败 [${feed.name}]: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return [];
    }
  }

  /**
   * 抓取所有 RSS 源
   * @param feeds RSS 订阅源列表
   * @param maxArticles 每个源的最大文章数
   * @returns 所有文章列表
   */
  async fetchAllFeeds(
    feeds: RSSFeed[],
    maxArticles: number
  ): Promise<Article[]> {
    const tasks = feeds.map((feed) =>
      (async () => {
        return this.fetchFeed(feed, maxArticles);
      })()
    );

    const settled = await Promise.allSettled(tasks);
    return settled.flatMap((res) =>
      res.status === "fulfilled" ? res.value : []
    );
  }
}
