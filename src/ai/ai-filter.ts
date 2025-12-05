import axios from "axios";
import fs from "fs";
import type { Article } from "../fetchers/rss-fetcher.js";
import type {
  AIFilterConfig,
  AIFilterResponse,
  AIArticleInput,
} from "./types.js";
import { articleToAIInput } from "./types.js";

/**
 * AI 文章筛选器
 * 使用 DeepSeek API 对文章进行智能筛选
 */
export class AIFilter {
  private config: AIFilterConfig;
  private keywords: string = "";

  constructor(config: AIFilterConfig) {
    this.config = config;
    this.loadKeywords();
  }

  /**
   * 加载关键词文件
   */
  private loadKeywords(): void {
    if (!this.config.keywords_path) {
      return;
    }

    try {
      // 适配 Vercel 环境的路径
      let keywordsPath = this.config.keywords_path;
      if (process.env.VERCEL) {
        const path = require('path');
        const { fileURLToPath } = require('url');
        const { dirname } = require('path');
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        
        // 尝试多种可能的路径
        const possiblePaths = [
          path.join(__dirname, '../config/keywords.txt'),
          path.join(__dirname, '../../config/keywords.txt'),
          '/var/task/config/keywords.txt'
        ];
        
        keywordsPath = possiblePaths.find(p => fs.existsSync(p)) || keywordsPath;
      }

      const content = fs.readFileSync(keywordsPath, "utf8");
      this.keywords = content.trim();
      console.log(`✅ 成功加载关键词文件: ${keywordsPath}`);
    } catch (error) {
      console.warn(
        `⚠️  无法读取关键词文件: ${this.config.keywords_path}`
      );
      console.warn(`错误详情: ${error instanceof Error ? error.message : String(error)}`);
      this.keywords = "";
    }
  }

  /**
   * 构建发送给 AI 的系统提示词
   */
  private buildSystemPrompt(): string {
    let systemPrompt = `你是一个专业的技术文章筛选助手。你的任务是根据用户的筛选要求和关键词配置，从给定的文章列表中选出符合要求的文章。

**重要：你必须严格按照以下 JSON 格式返回结果，不要包含任何其他文本：**

{
  "selectedArticles": [
    {
      "link": "文章的完整链接",
      "reason": "筛选原因（必填，简洁说明为什么选择这篇文章，10-50字）"
    }
  ],
  "summary": "筛选总结（可选）"
}

**注意事项：**
1. selectedArticles 数组中的每个对象必须包含 link 字段，该字段的值必须与输入文章的 link 完全一致
2. 只返回符合筛选要求的文章
3. 如果没有符合要求的文章，返回空数组
4. 确保返回的是有效的 JSON 格式`;

    // 如果有关键词配置，添加到系统提示词中
    if (this.keywords) {
      systemPrompt += `

**用户配置的关键词：**
以下是用户配置的关键词文件内容，请在筛选时参考这些关键词：

\`\`\`
${this.keywords}
\`\`\`

关键词说明：
- 普通词：文章应该包含这些关键词
- 以 + 开头的词：必须词，文章必须包含
- 以 ! 开头的词：过滤词，包含这些词的文章应该排除
- 空行分隔的是不同的词组，满足任一词组即可`;
    }

    return systemPrompt;
  }

  /**
   * 构建用户提示词
   */
  private buildUserPrompt(
    articles: AIArticleInput[],
    userRequirement: string
  ): string {
    const articlesJson = JSON.stringify(articles, null, 2);
    return `**筛选要求：**
${userRequirement}

**待筛选的文章列表：**
${articlesJson}

请根据筛选要求，从上述文章中选出符合条件的文章，并按照指定的 JSON 格式返回结果。`;
  }

  /**
   * 调用 DeepSeek API 进行筛选
   */
  private async callDeepSeekAPI(
    articles: AIArticleInput[],
    userRequirement: string
  ): Promise<AIFilterResponse> {
    try {
      const response = await axios.post(
        this.config.api_url,
        {
          model: this.config.model,
          messages: [
            {
              role: "system",
              content: this.buildSystemPrompt(),
            },
            {
              role: "user",
              content: this.buildUserPrompt(articles, userRequirement),
            },
          ],
          max_tokens: this.config.max_tokens,
          temperature: this.config.temperature,
          response_format: { type: "json_object" }, // 强制返回 JSON
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.api_key}`,
          },
          timeout: 60000, // 60秒超时
        }
      );

      // 解析 AI 返回的内容
      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error("AI 返回内容为空");
      }

      // 解析 JSON
      const result: AIFilterResponse = JSON.parse(content);

      // 验证返回格式
      if (!result.selectedArticles || !Array.isArray(result.selectedArticles)) {
        throw new Error("AI 返回格式错误：缺少 selectedArticles 数组");
      }

      return result;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.error?.message || error.message;
        throw new Error(`DeepSeek API 调用失败 [${status}]: ${message}`);
      }
      throw error;
    }
  }

  /**
   * 筛选文章
   * @param articles 待筛选的文章列表
   * @returns 筛选后的文章列表
   */
  async filter(articles: Article[]): Promise<Article[]> {
    if (!this.config.enabled) {
      return articles;
    }

    if (articles.length === 0) {
      return articles;
    }

    try {
      console.log(`🤖 使用 AI 筛选文章 (共 ${articles.length} 篇)...`);

      // 转换为 AI 输入格式
      const aiInputs = articles.map(articleToAIInput);

      // 调用 AI API
      const aiResponse = await this.callDeepSeekAPI(
        aiInputs,
        this.config.prompt
      );

      // 根据 AI 返回的 link 筛选原始文章，并附加筛选理由
      const reasonMap = new Map(
        aiResponse.selectedArticles.map((item) => [item.link, item.reason])
      );

      const selectedLinks = new Set(
        aiResponse.selectedArticles.map((item) => item.link)
      );
      const filteredArticles = articles
        .filter((article) => selectedLinks.has(article.link))
        .map((article) => ({
          ...article,
          reason: reasonMap.get(article.link), // 附加筛选理由
        }));

      console.log(
        `✅ AI 筛选完成: ${filteredArticles.length}/${articles.length} 篇文章被选中`
      );

      if (aiResponse.summary) {
        console.log(`📝 筛选总结: ${aiResponse.summary}`);
      }

      // 打印筛选原因（如果有）
      filteredArticles.forEach((article) => {
        if (article.reason) {
          console.log(`   - ${article.title}: ${article.reason}`);
        }
      });

      return filteredArticles;
    } catch (error) {
      console.error(
        `❌ AI 筛选失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      console.log("⚠️  将返回原始文章列表（不进行 AI 筛选）");
      return articles;
    }
  }
}

