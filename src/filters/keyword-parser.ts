import fs from 'fs';
import type { KeywordConfig, WordGroup } from './types.js';

export class KeywordParser {
  /**
   * 解析关键词配置文件
   * @param filePath 关键词文件路径
   * @returns 关键词配置
   */
  parse(filePath: string): KeywordConfig {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const lines = fileContent.split('\n').map(line => line.trim());

      const wordGroups: WordGroup[] = [];
      const filterWords: string[] = [];

      let currentGroup: { required: string[]; normal: string[] } = {
        required: [],
        normal: [],
      };

      for (const line of lines) {
        // 跳过空行和注释
        if (!line || line.startsWith('#')) {
          // 空行表示词组结束
          if (!line && (currentGroup.required.length > 0 || currentGroup.normal.length > 0)) {
            wordGroups.push({
              ...currentGroup,
              groupKey: `group_${wordGroups.length}`,
            });
            currentGroup = { required: [], normal: [] };
          }
          continue;
        }

        // 过滤词（以 ! 开头）
        if (line.startsWith('!')) {
          const word = line.substring(1).trim();
          if (word) {
            filterWords.push(word);
          }
          continue;
        }

        // 必须词（以 + 开头）
        if (line.startsWith('+')) {
          const word = line.substring(1).trim();
          if (word) {
            currentGroup.required.push(word);
          }
          continue;
        }

        // 普通词
        if (line) {
          currentGroup.normal.push(line);
        }
      }

      // 处理最后一个词组
      if (currentGroup.required.length > 0 || currentGroup.normal.length > 0) {
        wordGroups.push({
          ...currentGroup,
          groupKey: `group_${wordGroups.length}`,
        });
      }

      return { wordGroups, filterWords };
    } catch (error) {
      throw new Error(`关键词配置解析失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

