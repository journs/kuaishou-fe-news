import crypto from 'crypto';
import axios from 'axios';
import type { Article } from '../fetchers/rss-fetcher.js';

export interface DingTalkConfig {
  webhook: string;
  secret?: string;
  batch_size?: number;
}

export class DingTalkNotifier {
  /**
   * 发送文章到钉钉
   * @param articles 文章列表
   * @param config 钉钉配置
   * @returns 是否发送成功
   */
  async send(articles: Article[], config: DingTalkConfig): Promise<boolean> {
    if (articles.length === 0) {
      return true;
    }

    try {
      const message = this.formatMessage(articles);
      const batches = this.splitBatches(message, config.batch_size || 20000);

      for (const batch of batches) {
        await this.sendMessage(batch, config);
        
        // 批次间延迟，避免频率限制
        if (batches.length > 1) {
          await this.sleep(1000);
        }
      }

      return true;
    } catch (error) {
      console.error('钉钉推送失败:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  /**
   * 发送单条消息
   * @param content 消息内容
   * @param config 钉钉配置
   */
  private async sendMessage(content: string, config: DingTalkConfig): Promise<void> {
    let url = config.webhook;

    // 如果配置了 secret，生成签名
    if (config.secret) {
      const { timestamp, sign } = this.generateSign(config.secret);
      url = `${url}&timestamp=${timestamp}&sign=${sign}`;
    }

    const payload = {
      msgtype: 'markdown',
      markdown: {
        title: '前端技术资讯更新',
        text: content,
      },
    };

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    if (response.data.errcode !== 0) {
      throw new Error(`钉钉 API 错误: ${response.data.errmsg}`);
    }
  }

  /**
   * 生成钉钉签名
   * @param secret 密钥
   * @returns 时间戳和签名
   */
  private generateSign(secret: string): { timestamp: string; sign: string } {
    const timestamp = Date.now().toString();
    const stringToSign = `${timestamp}\n${secret}`;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(stringToSign);
    const sign = encodeURIComponent(hmac.digest('base64'));
    return { timestamp, sign };
  }

  /**
   * 格式化消息内容
   * @param articles 文章列表
   * @returns Markdown 格式的消息
   */
  private formatMessage(articles: Article[]): string {
    // 构建消息
    let message = `## 📚 前端技术资讯更新 (共 ${articles.length} 篇)\n\n`;

    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      const date = this.formatDate(article.published);

      // 基础格式：序号. 标题
      let line = `${i + 1}. [${article.title}](${article.link})`;

      // 如果有筛选理由，添加理由
      if (article.reason) {
        line += ` - ${article.reason}`;
      }

      // 添加发布日期
      line += ` - ${date}`;

      message += `${line}\n\n`;
    }

    return message;
  }

  /**
   * 格式化日期
   * @param dateString 日期字符串
   * @returns 格式化后的日期
   */
  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return dateString;
    }
  }

  /**
   * 分批消息（避免超过大小限制）
   * @param content 消息内容
   * @param maxBytes 最大字节数
   * @returns 分批后的消息列表
   */
  private splitBatches(content: string, maxBytes: number): string[] {
    const bytes = Buffer.byteLength(content, 'utf8');
    
    if (bytes <= maxBytes) {
      return [content];
    }

    // 简单策略：如果超过限制，按行分割
    // 更复杂的实现可以按订阅源分批
    const lines = content.split('\n');
    const batches: string[] = [];
    let currentBatch = '';

    for (const line of lines) {
      const testBatch = currentBatch + line + '\n';
      if (Buffer.byteLength(testBatch, 'utf8') > maxBytes) {
        if (currentBatch) {
          batches.push(currentBatch);
        }
        currentBatch = line + '\n';
      } else {
        currentBatch = testBatch;
      }
    }

    if (currentBatch) {
      batches.push(currentBatch);
    }

    return batches;
  }

  /**
   * 延迟函数
   * @param ms 毫秒数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

