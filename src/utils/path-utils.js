import fs from 'fs';
import path from 'path';

/**
 * Vercel 环境路径解析工具
 */
export class PathUtils {
  /**
   * 在 Vercel 环境中查找配置文件
   * @param relativePath 相对于当前文件的相对路径
   * @param possiblePaths 额外尝试的路径列表
   * @returns 找到的文件路径，如果都找不到返回 null
   */
  static findConfigFile(relativePath: string, possiblePaths: string[] = []): string | null {
    if (!process.env.VERCEL) {
      // 本地环境，直接返回相对路径
      return relativePath;
    }

    // 获取当前文件的目录（使用同步方式）
    const __filename = new URL(import.meta.url).pathname;
    const __dirname = path.dirname(__filename);

    // 构建可能的路径列表
    const pathsToTry = [
      path.join(__dirname, relativePath),           // 当前目录下的相对路径
      path.join(__dirname, '../', relativePath),    // 上一级目录
      path.join(__dirname, '../../', relativePath), // 上两级目录
      path.join(__dirname, '../../../', relativePath), // 上三级目录（Vercel 根目录）
      ...possiblePaths
    ];

    // 查找存在的文件
    for (const filePath of pathsToTry) {
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }

    // 尝试环境变量指定的路径
    const envPath = process.env.CONFIG_PATH;
    if (envPath && fs.existsSync(envPath)) {
      return envPath;
    }

    return null;
  }

  /**
   * 安全地加载配置文件，如果找不到会抛出详细错误
   * @param relativePath 相对于当前文件的相对路径
   * @param fileName 文件名（用于错误信息）
   * @param possiblePaths 额外尝试的路径列表
   */
  static loadConfigFile(relativePath: string, fileName: string, possiblePaths: string[] = []): string {
    const filePath = this.findConfigFile(relativePath, possiblePaths);
    
    if (filePath) {
      return filePath;
    }

    // 构建错误信息
    const __filename = new URL(import.meta.url).pathname;
    const __dirname = path.dirname(__filename);

    const defaultPaths = [
      path.join(__dirname, relativePath),
      path.join(__dirname, '../', relativePath),
      path.join(__dirname, '../../', relativePath),
      path.join(__dirname, '../../../', relativePath),
      ...possiblePaths
    ];

    const envPath = process.env.CONFIG_PATH || '/var/task/config/config.yaml';

    throw new Error(`${fileName} 不存在于任何预期位置:\n${defaultPaths.join('\n')}\n环境变量路径: ${envPath}`);
  }
}