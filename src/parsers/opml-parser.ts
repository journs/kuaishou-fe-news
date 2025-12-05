import fs from 'fs';
import { XMLParser } from 'fast-xml-parser';

export interface RSSFeed {
  name: string;
  url: string;
  category?: string;
}

export class OPMLParser {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
    });
  }

  /**
   * 解析 OPML 文件
   * @param filePath OPML 文件路径
   * @returns RSS 订阅源列表
   */
  parse(filePath: string): RSSFeed[] {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const result = this.parser.parse(fileContent);

      const feeds: RSSFeed[] = [];
      const body = result.opml?.body;

      if (!body) {
        throw new Error('OPML 文件格式错误：缺少 body 标签');
      }

      // 处理 outline 标签
      const outlines = Array.isArray(body.outline) ? body.outline : [body.outline];
      
      for (const outline of outlines) {
        this.extractFeeds(outline, feeds);
      }

      return feeds;
    } catch (error) {
      throw new Error(`OPML 解析失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 递归提取订阅源
   * @param outline outline 节点
   * @param feeds 订阅源列表
   * @param category 分类名称
   */
  private extractFeeds(outline: any, feeds: RSSFeed[], category?: string): void {
    if (!outline) return;

    // 如果有 xmlUrl，说明是订阅源
    if (outline.xmlUrl) {
      feeds.push({
        name: outline.text || outline.title || 'Unknown',
        url: outline.xmlUrl,
        category: category || outline.category,
      });
    }

    // 如果有子节点，递归处理（支持嵌套分类）
    if (outline.outline) {
      const children = Array.isArray(outline.outline) ? outline.outline : [outline.outline];
      const childCategory = outline.text || category;
      
      for (const child of children) {
        this.extractFeeds(child, feeds, childCategory);
      }
    }
  }
}

