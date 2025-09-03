const { Command } = require('commander');
const chalk = require('chalk');
const packageJson = require('../package.json');

// 导入命令处理模块
const versionCommand = require('./commands/version');
const setCommand = require('./commands/set');
const listCommand = require('./commands/list');
const useCommand = require('./commands/use');
const { testParallelCommand, testSerialCommand } = require('./commands/test');
const autoCommand = require('./commands/auto');

const program = new Command();

// 设置基本信息
program
  .name('ccapi')
  .description('Claude settings.json配置管理工具')
  .version(packageJson.version);

// 注册命令

// 版本命令
program
  .option('-v, --version', '显示版本信息')
  .action((options) => {
    if (options.version) {
      versionCommand();
    }
  });

// 设置命令
program
  .command('set')
  .description('设置配置文件路径')
  .option('--settings <path>', 'Claude Code settings.json文件路径')
  .option('--api <path>', '自定义API配置文件路径')
  .action(setCommand);

// 列举命令 (支持 ls 和 list 两个命令)
program
  .command('ls')
  .alias('list')
  .description('显示当前API配置列表')
  .action(listCommand);

// 使用命令
program
  .command('use <name>')
  .description('切换到指定的API配置')
  .option('-u, --url <index>', '指定要切换的URL索引（从1开始，仅对数组类型url有效）')
  .option('-k, --key <index>', '指定要切换的Key索引（从1开始，仅对数组类型key有效）')
  .option('-t, --token <index>', '指定要切换的Token索引（从1开始，仅对数组类型token有效）')
  .option('-m, --model <index>', '指定要切换的模型索引（从1开始，仅对数组类型model有效）')
  .option('-f, --fast <index>', '指定要切换的快速模型索引（从1开始，仅对数组类型fast有效）')
  .action((name, options) => {
    useCommand(name, options);
  });

// 测试命令
program
  .command('test [name]')
  .description('测试API配置的延迟')
  .option('-s, --serial', '最真实的测试配置在Claude Code中是否可用，提示：会在Claude Code中生成历史记录，介意勿用!')
  .option('-t, --token <index>', '指定要使用的Token索引（从1开始，仅在测试单个配置且使用-s时有效）')
  .option('-k, --key <index>', '指定要使用的Key索引（从1开始，仅在测试单个配置且使用-s时有效）')
  .action((name, options) => {
    if (options.serial) {
      const keyIndex = options.key ? parseInt(options.key) - 1 : 0;
      const tokenIndex = options.token ? parseInt(options.token) - 1 : 0;
      testSerialCommand(name, keyIndex, tokenIndex);
    } else {
      testParallelCommand(name);
    }
  });

// 自动选择命令
program
  .command('auto [name]')
  .description('自动测试并切换到最优配置')
  .action((name, options) => {
    autoCommand(name, options);
  });

// 全局错误处理
process.on('uncaughtException', (error) => {
  console.error(chalk.red('程序错误:'), error.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('未处理的Promise错误:'), reason);
  if (process.env.NODE_ENV === 'development') {
    console.error('Promise:', promise);
  }
  process.exit(1);
});

// 解析命令行参数
program.parse(process.argv);

// 如果没有提供任何参数，显示帮助信息
if (!process.argv.slice(2).length) {
  program.outputHelp();
}