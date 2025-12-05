import fs from 'fs';
import path from 'path';

interface CacheData {
  links: string[];
  lastCleanup: string;
}

export class ArticleCache {
  private cachePath: string;
  private links: Set<string>;
  private lastCleanup: Date;

  constructor(cachePath: string) {
    this.cachePath = cachePath;
    this.links = new Set();
    this.lastCleanup = new Date();
  }

  /**
   * 加载缓存
   */
  load(): void {
    try {
      // 确保目录存在
      const dir = path.dirname(this.cachePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 读取缓存文件
      if (fs.existsSync(this.cachePath)) {
        const content = fs.readFileSync(this.cachePath, 'utf8');
        const data: CacheData = JSON.parse(content);
        
        this.links = new Set(data.links || []);
        this.lastCleanup = data.lastCleanup ? new Date(data.lastCleanup) : new Date();
      }
    } catch (error) {
      console.warn('缓存加载失败，将重新初始化:', error instanceof Error ? error.message : String(error));
      this.links = new Set();
      this.lastCleanup = new Date();
    }
  }

  /**
   * 检查文章是否已缓存
   * @param articleLink 文章链接
   * @returns 是否已缓存
   */
  has(articleLink: string): boolean {
    return this.links.has(articleLink);
  }

  /**
   * 添加文章到缓存
   * @param articleLink 文章链接
   */
  add(articleLink: string): void {
    this.links.add(articleLink);
  }

  /**
   * 保存缓存
   */
  save(): void {
    try {
      const data: CacheData = {
        links: Array.from(this.links),
        lastCleanup: this.lastCleanup.toISOString(),
      };

      const dir = path.dirname(this.cachePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.cachePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error('缓存保存失败:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * 清理过期缓存
   * @param retentionDays 保留天数
   */
  cleanup(retentionDays: number): void {
    const now = new Date();
    const daysSinceLastCleanup = (now.getTime() - this.lastCleanup.getTime()) / (1000 * 60 * 60 * 24);

    // 如果距离上次清理不到保留天数，跳过
    if (daysSinceLastCleanup < retentionDays) {
      return;
    }

    // 简单策略：清空所有缓存（因为我们没有存储文章的时间戳）
    // 更好的做法是在 CacheData 中存储每个链接的时间戳
    console.log(`清理缓存: 已清理 ${this.links.size} 条记录`);
    this.links.clear();
    this.lastCleanup = now;
    this.save();
  }
}

