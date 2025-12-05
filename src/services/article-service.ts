import { loadConfig } from "../config/config.js";
import { OPMLParser } from "../parsers/opml-parser.js";
import { RSSFetcher } from "../fetchers/rss-fetcher.js";
import { KeywordParser } from "../filters/keyword-parser.js";
import { ArticleFilter } from "../filters/article-filter.js";
import { ArticleCache } from "../cache/article-cache.js";
import type { Article } from "../fetchers/rss-fetcher.js";
import fs from 'fs';
import path from 'path';

export interface ProcessInfo {
  totalFetched: number;
  afterDeduplication: number;
  afterKeywordFilter: number;
}

export interface GetArticlesOptions {
  limit?: number;
  category?: string;
  refresh?: boolean;
}

export class ArticleService {
  private config = loadConfig();

  async getFilteredArticles(options: GetArticlesOptions = {}): Promise<{
    articles: Article[];
    processInfo: ProcessInfo;
  }> {
    const { limit, category, refresh = false } = options;

    // 1. 解析 OPML（适配 Vercel 环境）
    const parser = new OPMLParser();
    let opmlPath: string;
    if (process.env.VERCEL) {
      // Vercel 环境，尝试多种可能的配置文件路径
      const __filename = new URL(import.meta.url).pathname;
      const __dirname = path.dirname(__filename);
      
      // 尝试的路径列表
      const possiblePaths = [
        path.join(__dirname, '../config/feeds.opml'),     // dist/services/../config/feeds.opml
        path.join(__dirname, '../../config/feeds.opml'),  // /var/task/config/feeds.opml
        path.join(__dirname, '../../../config/feeds.opml') // 备用路径
      ];
      
      // 查找存在的配置文件
      const foundPath = possiblePaths.find(p => fs.existsSync(p));
      
      if (foundPath) {
        opmlPath = foundPath;
      } else {
        // 如果都找不到，尝试使用环境变量
        const envConfigPath = process.env.CONFIG_PATH || '/var/task/config/feeds.opml';
        if (fs.existsSync(envConfigPath)) {
          opmlPath = envConfigPath;
        } else {
          throw new Error(`OPML 文件不存在于任何预期位置:\n${possiblePaths.join('\n')}\n环境变量路径: ${envConfigPath}`);
        }
      }
    } else {
      opmlPath = this.config.rss.opml_path;
    }
    const feeds = parser.parse(opmlPath);

    // 2. 初始化缓存（Vercel环境使用临时目录）
    const cachePath = process.env.VERCEL 
      ? path.join('/tmp', 'cache.json')
      : this.config.cache.path;
    const cache = new ArticleCache(cachePath);
    cache.load();

    // 3. 加载关键词配置
    let articleFilter: ArticleFilter | null = null;
    if (this.config.filter.enabled) {
      const keywordParser = new KeywordParser();
      let keywordsPath: string;
      if (process.env.VERCEL) {
        // Vercel 环境，尝试多种可能的配置文件路径
        const __filename = new URL(import.meta.url).pathname;
        const __dirname = path.dirname(__filename);
        
        // 尝试的路径列表
        const possiblePaths = [
          path.join(__dirname, '../config/keywords.txt'),     // dist/services/../config/keywords.txt
          path.join(__dirname, '../../config/keywords.txt'),  // /var/task/config/keywords.txt
          path.join(__dirname, '../../../config/keywords.txt') // 备用路径
        ];
        
        // 查找存在的配置文件
        const foundPath = possiblePaths.find(p => fs.existsSync(p));
        
        if (foundPath) {
          keywordsPath = foundPath;
        } else {
          // 如果都找不到，尝试使用环境变量
          const envConfigPath = process.env.CONFIG_PATH || '/var/task/config/keywords.txt';
          if (fs.existsSync(envConfigPath)) {
            keywordsPath = envConfigPath;
          } else {
            throw new Error(`关键词文件不存在于任何预期位置:\n${possiblePaths.join('\n')}\n环境变量路径: ${envConfigPath}`);
          }
        }
      } else {
        keywordsPath = this.config.filter.keywords_path;
      }
      const keywordConfig = keywordParser.parse(keywordsPath);
      articleFilter = new ArticleFilter(keywordConfig);
    }

    // 4. 执行任务（这里可以考虑缓存结果以提高性能）
    const fetcher = new RSSFetcher(
      this.config.rss.request_timeout,
      this.config.rss.max_article_age_days
    );
    const articles = await fetcher.fetchAllFeeds(
      feeds,
      this.config.rss.max_articles_per_feed
    );

    // 去重
    const uniqueArticles = articles.filter((article: Article) => !cache.has(article.link));

    if (uniqueArticles.length === 0) {
      return {
        articles: [],
        processInfo: {
          totalFetched: articles.length,
          afterDeduplication: 0,
          afterKeywordFilter: 0,
        },
      };
    }

    // 关键词过滤
    let filteredArticles = uniqueArticles;
    if (articleFilter && this.config.filter.enabled) {
      filteredArticles = articleFilter.filter(uniqueArticles);
    }

    if (filteredArticles.length === 0) {
      return {
        articles: [],
        processInfo: {
          totalFetched: articles.length,
          afterDeduplication: uniqueArticles.length,
          afterKeywordFilter: 0,
        },
      };
    }

    // 过滤掉没有摘要的文章
    filteredArticles = filteredArticles.filter((article: Article) => article.summary);

    // 按分类筛选
    if (category) {
      filteredArticles = filteredArticles.filter(
        (article: Article) => article.category === category
      );
    }

    // 按数量限制
    if (limit && limit > 0) {
      filteredArticles = filteredArticles.slice(0, limit);
    }

    // 更新缓存（缓存所有新文章，不仅仅是匹配的）
    uniqueArticles.forEach((article: Article) =>
      cache.add(article.link)
    );
    cache.save();

    const processInfo: ProcessInfo = {
      totalFetched: articles.length,
      afterDeduplication: uniqueArticles.length,
      afterKeywordFilter: filteredArticles.length,
    };

    return {
      articles: filteredArticles,
      processInfo,
    };
  }
}