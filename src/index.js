const { Command } = require('commander')
const chalk = require('chalk')
const packageJson = require('../package.json')
const { checkUpdateQuietly } = require('./utils/version-checker')
const { readConfig } = require('./utils/config')

// 导入命令处理模块
const versionCommand = require('./commands/version')
const setCommand = require('./commands/set')
const listCommand = require('./commands/list')
const useCommand = require('./commands/use')
const testCommand = require('./commands/test')
const autoCommand = require('./commands/auto')
const pingCommand = require('./commands/ping')
const updateCommand = require('./commands/update')
const envCommand = require('./commands/env')
const clearCommand = require('./commands/clear')

const program = new Command()

async function checkVersionInBackground() {
  try {
    const configData = await readConfig()
    const update = configData.update !== void 0 ? configData.update : true
    if (process.argv.includes('update') || !update) {
      return
    }
    const versionInfo = await checkUpdateQuietly()
    if (versionInfo.needsUpdate) {
      console.log(
        chalk.yellow(`【新版本v${versionInfo.latestVersion}可用，可执行 ${chalk.bold('`ccapi update`')} 进行更新】`)
      )
    }
  } catch (error) {}
}

// 设置基本信息
program.name('ccapi').description(packageJson.description).version(packageJson.version)

// 注册命令

// 版本命令
program.option('-v, --version', '显示版本信息').action(async () => {
  await versionCommand()
  await checkVersionInBackground()
})

// 设置命令
program
  .command('set')
  .description('设置配置文件路径')
  .option('--settings <path>', 'Claude Code settings.json文件路径')
  .option('--api <path>', '自定义API配置文件路径')
  .action(async (options) => {
    await setCommand(options)
    await checkVersionInBackground()
  })

// 列举命令 (支持 ls 和 list 两个命令)
program
  .command('ls')
  .alias('list')
  .description('显示当前API配置列表')
  .action(async () => {
    await listCommand()
    await checkVersionInBackground()
  })

// 使用命令
program
  .command('use <name>')
  .description('切换到指定的API配置')
  .option('-u, --url <index>', '指定要切换的URL索引（从1开始，仅对数组类型url有效）')
  .option('-k, --key <index>', '指定要切换的Key索引（从1开始，仅对数组类型key有效）')
  .option('-t, --token <index>', '指定要切换的Token索引（从1开始，仅对数组类型token有效）')
  .option('-m, --model <index>', '指定要切换的模型索引（从1开始，仅对数组类型model有效）')
  .option('-f, --fast <index>', '指定要切换的快速模型索引（从1开始，仅对数组类型fast有效）')
  .action(async (name, options) => {
    await useCommand(name, options)
    await checkVersionInBackground()
  })

// ping 命令
program
  .command('ping [name]')
  .description('测试API配置中所有URL的网络延迟')
  .action(async (name) => {
    await pingCommand(name)
    await checkVersionInBackground()
  })

// 测试命令
program
  .command('test [name]')
  .description('测试API配置在Claude Code中是否可用')
  .option('-t, --token <index>', '指定要使用的Token索引（从1开始，仅在测试单个配置时有效）')
  .option('-k, --key <index>', '指定要使用的Key索引（从1开始，仅在测试单个配置时有效）')
  .action(async (name, options) => {
    const keyIndex = options.key ? parseInt(options.key) - 1 : 0
    const tokenIndex = options.token ? parseInt(options.token) - 1 : 0
    await testCommand(name, keyIndex, tokenIndex)
    await checkVersionInBackground()
  })

// 自动选择命令
program
  .command('auto [name]')
  .description('自动测试API配置并切换到最优配置')
  .option('-p, --ping', '使用ping测试延迟结果选择最优配置切换（快速且只验证网站URL延迟）')
  .option('-t, --test', '使用test测试结果选择最优配置切换（稍慢但验证真实API可用性）')
  .action(async (name, options) => {
    await autoCommand(name, options)
    await checkVersionInBackground()
  })

// update 命令
program
  .command('update')
  .description('更新ccapi到最新版本')
  .action(() => {
    updateCommand()
  })

// env 命令
program
  .command('env [name]')
  .description('环境变量管理：设置/查看/清除系统环境变量')
  .option('-u, --url <index>', '指定要使用的URL索引（从1开始，仅对数组类型url有效）')
  .option('-k, --key <index>', '指定要使用的Key索引（从1开始，仅对数组类型key有效）')
  .option('-t, --token <index>', '指定要使用的Token索引（从1开始，仅对数组类型token有效）')
  .option('-m, --model <index>', '指定要使用的模型索引（从1开始，仅对数组类型model有效）')
  .option('-f, --fast <index>', '指定要使用的快速模型索引（从1开始，仅对数组类型fast有效）')
  .action(async (name, options) => {
    await envCommand(name, options)
    await checkVersionInBackground()
  })

// clear 命令
program
  .command('clear')
  .description('完全清除配置：同时清除settings.json和系统环境变量相关API配置')
  .action(async () => {
    await clearCommand()
    await checkVersionInBackground()
  })

// 全局错误处理
process.on('uncaughtException', (error) => {
  console.error(chalk.red('程序错误:'), error.message)
  if (process.env.NODE_ENV === 'development') {
    console.error(error.stack)
  }
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('未处理的Promise错误:'), reason)
  if (process.env.NODE_ENV === 'development') {
    console.error('Promise:', promise)
  }
  process.exit(1)
})

// 解析命令行参数
program.parse(process.argv)

// 如果没有提供任何参数，显示帮助信息
if (!process.argv.slice(2).length) {
  program.outputHelp()
}
