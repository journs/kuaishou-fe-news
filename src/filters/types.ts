export interface WordGroup {
  required: string[];   // 必须词（AND 逻辑）
  normal: string[];     // 普通词（OR 逻辑）
  groupKey: string;     // 词组标识
}

export interface KeywordConfig {
  wordGroups: WordGroup[];
  filterWords: string[];  // 过滤词（排除）
}

