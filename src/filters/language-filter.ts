import type { Article } from '../fetchers/rss-fetcher.js';

export class LanguageFilter {
  /**
   * 检测文本是否为中文
   * @param text 待检测的文本
   * @returns 是否为中文
   */
  private isChinese(text: string): boolean {
    // 中文字符的正则表达式
    const chineseRegex = /[\u4e00-\u9fff]/;
    
    // 计算中文字符数量
    const chineseMatches = text.match(/[\u4e00-\u9fff]/g);
    const chineseCount = chineseMatches ? chineseMatches.length : 0;
    
    // 计算总字符数（排除空格和标点）
    const totalChars = text.replace(/[\s\p{P}]/gu, '').length;
    
    // 如果中文字符占比超过30%，认为是中文文章
    if (totalChars === 0) return false;
    const chineseRatio = chineseCount / totalChars;
    
    return chineseRatio > 0.3;
  }

  /**
   * 检查文章是否为中文文章
   * @param article 文章
   * @returns 是否为中文文章
   */
  isChineseArticle(article: Article): boolean {
    const title = article.title || '';
    const summary = article.summary || '';
    const text = `${title} ${summary}`;
    
    return this.isChinese(text);
  }

  /**
   * 过滤出中文文章
   * @param articles 文章列表
   * @returns 中文文章列表
   */
  filterChinese(articles: Article[]): Article[] {
    return articles.filter(article => this.isChineseArticle(article));
  }

  /**
   * 过滤出英文文章
   * @param articles 文章列表
   * @returns 英文文章列表
   */
  filterEnglish(articles: Article[]): Article[] {
    return articles.filter(article => !this.isChineseArticle(article));
  }
}
