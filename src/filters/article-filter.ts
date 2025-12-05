import type { Article } from '../fetchers/rss-fetcher.js';
import type { KeywordConfig, WordGroup } from './types.js';

export class ArticleFilter {
  private config: KeywordConfig;

  constructor(config: KeywordConfig) {
    this.config = config;
  }

  /**
   * 检查文章是否匹配关键词
   * @param article 文章
   * @returns 是否匹配
   */
  matches(article: Article): boolean {
    const text = `${article.title} ${article.summary || ''}`.toLowerCase();

    // 1. 检查过滤词（最高优先级）
    for (const filterWord of this.config.filterWords) {
      if (text.includes(filterWord.toLowerCase())) {
        return false;
      }
    }

    // 2. 检查词组匹配（任一词组匹配即通过）
    if (this.config.wordGroups.length === 0) {
      return true; // 没有词组配置，默认通过
    }

    for (const group of this.config.wordGroups) {
      if (this.matchesGroup(text, group)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 检查是否匹配词组
   * @param text 文本内容
   * @param group 词组
   * @returns 是否匹配
   */
  private matchesGroup(text: string, group: WordGroup): boolean {
    // 检查必须词（所有必须词都必须出现）
    for (const required of group.required) {
      if (!text.includes(required.toLowerCase())) {
        return false;
      }
    }

    // 检查普通词（至少一个普通词出现）
    if (group.normal.length > 0) {
      const hasNormalWord = group.normal.some(word => 
        text.includes(word.toLowerCase())
      );
      if (!hasNormalWord) {
        return false;
      }
    }

    return true;
  }

  /**
   * 过滤文章列表
   * @param articles 文章列表
   * @returns 匹配的文章列表
   */
  filter(articles: Article[]): Article[] {
    return articles.filter(article => this.matches(article));
  }
}

