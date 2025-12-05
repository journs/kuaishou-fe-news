import cron from 'node-cron';

export class Scheduler {
  private cronExpression: string;
  private task: cron.ScheduledTask | null = null;

  constructor(cronExpression: string) {
    this.cronExpression = cronExpression;
  }

  /**
   * 启动定时任务
   * @param taskFunction 要执行的任务函数
   */
  start(taskFunction: () => Promise<void>): void {
    if (!cron.validate(this.cronExpression)) {
      throw new Error(`无效的 Cron 表达式: ${this.cronExpression}`);
    }

    this.task = cron.schedule(this.cronExpression, async () => {
      console.log(`\n========================================`);
      console.log(`🚀 开始执行定时任务 - ${new Date().toLocaleString()}`);
      console.log(`========================================\n`);
      
      try {
        await taskFunction();
      } catch (error) {
        console.error('任务执行失败:', error instanceof Error ? error.message : String(error));
      }
      
      console.log(`\n========================================`);
      console.log(`✅ 任务执行完成 - ${new Date().toLocaleString()}`);
      console.log(`========================================\n`);
    });

    console.log(`⏰ 定时任务已启动，Cron 表达式: ${this.cronExpression}`);
  }

  /**
   * 停止定时任务
   */
  stop(): void {
    if (this.task) {
      this.task.stop();
      console.log('⏸️  定时任务已停止');
    }
  }
}

