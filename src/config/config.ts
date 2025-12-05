import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import dotenv from "dotenv";

// 加载环境变量
dotenv.config();

export interface Config {
  rss: {
    opml_path: string;
    max_articles_per_feed: number;
    request_timeout: number;
    max_article_age_days: number;
  };
  filter: {
    enabled: boolean;
    keywords_path: string;
  };
  dingtalk: {
    webhook: string;
    secret: string;
    batch_size: number;
  };
  scheduler: {
    enabled: boolean;
    cron: string;
  };
  cache: {
    path: string;
    retention_days: number;
  };
  server?: {
    port: number;
    cors: boolean;
  };
  api?: {
    default_limit: number;
    max_limit: number;
  };
  ai: {
    enabled: boolean;
    api_key: string;
    api_url: string;
    model: string;
    max_tokens: number;
    temperature: number;
    keywords_path: string;
    prompt: string;
  };
  language?: {
    enabled: boolean;
    filter_english: boolean; // true: 过滤英文文章, false: 过滤中文文章
  };
}

/**
 * 加载配置文件
 * 环境变量优先级高于配置文件
 */
export function loadConfig(): Config {
  // 适配不同环境的配置文件路径
  const configPath = process.env.NODE_ENV === "production" 
    ? path.resolve(process.cwd(), "config/config.yaml")
    : path.resolve(process.cwd(), "config/config.yaml");

  // 读取 YAML 配置文件
  let config: Config;
  try {
    const fileContent = fs.readFileSync(configPath, "utf8");
    config = yaml.load(fileContent) as Config;
  } catch (error) {
    throw new Error(`配置文件加载失败: ${configPath}`);
  }

  // 设置默认值
  if (config.rss.max_article_age_days === undefined) {
    config.rss.max_article_age_days = 7;
  }

  // 环境变量覆盖配置文件
  if (process.env.DINGTALK_WEBHOOK) {
    config.dingtalk.webhook = process.env.DINGTALK_WEBHOOK;
  }
  if (process.env.DINGTALK_SECRET) {
    config.dingtalk.secret = process.env.DINGTALK_SECRET;
  }
  if (process.env.CRON_SCHEDULE) {
    config.scheduler.cron = process.env.CRON_SCHEDULE;
  }
  if (process.env.FILTER_ENABLED !== undefined) {
    config.filter.enabled = process.env.FILTER_ENABLED === "true";
  }
  if (process.env.DEEPSEEK_API_KEY) {
    config.ai.api_key = process.env.DEEPSEEK_API_KEY;
  }
  if (process.env.AI_ENABLED !== undefined) {
    config.ai.enabled = process.env.AI_ENABLED === "true";
  }

  // 验证必填项（仅在需要推送功能时检查）
  // 注意：在API模式下，DingTalk配置不是必需的
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
    // Vercel环境（API模式），跳过DingTalk验证
  } else {
    // 本地环境或定时任务模式，需要DingTalk配置
    if (!config.dingtalk.webhook) {
      throw new Error(
        "钉钉 Webhook 未配置，请在 config.yaml 或 .env 中设置 DINGTALK_WEBHOOK"
      );
    }
  }

  return config;
}

