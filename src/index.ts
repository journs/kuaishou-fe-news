import { loadConfig } from "./config/config.js";
import { OPMLParser } from "./parsers/opml-parser.js";
import { RSSFetcher } from "./fetchers/rss-fetcher.js";
import { KeywordParser } from "./filters/keyword-parser.js";
import { ArticleFilter } from "./filters/article-filter.js";
import { ArticleCache } from "./cache/article-cache.js";
import { DingTalkNotifier } from "./notifiers/dingtalk.js";
import { Scheduler } from "./scheduler/scheduler.js";
import { AIFilter } from "./ai/ai-filter.js";
import { LanguageFilter } from "./filters/language-filter.js";

/**
 * 核心任务函数：抓取、过滤、推送
 */
export async function runTask() {
  // 1. 加载配置
  const config = loadConfig();

  // 2. 解析 OPML
  console.log("📡 解析 OPML 订阅源...");
  const parser = new OPMLParser();
  const feeds = parser.parse(config.rss.opml_path);
  console.log(`✅ 解析成功: ${feeds.length} 个订阅源\n`);
  // 3. 初始化缓存
  console.log("💾 加载文章缓存...");
  const cache = new ArticleCache(config.cache.path);
  cache.load();
  console.log("✅ 缓存加载成功\n");

  // 4. 加载关键词配置
  let articleFilter: ArticleFilter | null = null;
  if (config.filter.enabled) {
    console.log("🔍 加载关键词配置...");
    const keywordParser = new KeywordParser();
    const keywordConfig = keywordParser.parse(config.filter.keywords_path);
    articleFilter = new ArticleFilter(keywordConfig);
    console.log(
      `✅ 关键词配置加载成功: ${keywordConfig.wordGroups.length} 个词组, ${keywordConfig.filterWords.length} 个过滤词\n`
    );
  }

  // 5. 执行任务
  console.log("📥 开始抓取 RSS 源...");
  const fetcher = new RSSFetcher(
    config.rss.request_timeout,
    config.rss.max_article_age_days
  );
  const articles = await fetcher.fetchAllFeeds(
    feeds,
    config.rss.max_articles_per_feed
  );
  console.log(`✅ 抓取成功: ${articles.length} 篇文章\n`);

  // 去重
  console.log("🔄 过滤已推送的文章...");
  let newArticles = articles.filter((article) => !cache.has(article.link));
  console.log(`✅ 发现 ${newArticles.length} 篇新文章\n`);

  if (newArticles.length === 0) {
    console.log("ℹ️  没有新文章，跳过推送");
    return;
  }

  // 语言过滤 - 过滤掉英文文章，只保留中文文章
  console.log("🌐 过滤英文文章，保留中文文章...");
  const languageFilter = new LanguageFilter();
  const chineseArticles = languageFilter.filterChinese(newArticles);
  const englishArticles = languageFilter.filterEnglish(newArticles);
  
  console.log(`📊 语言过滤结果:`);
  console.log(`   中文文章: ${chineseArticles.length}`);
  console.log(`   英文文章: ${englishArticles.length} (已过滤)`);
  console.log("");

  // 使用中文文章继续后续流程
  newArticles = chineseArticles;

  if (newArticles.length === 0) {
    console.log("ℹ️  没有中文文章，跳过推送");
    // 仍然缓存这些文章，避免下次重复处理
    articles.filter((article) => !cache.has(article.link)).forEach((article) => cache.add(article.link));
    cache.save();
    return;
  }

  // 关键词过滤
  let filteredArticles = newArticles;
  if (articleFilter) {
    console.log("🔍 应用关键词过滤...");
    filteredArticles = articleFilter.filter(newArticles);

    const matchedCount = filteredArticles.length;
    const totalCount = newArticles.length;
    const matchRate = ((matchedCount / totalCount) * 100).toFixed(1);

    console.log(`📊 总文章数: ${totalCount}`);
    console.log(`✅ 匹配文章: ${matchedCount} (${matchRate}%)`);
    console.log(
      `⚠️  未匹配: ${totalCount - matchedCount} (${(
        100 - parseFloat(matchRate)
      ).toFixed(1)}%)\n`
    );
  }

  if (filteredArticles.length === 0) {
    console.log("ℹ️  没有匹配的文章，跳过推送");
    // 仍然缓存这些文章，避免下次重复处理
    newArticles.forEach((article) => cache.add(article.link));
    cache.save();
    return;
  }
  newArticles = newArticles.filter((articles) => articles.summary);
  console.log(newArticles)
  // AI 筛选
  if (config.ai.enabled) {
    console.log("🤖 启用 AI 筛选...");
    const aiFilter = new AIFilter(config.ai);
    filteredArticles = await aiFilter.filter(filteredArticles);

    if (filteredArticles.length === 0) {
      console.log("ℹ️  AI 筛选后没有文章，跳过推送");
      // 仍然缓存这些文章，避免下次重复处理
      newArticles.forEach((article) => cache.add(article.link));
      cache.save();
      return;
    }
    console.log("");
  }

  // 推送到钉钉
  console.log("� 推送到钉钉...");
  const notifier = new DingTalkNotifier();
  const success = await notifier.send(filteredArticles, config.dingtalk);

  if (success) {
    console.log(`✅ 推送成功: ${filteredArticles.length} 篇文章\n`);

    // 更新缓存（缓存所有新文章，不仅仅是匹配的）
    console.log("💾 更新缓存...");
    newArticles.forEach((article) => cache.add(article.link));
    cache.save();
    console.log("✅ 缓存已更新\n");

    // 定期清理缓存
    cache.cleanup(config.cache.retention_days);
  } else {
    console.log("❌ 推送失败\n");
  }
}

async function main() {
  console.log("========================================");
  console.log("🚀 RSS 技术资讯推送工具启动");
  console.log("========================================\n");

  console.log("📖 加载配置文件...");
  const config = loadConfig();
  console.log("✅ 配置加载成功\n");

  // 启动定时任务或立即执行
  if (config.scheduler.enabled) {
    console.log("⏰ 启动定时任务模式...\n");
    const scheduler = new Scheduler(config.scheduler.cron);
    scheduler.start(runTask);

    // 保持进程运行
    process.on("SIGINT", () => {
      console.log("\n\n收到退出信号，正在停止...");
      scheduler.stop();
      process.exit(0);
    });
  } else {
    console.log("🔧 单次执行模式...\n");
    await runTask();
    console.log("\n========================================");
    console.log("✅ 任务执行完成");
    console.log("========================================");
  }
}

// 启动程序
main().catch((error) => {
  console.error(
    "\n❌ 程序执行失败:",
    error instanceof Error ? error.message : String(error)
  );
  process.exit(1);
});
