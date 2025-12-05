import { loadConfig } from "../config/config.js";
import { OPMLParser } from "../parsers/opml-parser.js";
import { RSSFetcher } from "../fetchers/rss-fetcher.js";
import { KeywordParser } from "../filters/keyword-parser.js";
import { ArticleFilter } from "../filters/article-filter.js";
import { ArticleCache } from "../cache/article-cache.js";
import { LanguageFilter } from "../filters/language-filter.js";
import type { Article } from "../fetchers/rss-fetcher.js";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

export interface ProcessInfo {
  totalFetched: number;
  afterDeduplication: number;
  afterLanguageFilter: number;
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
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      opmlPath = path.join(__dirname, '../config/feeds.opml');
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
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        keywordsPath = path.join(__dirname, '../config/keywords.txt');
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
    let newArticles = articles.filter((article) => !cache.has(article.link));

    if (newArticles.length === 0) {
      return {
        articles: [],
        processInfo: {
          totalFetched: articles.length,
          afterDeduplication: 0,
          afterLanguageFilter: 0,
          afterKeywordFilter: 0,
        },
      };
    }

    // 语言过滤 - 过滤掉英文文章，只保留中文文章
    const languageFilter = new LanguageFilter();
    const chineseArticles = languageFilter.filterChinese(newArticles);
    const englishArticles = languageFilter.filterEnglish(newArticles);

    // 使用中文文章继续后续流程
    newArticles = chineseArticles;

    if (newArticles.length === 0) {
      return {
        articles: [],
        processInfo: {
          totalFetched: articles.length,
          afterDeduplication: articles.filter((a) => !cache.has(a.link)).length,
          afterLanguageFilter: 0,
          afterKeywordFilter: 0,
        },
      };
    }

    // 关键词过滤
    let filteredArticles = newArticles;
    if (articleFilter) {
      filteredArticles = articleFilter.filter(newArticles);
    }

    if (filteredArticles.length === 0) {
      return {
        articles: [],
        processInfo: {
          totalFetched: articles.length,
          afterDeduplication: articles.filter((a) => !cache.has(a.link)).length,
          afterLanguageFilter: chineseArticles.length,
          afterKeywordFilter: 0,
        },
      };
    }

    // 过滤掉没有摘要的文章（对应原代码第111-112行）
    filteredArticles = filteredArticles.filter((article) => article.summary);

    // 按分类筛选
    if (category) {
      filteredArticles = filteredArticles.filter(
        (article) => article.category === category
      );
    }

    // 按数量限制
    if (limit && limit > 0) {
      filteredArticles = filteredArticles.slice(0, limit);
    }

    // 更新缓存（缓存所有新文章，不仅仅是匹配的）
    articles.filter((article) => !cache.has(article.link)).forEach((article) =>
      cache.add(article.link)
    );
    cache.save();

    const processInfo: ProcessInfo = {
      totalFetched: articles.length,
      afterDeduplication: articles.filter((a) => !cache.has(a.link)).length,
      afterLanguageFilter: chineseArticles.length,
      afterKeywordFilter: filteredArticles.length,
    };

    return {
      articles: filteredArticles,
      processInfo,
    };
  }
}